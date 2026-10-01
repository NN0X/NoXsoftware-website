---
sub: BPE-style tokenizer for my own language model
---
A tokenizer loosely based on Byte Pair Encoding, tuned for fast dictionary creation and tokenization. The bundled dictionaries were built from the Amazon Reviews dataset.

## Features

- Loosely based on Byte Pair Encoding
- Fast dictionary creation and tokenization
- Pre-computed 2^15 and 2^16 dictionaries
- Static library (`libcicero.a`) and CLI
