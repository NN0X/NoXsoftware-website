---
sub: Dowodzenie dronami przez łącze postkwantowe
---
Działające MVP systemu dowodzenia i kontroli dronów oraz jego protokołu transportowego PQLDP v1 (Post-Quantum Lightweight Datagram Protocol). Stacja naziemna potwierdza tożsamość podpisem ML-DSA-65 przypiętym w dronie, a dron uwierzytelnia się kluczem współdzielonym.

## Funkcje

- Klucze sesji ML-KEM-768 z harmonogramem kluczy HKDF-SHA3-256
- AEAD ChaCha20-Poly1305 na każdym datagramie, nagłówek jako dane powiązane
- Tokeny uprawnień dla ENGAGE/ABORT, sprawdzane przez GCS i ponownie przez drona
- Bezpieczne zachowanie drona po utracie łącza
- Okno ochrony przed powtórzeniem w każdej sesji

## Programy

- `provisioning`: generuje PSK, tożsamość ML-DSA i tokeny
- `gcs`: stacja naziemna, serwer PQLDP
- `drone_agent`: klient PQLDP, telemetria, polecenia
- `operator_cli`: konsola operatora
