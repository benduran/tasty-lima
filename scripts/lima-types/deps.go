//go:build tools

// main.go loads lima's source without importing it, so this file (never built)
// is what keeps lima in go.mod and go.sum through `go mod tidy`.
package main

import _ "github.com/lima-vm/lima/v2/pkg/store"
