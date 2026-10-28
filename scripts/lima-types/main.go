// Command lima-types reads lima's Go source and prints, as JSON, the shape of
// each line `limactl list --json` writes. scripts/generate-lima-types.ts turns
// that into zod schemas.
//
// lima is only type-checked here, never run. go/types also keeps the
// `type Status = string` aliases that runtime reflection erases, and those
// aliases (plus their constants) are where lima keeps its string enums.
package main

import (
	"encoding/json"
	"fmt"
	"go/ast"
	"go/constant"
	"go/types"
	"os"
	"reflect"
	"regexp"
	"slices"
	"strings"

	"golang.org/x/tools/go/packages"
)

const (
	limaModule  = "github.com/lima-vm/lima/v2"
	limatypePkg = limaModule + "/pkg/limatype"
	storePkg    = limaModule + "/pkg/store"
)

// `limactl list` prints store.FormatData, which embeds limatype.Instance and
// adds a few host fields, so the root is named after the instance.
const rootType, rootName = "FormatData", "Instance"

// openEnums are lima string aliases whose constants are not every value lima
// can produce. Each maps to the reason, which ends up in the generated docs.
var openEnums = map[string]string{
	"VMType": "drivers outside limatype (e.g. krunkit, or external drivers) add their own vmType values",
}

// looseMaps are lima's `map[string]any` config fields. lima decodes each entry
// into the struct named here when it needs it, but `limactl list` prints the
// YAML it was given as-is, so every field in them may be missing or null.
var looseMaps = map[string][]struct{ keyConst, structType string }{
	"VMOpts": {{"QEMU", "QEMUOpts"}, {"VZ", "VZOpts"}},
	"OsOpts": {{"WINDOWS", "WindowsOpts"}},
}

type Output struct {
	Version string `json:"version"`
	Enums   []Enum `json:"enums"`
	// Defs are in dependency order, so the root is last.
	Defs []Def `json:"defs"`
}

type Enum struct {
	Name   string   `json:"name"`
	Values []string `json:"values"`
	// Open is set when Values is not exhaustive; Doc says why.
	Open bool   `json:"open,omitempty"`
	Doc  string `json:"doc,omitempty"`
}

type Def struct {
	Name   string  `json:"name"`
	Fields []Field `json:"fields"`
}

type Field struct {
	Name       string `json:"name"`
	Doc        string `json:"doc,omitempty"`
	Deprecated bool   `json:"deprecated,omitempty"`
	Optional   bool   `json:"optional,omitempty"`
	Type       *Node  `json:"type"`
}

type Node struct {
	// array|boolean|enum|int|int32|number|object|record|ref|string|tuple|uint|uint32|unknown
	Kind     string `json:"kind"`
	Nullable bool   `json:"nullable,omitempty"`
	// Ref names the enum or def for kind enum and ref.
	Ref string `json:"ref,omitempty"`
	// AllowZero marks an enum field that can also hold "", Go's zero value.
	AllowZero bool    `json:"allowZero,omitempty"`
	Items     *Node   `json:"items,omitempty"` // array items, record values
	Key       *Node   `json:"key,omitempty"`   // record keys
	Tuple     []*Node `json:"tuple,omitempty"`
	Fields    []Field `json:"fields,omitempty"` // inline objects
	// Loose objects keep keys that aren't listed in Fields.
	Loose bool `json:"loose,omitempty"`
}

type gen struct {
	limatype *types.Package
	docs     map[*types.Var]string
	out      Output

	enums    map[*types.TypeName]*Enum
	defs     map[*types.TypeName]*Def
	defNames map[string]*types.TypeName
	// addressable records how each def was walked; see def.
	addressable map[*types.TypeName]bool
}

func fail(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "lima-types: "+format+"\n", args...)
	os.Exit(1)
}

func main() {
	if len(os.Args) != 2 {
		fail("usage: lima-types <lima version, e.g. v2.2.1>")
	}
	version := os.Args[1]

	cfg := &packages.Config{
		Mode: packages.NeedName | packages.NeedTypes | packages.NeedTypesInfo |
			packages.NeedSyntax | packages.NeedImports | packages.NeedModule,
	}
	pkgs, err := packages.Load(cfg, limatypePkg, storePkg)
	if err != nil {
		fail("loading lima: %v", err)
	}
	if packages.PrintErrors(pkgs) > 0 {
		os.Exit(1)
	}
	byPath := map[string]*packages.Package{}
	for _, pkg := range pkgs {
		if pkg.Module == nil || pkg.Module.Version != version {
			fail("loaded %s from %+v, want %s@%s (is go.mod in sync?)", pkg.PkgPath, pkg.Module, limaModule, version)
		}
		byPath[pkg.PkgPath] = pkg
	}

	g := &gen{
		limatype:    byPath[limatypePkg].Types,
		docs:        fieldDocs(pkgs),
		out:         Output{Version: version},
		enums:       map[*types.TypeName]*Enum{},
		defs:        map[*types.TypeName]*Def{},
		defNames:    map[string]*types.TypeName{},
		addressable: map[*types.TypeName]bool{},
	}
	root, ok := byPath[storePkg].Types.Scope().Lookup(rootType).(*types.TypeName)
	if !ok {
		fail("%s.%s not found", storePkg, rootType)
	}
	// the template engine marshals a FormatData value, which isn't addressable,
	// so pointer-receiver marshalers (like *Instance.MarshalJSON) don't apply
	g.node(root.Type(), false, false)

	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(g.out); err != nil {
		fail("%v", err)
	}
}

