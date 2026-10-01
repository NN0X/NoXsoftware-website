---
sub: A programming language compiled to LLVM IR
---
A custom language with its own specification and a compiler written in C that emits LLVM IR. Spec v0.2alpha added language-level multiprocessing and deadlock prevention.

## Features

- Own language specification (CC BY-ND 4.0)
- Compiler in C (MIT): preprocessor, lexer, parser, IR generation
- Emits LLVM IR
- Explicitly sized types such as `sint32` and `sint64`
- Language-level multiprocessing (spec v0.2alpha)
