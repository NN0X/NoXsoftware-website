---
sub: Język programowania kompilowany do LLVM IR
---
Własny język z własną specyfikacją i kompilatorem napisanym w C, który generuje LLVM IR. Specyfikacja v0.2alpha dodała wieloprocesowość na poziomie języka i zapobieganie zakleszczeniom.

## Funkcje

- Własna specyfikacja języka (CC BY-ND 4.0)
- Kompilator w C (MIT): preprocesor, lekser, parser, generowanie IR
- Generuje LLVM IR
- Typy o jawnym rozmiarze, np. `sint32` i `sint64`
- Wieloprocesowość na poziomie języka (spec v0.2alpha)