// fieldDocs maps struct fields to their doc (or trailing line) comment.
func fieldDocs(pkgs []*packages.Package) map[*types.Var]string {
	docs := map[*types.Var]string{}
	for _, pkg := range pkgs {
		for _, file := range pkg.Syntax {
			ast.Inspect(file, func(n ast.Node) bool {
				st, ok := n.(*ast.StructType)
				if !ok {
					return true
				}
				for _, field := range st.Fields.List {
					doc := field.Doc.Text()
					if doc == "" {
						doc = field.Comment.Text()
					}
					for _, ident := range field.Names {
						if v, ok := pkg.TypesInfo.Defs[ident].(*types.Var); ok && doc != "" {
							docs[v] = strings.TrimSpace(doc)
						}
					}
				}
				return true
			})
		}
	}
	return docs
}

func (g *gen) lookup(name string) types.Object {
	obj := g.limatype.Scope().Lookup(name)
	if obj == nil {
		fail("%s.%s not found; update the tables at the top of main.go", limatypePkg, name)
	}
	return obj
}

// enum returns the enum for a lima string type that has typed constants.
func (g *gen) enum(obj *types.TypeName) *Enum {
	if e, ok := g.enums[obj]; ok {
		return e
	}
	if obj.Pkg() == nil || !strings.HasPrefix(obj.Pkg().Path(), limaModule) {
		return nil
	}
	if basic, ok := types.Unalias(obj.Type()).Underlying().(*types.Basic); !ok || basic.Info()&types.IsString == 0 {
		return nil
	}
	scope := obj.Pkg().Scope()
	var consts []*types.Const
	for _, name := range scope.Names() {
		c, ok := scope.Lookup(name).(*types.Const)
		if !ok || c.Val().Kind() != constant.String {
			continue
		}
		switch t := c.Type().(type) {
		case *types.Alias:
			ok = t.Obj() == obj
		case *types.Named:
			ok = t.Obj() == obj
		default:
			ok = false
		}
		if ok {
			consts = append(consts, c)
		}
	}
	if len(consts) == 0 {
		return nil
	}
	slices.SortStableFunc(consts, func(a, b *types.Const) int { return int(a.Pos() - b.Pos()) })
	e := &Enum{Name: obj.Name()}
	for _, c := range consts {
		if v := constant.StringVal(c.Val()); !slices.Contains(e.Values, v) {
			e.Values = append(e.Values, v)
		}
	}
	if reason, ok := openEnums[obj.Name()]; ok {
		e.Open, e.Doc = true, reason
	}
	for other := range g.enums {
		if other.Name() == obj.Name() {
			fail("two enums named %s: %s and %s", obj.Name(), other.Pkg().Path(), obj.Pkg().Path())
		}
	}
	g.enums[obj] = e
	g.out.Enums = append(g.out.Enums, *e)
	return e
}

// marshaler reports which custom encoding encoding/json would use for t:
// "json" (MarshalJSON), "text" (MarshalText), or "" for neither.
func marshaler(t types.Type, addressable bool) string {
	candidates := []types.Type{t}
	if _, isPtr := t.Underlying().(*types.Pointer); !isPtr && addressable {
		candidates = append(candidates, types.NewPointer(t))
	}
	for _, method := range []string{"MarshalJSON", "MarshalText"} {
		for _, c := range candidates {
			if types.NewMethodSet(c).Lookup(nil, method) != nil {
				return strings.ToLower(strings.TrimPrefix(method, "Marshal"))
			}
		}
	}
	return ""
}

// nilable reports whether encoding/json can write t as null. A nil slice or
// map with its own marshaler (e.g. net.IP) is passed to it instead.
func nilable(t types.Type, addressable bool) bool {
	switch t.Underlying().(type) {
	case *types.Pointer, *types.Interface:
		return true
	case *types.Slice, *types.Map:
		return marshaler(t, addressable) == ""
	}
	return false
}

