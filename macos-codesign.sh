#!/usr/bin/env bash
# macos-codesign.sh — sign + notarise macOS binaries from Linux using rcodesign.
#
#   ./macos-codesign.sh setup              Interactive setup AND repair. Safe to re-run any
#                                          time: every stage validates what's already there,
#                                          skips what works, and moves broken files aside
#                                          (to ~/.codesign/broken-<timestamp>) before redoing it.
#   ./macos-codesign.sh sign <bin> [...]   Sign + notarise. Non-interactive (turbo/CI).
#                                          Validates first; tells you to run setup if not.
#   ./macos-codesign.sh clean              Shred files no longer needed (keeps the 3 that matter).
#
# rcodesign is installed automatically if missing (pinned, checksum-verified prebuilt
# binary into ~/.local/bin, falling back to `cargo install`).
#
# Env:
#   CODESIGN_DIR           where secrets live (default ~/.codesign)
#   CODESIGN_ENTITLEMENTS  optional entitlements plist (needed for embedded Node/Bun JIT)
#   SKIP_NOTARIZE=1        sign only, skip notarisation
set -euo pipefail

DIR="${CODESIGN_DIR:-$HOME/.codesign}"
KEY="$DIR/devid.key"
CSR="$DIR/devid.csr"
CER="$DIR/developerID_application.cer"
CRT="$DIR/devid.crt"
P12="$DIR/devid.p12"
PASS="$DIR/p12.pass"
ASC="$DIR/asc.json"
TMPD=""
trap 'rm -rf "${TMPD:-}"' EXIT

# ---------------------------------------------------------------- helpers

say()   { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok()    { printf '\033[32m✓ %s\033[0m\n' "$*"; }
warn()  { printf '\033[33m! %s\033[0m\n' "$*" >&2; }
die()   { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
need()  { command -v "$1" >/dev/null || die "Missing '$1'. Install with: $2"; }
pause() { local _; read -rp $'\nPress Enter (or type "continue") when done: ' _ </dev/tty; }
newest(){ ls -1t "$@" 2>/dev/null | head -n1 || true; }

archive() { # move files aside instead of deleting them
  local d="" f moved=()
  for f in "$@"; do
    [[ -e $f ]] || continue
    [[ -n $d ]] || d="$(mktemp -d "$DIR/broken-$(date +%Y%m%d-%H%M%S)-XXXX")"
    mv "$f" "$d"/ && moved+=("$(basename "$f")")
  done
  [[ ${#moved[@]} -eq 0 ]] || warn "Moved aside to $d: ${moved[*]}"
}

ask_file() { # $1 = prompt, $2 = default guess. Prints the chosen path.
  local f
  while :; do
    read -rp "$1${2:+ [$2]}: " f </dev/tty
    f="${f:-${2:-}}"; f="${f/#\~/$HOME}"
    [[ -n $f && -f $f ]] && { printf '%s' "$f"; return; }
    echo "  Not found: ${f:-<empty>}" >&2
  done
}

ask_match() { # $1 = prompt, $2 = regex, $3 = hint shown on bad input. Prints the value.
  local v
  while :; do
    read -rp "$1: " v </dev/tty
    v="${v//[[:space:]]/}"
    [[ $v =~ $2 ]] && { printf '%s' "$v"; return; }
    echo "  '$v' doesn't look right. $3" >&2
  done
}

UUID_RE='^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$'
KEYID_RE='^[A-Z0-9]{10}$'

# ---------------------------------------------------------------- rcodesign install

RCODESIGN_VERSION="0.29.0"
BIN_DIR="$HOME/.local/bin"

persist_path() { # add ~/.local/bin to the user's shell rc, once
  local rc line='export PATH="$HOME/.local/bin:$PATH"'
  case "${SHELL:-}" in
    */zsh)  rc="$HOME/.zshrc" ;;
    */bash) rc="$HOME/.bashrc" ;;
    *)      rc="$HOME/.profile" ;;
  esac
  if ! grep -qsF "$line" "$rc"; then
    printf '\n%s\n' "$line" >> "$rc"
    warn "Added ~/.local/bin to PATH in $rc (open a new shell or: source $rc)"
  fi
}

ensure_rcodesign() {
  export PATH="$BIN_DIR:$HOME/.cargo/bin:$PATH"
  if command -v rcodesign >/dev/null; then
    [[ $(command -v rcodesign) == "$BIN_DIR/rcodesign" ]] && persist_path
    return 0
  fi

  say "Installing rcodesign $RCODESIGN_VERSION"
  local arch sha url t
  case "$(uname -m)" in
    aarch64|arm64) arch=aarch64; sha=4af92c87ddf52f5f2d1258a3b4e56c7dcb8f1b2468df744976c5f139e031961f ;;
    x86_64|amd64)  arch=x86_64;  sha=dbe85cedd8ee4217b64e9a0e4c2aef92ab8bcaaa41f20bde99781ff02e600002 ;;
    *)             arch="" ;;
  esac

  if [[ -n $arch ]] && command -v curl >/dev/null; then
    url="https://github.com/indygreg/apple-platform-rs/releases/download/apple-codesign%2F${RCODESIGN_VERSION}/apple-codesign-${RCODESIGN_VERSION}-${arch}-unknown-linux-musl.tar.gz"
    t="$(mktemp -d)"
    if curl -fsSL -o "$t/rc.tgz" "$url" \
       && echo "$sha  $t/rc.tgz" | sha256sum -c --quiet - \
       && tar -xzf "$t/rc.tgz" -C "$t"; then
      mkdir -p "$BIN_DIR"
      install -m 755 "$(find "$t" -type f -name rcodesign | head -n1)" "$BIN_DIR/rcodesign"
      rm -rf "$t"
      persist_path
      ok "Installed $BIN_DIR/rcodesign"
      return 0
    fi
    rm -rf "$t"
    warn "Prebuilt download failed or checksum mismatch — falling back to cargo"
  fi

  command -v cargo >/dev/null || die "Couldn't install rcodesign. Install Rust (https://rustup.rs) and re-run."
  cargo install --locked --version "$RCODESIGN_VERSION" apple-codesign
  command -v rcodesign >/dev/null || die "rcodesign installed but not on PATH (expected ~/.cargo/bin)."
  ok "Installed $(command -v rcodesign)"
}

