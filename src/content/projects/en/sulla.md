---
sub: Logic circuit simulator with native C++ transpilation
---
A GUI-driven logic circuit simulator written in C++ with Raylib and Glaze. Circuits can be transpiled to C++ shared libraries, so they compile and run at close to native speed.

## Features

- GUI-driven circuit design
- Real-time simulation on a custom pull-based engine
- Transpiles circuits to C++ shared libraries
- AND, OR, NOT, XOR, NAND, NOR and XNOR, plus user-defined parts
- Scales by dynamically loading shared libraries
- Windows and Linux

## Ships with

- A gate-level 6502 CPU and computer
- 74xx parts: 7400, 74181 ALU, 74283 adder, 74161 counter
- Latches, RAM, a traffic-light FSM