// node describes how encoding/json writes a non-nil value of type t.
func (g *gen) node(t types.Type, addressable, loose bool) *Node {
	if alias, ok := t.(*types.Alias); ok {
		if e := g.enum(alias.Obj()); e != nil {
			return &Node{Kind: "enum", Ref: e.Name}
		}
		return g.node(alias.Rhs(), addressable, loose)
	}
	if named, ok := t.(*types.Named); ok {
		obj := named.Obj()
		if specs, ok := looseMaps[obj.Name()]; ok && obj.Pkg() == g.limatype {
			return g.looseMap(specs)
		}
		switch marshaler(t, addressable) {
		case "json":
			if obj.Pkg() != nil && obj.Pkg().Path() == "time" && obj.Name() == "Time" {
				return &Node{Kind: "string"}
			}
			fmt.Fprintf(os.Stderr, "lima-types: %s has a custom MarshalJSON; typing it as unknown\n", t)
			return &Node{Kind: "unknown"}
		case "text":
			return &Node{Kind: "string"}
		}
		if e := g.enum(obj); e != nil {
			return &Node{Kind: "enum", Ref: e.Name}
		}
	}

	switch u := t.Underlying().(type) {
	case *types.Basic:
		info := u.Info()
		switch {
		case info&types.IsBoolean != 0:
			return &Node{Kind: "boolean"}
		case info&types.IsString != 0:
			return &Node{Kind: "string"}
		case info&types.IsInteger != 0:
			kind := "int"
			if info&types.IsUnsigned != 0 {
				kind = "uint"
			}
			if u.Kind() == types.Int32 || u.Kind() == types.Uint32 {
				kind += "32"
			}
			return &Node{Kind: kind}
		case info&types.IsFloat != 0:
			return &Node{Kind: "number"}
		}
	case *types.Pointer:
		return g.node(u.Elem(), true, loose)
	case *types.Slice:
		if b, ok := u.Elem().(*types.Basic); ok && b.Kind() == types.Byte {
			return &Node{Kind: "string"} // base64
		}
		return &Node{Kind: "array", Items: g.elem(u.Elem(), true, loose)}
	case *types.Array:
		tuple := &Node{Kind: "tuple", Tuple: []*Node{}}
		for range u.Len() {
			tuple.Tuple = append(tuple.Tuple, g.elem(u.Elem(), addressable, loose))
		}
		return tuple
	case *types.Map:
		// map values aren't addressable
		return &Node{Kind: "record", Key: g.node(u.Key(), false, false), Items: g.elem(u.Elem(), false, loose)}
	case *types.Struct:
		if named, ok := t.(*types.Named); ok && !loose {
			return &Node{Kind: "ref", Ref: g.def(named.Obj(), u, addressable)}
		}
		return &Node{Kind: "object", Fields: g.fields(u, addressable, loose), Loose: loose}
	case *types.Interface:
		return &Node{Kind: "unknown"}
	}
	fail("unsupported type %s", t)
	return nil
}

// elem describes a slice, array or map element.
func (g *gen) elem(t types.Type, addressable, loose bool) *Node {
	n := g.node(t, addressable, loose)
	n.Nullable = (loose || nilable(t, addressable)) && n.Kind != "unknown"
	return n
}

func (g *gen) looseMap(specs []struct{ keyConst, structType string }) *Node {
	obj := &Node{Kind: "object", Loose: true}
	for _, spec := range specs {
		key, ok := g.lookup(spec.keyConst).(*types.Const)
		if !ok || key.Val().Kind() != constant.String {
			fail("%s.%s is not a string constant", limatypePkg, spec.keyConst)
		}
		n := g.node(g.lookup(spec.structType).Type(), true, true)
		n.Nullable = true
		obj.Fields = append(obj.Fields, Field{Name: constant.StringVal(key.Val()), Optional: true, Type: n})
	}
	return obj
}

// def emits a named struct as its own schema, once, after its dependencies.
func (g *gen) def(obj *types.TypeName, st *types.Struct, addressable bool) string {
	if d, ok := g.defs[obj]; ok {
		// a def is walked once, but which marshalers apply depends on whether
		// the value is addressable; bail out rather than reuse a wrong shape
		if g.addressable[obj] != addressable {
			fail("%s is marshaled both addressable and not; give it two defs", obj)
		}
		if d.Fields == nil {
			fail("%s is recursive, which the TypeScript emitter can't order", obj)
		}
		return d.Name
	}
	name := obj.Name()
	if obj.Name() == rootType && obj.Pkg().Path() == storePkg {
		name = rootName
	}
	if other, ok := g.defNames[name]; ok {
		fail("two types named %s: %s and %s", name, other, obj)
	}
	d := &Def{Name: name}
	g.defs[obj], g.defNames[name], g.addressable[obj] = d, obj, addressable
	d.Fields = g.fields(st, addressable, false)
	g.out.Defs = append(g.out.Defs, *d)
	return name
}