# ---------------------------------------------------------------- validators

# .p12 must open in rcodesign itself (it can't read OpenSSL 3's default AES .p12).
p12_ok() {
  [[ -f $P12 && -f $PASS ]] && rcodesign generate-certificate-signing-request \
    --p12-file "$P12" --p12-password-file "$PASS" >/dev/null 2>&1
}

cert_matches_key() { [[ "$(openssl x509 -inform DER -in "$1" -noout -pubkey 2>/dev/null)" == "$(openssl pkey -in "$KEY" -pubout)" ]]; }
cert_is_devid()    { openssl x509 -inform "$2" -in "$1" -noout -subject 2>/dev/null | grep -q 'Developer ID Application'; }
cert_valid_for()   { openssl x509 -inform "$2" -in "$1" -noout -checkend "$3" >/dev/null 2>&1; } # $3 = seconds

asc_field() { sed -n "s/.*\"$1\" *: *\"\([^\"]*\)\".*/\1/p" "$ASC" | head -n1; }

clock_ok() { # Apple rejects API tokens if the VM clock drifts
  command -v curl >/dev/null || return 0
  local d s
  d="$(curl -sI --max-time 10 https://appstoreconnect.apple.com 2>/dev/null | tr -d '\r' | sed -n 's/^[Dd]ate: //p' | head -n1)"
  [[ -n $d ]] || return 0
  s=$(( $(date -u +%s) - $(date -u -d "$d" +%s) )); s=${s#-}
  [[ $s -le 120 ]] && return 0
  warn "VM clock is ${s}s off Apple's. Fix with: sudo timedatectl set-ntp true  (or: limactl restart <vm>)"
  return 1
}

# 0 = works. 1 = file is bad (explained). Dies if Apple can't be reached / clock is off,
# so a good file is never thrown away because of a network or clock problem.
asc_valid() {
  [[ -f $ASC ]] || return 1
  local iss kid out
  iss="$(asc_field issuer_id)"; kid="$(asc_field key_id)"
  [[ $iss =~ $UUID_RE ]] || { warn "Issuer ID '$iss' is wrong — it must be the UUID shown on the Team Keys page (not the company name or Team ID)"; return 1; }
  [[ $kid =~ $KEYID_RE ]] || { warn "Key ID '$kid' is wrong — it's the 10-character ID next to the key"; return 1; }
  clock_ok || die "Fix the clock, then re-run."
  if out="$(rcodesign notary-list --api-key-file "$ASC" 2>&1)"; then return 0; fi
  if grep -qiE 'unauthenticated|unauthori[sz]ed|401' <<<"$out"; then
    warn "Apple rejected the API key. Usual causes: wrong Issuer ID, an Individual key instead of a Team key, a revoked key, or a key created < 2 min ago"
    return 1
  fi
  printf '%s\n' "$out" >&2
  die "Couldn't verify the API key with Apple (network?). asc.json left untouched."
}

# ---------------------------------------------------------------- setup stages

stage_deps() {
  say "1/5 Dependencies"
  need openssl "sudo apt install -y openssl"
  need zip     "sudo apt install -y zip"
  need shred   "sudo apt install -y coreutils"
  need curl    "sudo apt install -y curl"
  ensure_rcodesign
  mkdir -p "$DIR" && chmod 700 "$DIR"
  ok "$(rcodesign --version 2>/dev/null | head -n1)"
}

# Repair the signing identity before the normal stages run.
heal_identity() {
  if [[ -f $P12 ]] && ! p12_ok; then
    if [[ -f $KEY ]]; then
      warn "devid.p12 won't open in rcodesign — rebuilding it from devid.key"
      archive "$P12" "$PASS"
    else
      warn "devid.p12 won't open and devid.key is gone — starting the identity fresh (the old Apple cert is just left unused)"
      archive "$P12" "$PASS" "$CER" "$CRT" "$CSR"
    fi
  fi

  if p12_ok; then
    if [[ ! -f $CRT ]]; then
      openssl pkcs12 -legacy -in "$P12" -passin "file:$PASS" -nokeys -clcerts 2>/dev/null \
        | openssl x509 -out "$CRT"
    fi
    if ! cert_is_devid "$CRT" PEM; then
      warn "The certificate in devid.p12 isn't a 'Developer ID Application' cert — starting fresh"
      archive "$P12" "$PASS" "$CER" "$CRT" "$CSR" "$KEY"
    elif ! cert_valid_for "$CRT" PEM 0; then
      warn "The Developer ID certificate has expired — starting fresh"
      archive "$P12" "$PASS" "$CER" "$CRT" "$CSR" "$KEY"
    elif ! cert_valid_for "$CRT" PEM $((30*86400)); then
      warn "The Developer ID certificate expires within 30 days. To renew: mv $P12 $P12.old && $0 setup"
    fi
  fi

  # A CSR that doesn't belong to the current key is useless.
  if [[ -f $KEY && -f $CSR ]] && \
     [[ "$(openssl req -in "$CSR" -noout -pubkey 2>/dev/null)" != "$(openssl pkey -in "$KEY" -pubout)" ]]; then
    archive "$CSR"
  fi
}

stage_csr() {
  say "2/5 Private key + CSR"
  if p12_ok; then ok "Signing identity already set up — skipping"; return; fi
  if [[ ! -f $KEY ]]; then
    (umask 077; openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$KEY" 2>/dev/null)
    archive "$CSR" "$CER" "$CRT"
  fi
  [[ -f $CSR ]] || rcodesign generate-certificate-signing-request \
    --pem-file "$KEY" --csr-pem-file "$CSR" >/dev/null 2>&1
  ok "CSR ready: $CSR"
}

cert_acceptable() { # explains why not, on stderr
  if ! openssl x509 -inform DER -in "$1" -noout 2>/dev/null; then
    echo "  That isn't a downloaded Apple certificate (.cer). Try again." >&2; return 1
  fi
  if ! cert_is_devid "$1" DER; then
    echo "  That's not a 'Developer ID Application' certificate. Create that type." >&2; return 1
  fi
  if ! cert_matches_key "$1"; then
    echo "  That cert belongs to a different (older) key. Upload the current CSR and use the new download." >&2; return 1
  fi
}

stage_cert() {
  say "3/5 Developer ID Application certificate"
  if p12_ok; then ok "skipping"; return; fi
  if [[ -f $CER ]]; then
    if cert_acceptable "$CER" 2>/dev/null; then ok "Matching certificate already present"; return; fi
    archive "$CER"
  fi

  local share=""
  if [[ -d /tmp/lima && -w /tmp/lima ]]; then
    cp "$CSR" /tmp/lima/devid.csr && share="/tmp/lima/devid.csr"
  fi

  echo
  echo "  1. Open: https://developer.apple.com/account/resources/certificates/add"
  echo "  2. Select 'Developer ID Application' → Continue → Profile Type 'G2 Sub-CA'"
  if [[ -n $share ]]; then
    echo "  3. Upload the CSR from your Mac at: $share"
  else
    echo "  3. On your Mac, copy the CSR below, run:  pbpaste > ~/Downloads/devid.csr"
    echo "     then upload ~/Downloads/devid.csr"
    echo; cat "$CSR"
  fi
  echo "  4. Click Download to save the .cer"
  echo
  echo "  (If this VM can't see your Mac's Downloads folder, run on the Mac:"
  echo "   limactl copy ~/Downloads/developerID_application.cer ${HOSTNAME#lima-}:/tmp/  and enter /tmp/developerID_application.cer)"
  pause

  local f
  while :; do
    f="$(ask_file "Path to the downloaded .cer" \
      "$(newest /Users/*/Downloads/developerID_application*.cer "$HOME"/Downloads/developerID_application*.cer /tmp/developerID_application*.cer)")"
    cert_acceptable "$f" || continue
    [[ $f -ef $CER ]] || cp "$f" "$CER"
    break
  done
  ok "Certificate matches your key"
}

stage_p12() {
  say "4/5 Encrypted .p12 (random password — nothing to type)"
  if p12_ok; then ok "devid.p12 opens fine — skipping"; return; fi
  [[ -f $KEY ]] || die "devid.key is missing. Re-run setup to start fresh."

  openssl x509 -inform DER -in "$CER" -out "$CRT"
  (umask 077; openssl rand -hex 32 > "$PASS"
   openssl pkcs12 -export -legacy -inkey "$KEY" -in "$CRT" \
     -name "Developer ID Application" -out "$P12" -passout "file:$PASS")
  p12_ok || die "rcodesign can't read devid.p12. Nothing deleted; devid.key kept."
  shred -u "$KEY"
  ok "devid.p12 + p12.pass created; plaintext key shredded"
}

stage_asc() {
  say "5/5 App Store Connect API key (for notarisation)"
  if [[ -f $ASC ]]; then
    if asc_valid; then ok "asc.json works with Apple — skipping"; return; fi
    archive "$ASC"
  fi

  echo
  echo "  1. Open: https://appstoreconnect.apple.com/access/integrations/api"
  echo "  2. Use the 'Team Keys' tab (NOT Individual Keys). '+' → Name: rcodesign, Access: Developer"
  echo "  3. Copy the Issuer ID — the UUID at the top of the Team Keys page"
  echo "  4. Download the .p8 (one download only). Reusing an existing key's .p8 is fine."
  pause

  local p8 kid iss rc
  while :; do
    p8="$(ask_file "Path to AuthKey_XXXXXXXXXX.p8" \
      "$(newest /Users/*/Downloads/AuthKey_*.p8 "$HOME"/Downloads/AuthKey_*.p8 /tmp/AuthKey_*.p8)")"
    grep -q 'BEGIN PRIVATE KEY' "$p8" || { echo "  That isn't a .p8 API key." >&2; continue; }

    if [[ $(basename "$p8") =~ ^AuthKey_([A-Z0-9]{10})\.p8$ ]]; then
      kid="${BASH_REMATCH[1]}"; ok "Key ID: $kid (from filename)"
    else
      kid="$(ask_match "Key ID" "$KEYID_RE" "It's the 10-character ID next to the key.")"
    fi
    iss="$(ask_match "Issuer ID (UUID at top of Team Keys page)" "$UUID_RE" \
      "It's a UUID like 69a6de7e-1234-47e3-e053-5b8c7c11a4d1 — not the company name or Team ID.")"

    (umask 077; rcodesign encode-app-store-connect-api-key -o "$ASC" "$iss" "$kid" "$p8" >/dev/null)
    rc=0; asc_valid || rc=$?
    [[ $rc -eq 0 ]] && break
    rm -f "$ASC"
    echo "  Let's try that again." >&2
  done
  ok "asc.json verified with Apple"
  warn "Back up $p8 in your password manager, then delete it from your Mac"
}

cmd_setup() {
  stage_deps
  heal_identity
  stage_csr
  stage_cert
  stage_p12
  stage_asc
  say "All good"
  echo "  Back up these to your password manager:"
  echo "    $P12"
  echo "    $PASS"
  echo "    $ASC"
  echo
  echo "  Sign with:  $0 sign path/to/binary"
}

# ---------------------------------------------------------------- clean

cmd_clean() {
  ensure_rcodesign
  p12_ok || die "devid.p12 isn't working — run setup first; not cleaning anything."
  [[ -f $CRT ]] || openssl pkcs12 -legacy -in "$P12" -passin "file:$PASS" -nokeys -clcerts 2>/dev/null \
    | openssl x509 -out "$CRT"

  local junk=() f
  for f in "$CSR" "$CER" "$KEY" "$DIR"/AuthKey_*.p8 "$DIR"/broken-*; do
    [[ -e $f ]] && junk+=("$f")
  done
  if [[ ${#junk[@]} -eq 0 ]]; then ok "Nothing to clean"; return; fi

  echo "Will shred:"; printf '  %s\n' "${junk[@]}"
  if [[ -f $ASC ]] && ls "$DIR"/AuthKey_*.p8 >/dev/null 2>&1; then
    echo "  (the .p8 is already embedded in asc.json)"
  fi
  local a; read -rp "Proceed? [y/N] " a </dev/tty
  [[ $a == [yY]* ]] || { echo "Aborted."; return; }

  for f in "${junk[@]}"; do
    if [[ -d $f ]]; then find "$f" -type f -exec shred -u {} +; rm -rf "$f"; else shred -u "$f"; fi
  done
  ok "Cleaned. Kept: devid.p12, p12.pass, asc.json (+ devid.crt, public)"
}

# ---------------------------------------------------------------- sign

cmd_sign() {
  [[ $# -gt 0 ]] || die "usage: $0 sign <binary> [...]"
  need zip "sudo apt install -y zip"
  ensure_rcodesign
  for bin in "$@"; do [[ -f $bin ]] || die "Not found: $bin"; done

  p12_ok || die "Signing identity missing or broken. Run: $0 setup  (it repairs itself)"
  if [[ -f $CRT ]] && ! cert_valid_for "$CRT" PEM 0; then
    die "Developer ID certificate has expired. Run: $0 setup"
  fi
  if [[ ${SKIP_NOTARIZE:-0} != 1 ]]; then
    asc_valid || die "Notarisation key missing or broken. Run: $0 setup  (it repairs itself)"
  fi

  local ent=()
  if [[ -n ${CODESIGN_ENTITLEMENTS:-} ]]; then
    [[ -f $CODESIGN_ENTITLEMENTS ]] || die "Entitlements not found: $CODESIGN_ENTITLEMENTS"
    ent=(--entitlements-xml-file "$CODESIGN_ENTITLEMENTS")
  fi

  TMPD="$(mktemp -d)"
  local bin z
  for bin in "$@"; do
    say "Signing $bin"
    rcodesign sign --p12-file "$P12" --p12-password-file "$PASS" \
      --for-notarization ${ent[@]+"${ent[@]}"} "$bin"

    if [[ ${SKIP_NOTARIZE:-0} != 1 ]]; then
      say "Notarising $bin"
      z="$TMPD/$(basename "$bin").zip"
      rm -f "$z"
      zip -qj "$z" "$bin"
      rcodesign notary-submit --api-key-file "$ASC" --wait "$z"
    fi
    ok "$bin"
  done
}

case "${1:-}" in
  setup) cmd_setup ;;
  sign)  shift; cmd_sign "$@" ;;
  clean) cmd_clean ;;
  *)     echo "usage: $0 setup | sign <binary> [...] | clean"; exit 1 ;;
esac
