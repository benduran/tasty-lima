## 0.3.0 (2026-11-17)

### ✨ Features ✨

- feat: implemented security measures to ensure outside actors cannot access the tasty-lima UI (6874a8d33122f6b046e5a147af278821f94aa9ad)

---

## 0.2.0 (2026-11-17)

### ✨ Features ✨

- feat: secure-by-default vm settings (274d879032e7d5fd6f417a997fe80d0e92447049)

---

## 0.1.0 (2026-11-17)

### ✨ Features ✨

- feat: added copying of the local lima bin file and fixed loading state for instance rows (144b4753ffadf74cd53e4b35faf7c7c3e47f686f)

---

## 0.0.5 (2026-11-17)

### 📖 Docs 📖

- docs: updated readme with screenshots and an animated gif (08fcfee2f2e88f3af7c11be607fedf45d3b757e6)

---

## 0.0.4 (2026-11-17)

### 🛠️ Fixes 🛠️

- fix: malformed uRL on open (7de176529c5b9baf0419f93866b45117c15d07f1)

---

## 0.0.3 (2026-11-17)

### ✨ Features ✨

- feat: try to open the system's default web browser on boot (ae46bc8b5aaca5766ef5e4ab82dde14bbde89b2e)

---

## 0.0.2 (2026-11-16)

### 🛠️ Fixes 🛠️

- fix: added correct shebang for the binfile (88e36edd09975111c3b71c51fbea09d5b9a81612)

---

## 0.0.2-alpha.7 (2026-11-16)

### 📖 Docs 📖

- docs: updated readme (7f0e77d8b0edd727d054d5b79b0db3d60111d4ff)



### 🛠️ Fixes 🛠️

- fix: turbo misconfiguration (c2ff43d95b7b584d2fca9f7bfa5a5eb18fe3e7f7)

---

## 0.0.2-alpha.6 (2026-11-16)

### 🔀 Miscellaneous 🔀

- chore: removed all dead code and support publishing this to npm (c713fe0742bd00aa03026a6f5c33c75063ea8df8)

---

## 0.0.2-alpha.5 (2026-11-16)

### 🛠️ Fixes 🛠️

- fix: bug where the lima dir wasn't created recursively on boot (f4e6934fb1b992387254bf0c34a9ac52992834b4)

---

## 0.0.2-alpha.4 (2026-11-16)

### 🛠️ Fixes 🛠️

- fix: corrected arm linux musl target (d2f7ca09a446e8059ed7052ec28895a337d44c13)

---

## 0.0.2-alpha.3 (2026-11-16)

### 🔀 Miscellaneous 🔀

- chore: added github release script (00db686a1e2568d2f342a7620633b3450a0277bc)

---

## 0.0.2-alpha.2 (2026-11-16)

### ✨ Features ✨

- feat: added a shutdown guard (1e50521e2644acacc50d467b933b949fc52207de)

---

## 0.0.2-alpha.1 (2026-11-16)

### ✨ Features ✨

- feat: added ability to copy a VM's template yaml for new VM creation (b1dd345630eeecda3fddd20ed852fe6b60979701)



### 🔀 Miscellaneous 🔀

- chore: always show all experiemental templates (675b9e1652d49a9cb17f9a1c65a3a5d9db073546)



### 🛠️ Fixes 🛠️

- fix: wsl 2 template picking (050b2aaa414a0a965e30abb55635eea6f3b62017)
- fix: never use mounts provided by the template, for clarity (19674d6aae47cc12afe24adedb94aea3fabda865)
- fix: prebuild ui always (a6364f7578fc62c35308b345e278da54c9e4bb64)

---

## 0.0.2-alpha.0 (2026-11-15)

### ✨ Features ✨