// canBeEmpty reports whether n can marshal to {}. `limactl list` pipes its
// JSON through yq to delete empty objects, so such fields can go missing.
func (g *gen) canBeEmpty(n *Node) bool {
	fields := n.Fields
	switch n.Kind {
	case "ref":
		fields = g.defs[g.defNames[n.Ref]].Fields
	case "object":
	default:
		return false
	}
	for _, f := range fields {
		if !f.Optional {
			return false
		}
	}
	return true
}

var otherFieldNote = regexp.MustCompile("^`([^`]+)`")

type candidate struct {
	Field
	depth  int
	tagged bool
}

// fields lists a struct's JSON fields, flattening embedded structs the way
// encoding/json does.
func (g *gen) fields(st *types.Struct, addressable, loose bool) []Field {
	var all []candidate
	g.collect(st, addressable, loose, 0, false, &all)

	// of the fields sharing a name, the shallowest wins; a tie goes to the one
	// with a json tag, and otherwise encoding/json drops the name entirely
	out := []Field{}
	for i, c := range all {
		if slices.ContainsFunc(all[:i], func(o candidate) bool { return o.Name == c.Name }) {
			continue
		}
		var shallowest []candidate
		for _, o := range all {
			if o.Name != c.Name {
				continue
			}
			if len(shallowest) == 0 || o.depth < shallowest[0].depth {
				shallowest = []candidate{o}
			} else if o.depth == shallowest[0].depth {
				shallowest = append(shallowest, o)
			}
		}
		if len(shallowest) > 1 {
			shallowest = slices.DeleteFunc(shallowest, func(o candidate) bool { return !o.tagged })
		}
		if len(shallowest) == 1 {
			out = append(out, shallowest[0].Field)
		}
	}
	return out
}

func (g *gen) collect(st *types.Struct, addressable, loose bool, depth int, viaPointer bool, out *[]candidate) {
	for i := range st.NumFields() {
		v := st.Field(i)
		tag := reflect.StructTag(st.Tag(i))
		jsonTag := tag.Get("json")
		if jsonTag == "-" {
			continue
		}
		name, opts, _ := strings.Cut(jsonTag, ",")
		t := v.Type()

		if v.Embedded() && name == "" {
			inner, isPtr := t, false
			if p, ok := types.Unalias(inner).(*types.Pointer); ok {
				inner, isPtr = p.Elem(), true
			}
			if s, ok := inner.Underlying().(*types.Struct); ok {
				// a nil embedded pointer drops all of its fields
				g.collect(s, addressable || isPtr, loose, depth+1, viaPointer || isPtr, out)
				continue
			}
		}
		if !v.Exported() {
			continue
		}
		tagged := name != ""
		if !tagged {
			name = v.Name()
		}

		f := Field{Name: name, Doc: g.docs[v], Type: g.node(t, addressable, loose)}
		// lima leaves notes on removed fields above whichever field follows,
		// e.g. "`network` was deprecated in Lima v0.7.0" sits on Env
		if m := otherFieldNote.FindStringSubmatch(f.Doc); m != nil && m[1] != name && m[1] != v.Name() {
			f.Doc = ""
		}
		f.Deprecated = tag.Get("lima") == "deprecated" || strings.HasPrefix(f.Doc, "Deprecated:") ||
			strings.Contains(f.Doc, "\nDeprecated:") || f.Doc == "DEPRECATED"
		f.Optional, f.Type.Nullable = g.presence(t, f.Type, opts, addressable)
		if loose {
			f.Optional, f.Type.Nullable = true, true
		}
		f.Optional = f.Optional || viaPointer
		*out = append(*out, candidate{Field: f, depth: depth, tagged: tagged})
	}
}

// presence reports whether a field of type t can be missing, or null, from the
// JSON, given its json tag options.
func (g *gen) presence(t types.Type, n *Node, opts string, addressable bool) (optional, nullable bool) {
	omitempty := slices.Contains(strings.Split(opts, ","), "omitempty")
	omitzero := slices.Contains(strings.Split(opts, ","), "omitzero")
	omitted := omitempty || omitzero

	switch u := t.Underlying().(type) {
	case *types.Basic:
		optional = omitted
		// a plain string-enum field still holds "" until lima sets it (e.g. on a broken instance)
		if n.Kind == "enum" && !omitted {
			n.AllowZero = true
		}
	case *types.Array:
		optional = omitzero || (omitempty && u.Len() == 0)
	case *types.Struct:
		optional = omitzero
	default: // pointers, slices, maps, interfaces
		optional = omitted
	}
	nullable = !omitted && nilable(t, addressable) && n.Kind != "unknown"
	// yq deletes empty maps, and structs (or pointers to them) that marshal to {}
	return optional || n.Kind == "record" || g.canBeEmpty(n), nullable
}
