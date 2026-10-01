---
sub: Drone command & control over a post-quantum link
---
A working MVP of a drone command-and-control system and its transport protocol, PQLDP v1 (Post-Quantum Lightweight Datagram Protocol). The ground station proves its identity with an ML-DSA-65 signature pinned in the drone; the drone authenticates with a pre-shared key.

## Features

- ML-KEM-768 session keys with an HKDF-SHA3-256 key schedule
- ChaCha20-Poly1305 AEAD on every datagram, header as associated data
- Capability tokens on ENGAGE/ABORT, checked by the GCS and again by the drone
- Drone fails safe on link loss
- Anti-replay window per session

## Binaries

- `provisioning`: generates the PSK, ML-DSA identity and tokens
- `gcs`: ground control station, PQLDP server
- `drone_agent`: PQLDP client, telemetry, commands
- `operator_cli`: operator console