- feat: it's ready for alpha usage (2e95a9707997b5fc1fbf4e36cb1354e6e1d3503d)
- feat: added ability to edit an existing VM (33dc32acf72b34771456ddd483bedce35d39a83b)
- feat: added instance deletion (dc41db9bcf7e9c80d23e60cead4b4fddedfe8817)
- feat: introduced sockette (dd1bec3850800f864fd32734a1a8c4d0334ee6c9)
- feat: websocket fetch works (e367a42ce6e9827340ab9cedc78c4307f2410177)
- feat: added best-effort ensuring qemu is available on linux hosts (488243b3deb3237ca44b42e10ef92aa076ecfa80)
- feat: added support for yaml escape hatch (56a6539459d3e04eb333b087c846c352be3bdd9d)
- feat: converted the template selector to a proper autocomplete and ensure the default template is, well, truly the default (cbea562fd86806869103136763ba195b6f13f30a)
- feat: wired in template picker (9590dceee82d9c496ff49f9826d5c58bab61c38c)
- feat: wired in more ui state for the creator (81acfe6c6c322b6a4221ed0ca5d2328685e7c420)
- feat: custom theme picker works (5737ed139bfb7050e46dc6580a3c17838be5d31e)
- feat: more new vm editor wiring (74dcb4f70028cc997e529ebdea9c96413c74e787)



### 🔀 Miscellaneous 🔀

- chore: improved logs (note, logs are emphemeral per UI session, not persistent across runs) (1dccdc600836390ac9dba2b37445a949acd98f9c)
- chore: tweaks to new vm editor and the instances grid (b74e97eab192dd81a420fda40a4dfb03839085ac)
- chore: some cleanup (12cd8898575209b69a1e22c99fedd27e57d4e42c)
- chore: many improvements and tolerate degraded boot (b5b6a134bcd4fa6dd705512ea4f6ff4f9b79cae0)
- chore: dunno if logs are working lol (86674c9ab3c5dcafa01e6fafde31416ca3320ecd)
- chore: start of streaming the logs out after create (eb89f9a4c485a8f4a518f9ae4107e02f2c574f22)
- chore: moved client creation outside of react and added a client socket hook (1ef6bc1ab5a7824e675ee8bfb83b4af013081003)
- chore: added boilerplate to allow streaming response back from lima commands (344d448166fc66a5914332cdc2cc2b2da5a02579)
- chore: reorganized stuffs (63a11e2c81f3128e536d91952c73f33a48a9866c)
- chore: moved to using a zod codec for the yaml transformation (5e326901b69322f85a6e0cffb639eaec3f23aa4e)
- chore: pin to exact dep versions for safety (ff9a75afdf2b6a316985d9f85e8e58176b7c39ad)
- chore: stuff (d9f54a23894aa51f9bd03dd0a8806a9894865314)
- chore: fixed table layout (365fab894ac9d96377776812ea7515143339c91c)
- chore: some resource editor wiring (ed9f05395b929cb854f0c8e5cd8da463d1796190)
- chore: layout tweaks (facad8d73eadfb8063a180be65df3ee88a569c82)
- chore: moved pages (89d1f9dfa7e7e7a6d89489e09cfdf43421d91a5d)
- chore: simplify things for now and start wiring in form state for the new VM form (a90fc7a46669dd4a49784ae1236dd0e55879a5c1)
- chore: mega changes (6847b3dc3db662fb406d67c85f9b114668ea2641)
- chore: add file extensions to all imports to satisfy the typescript gods (9a0f9485b880c6aa2d859a93dcf939550eef5619)
- chore: ported all changes over to new repo for gitlab (73088eb860f320ebabb54fb7f97de48e312f99d6)
- Initial commit (fc5043aa7fa07e73620cd1c8463401a872728153)



### 🛠️ Fixes 🛠️

- fix: logs streaming after create an keeping logs viewer open after creation (eca2f7a6590f96e3f9d16cbb2d6a46ee68ff4b01)
- fix: ensure wsl vm type and mount types work on windows (f496965de1fe8f722abb1c90ed5907bc82f029dd)
- fix: bug with clashing home dirs prevented creating a VM (96c7a3da28e024cc417f0e928b12be6c064aa01b)
- fix: windows untar (a100ecc8801f9626084acbaf6faaf2111f1e7065)

---

