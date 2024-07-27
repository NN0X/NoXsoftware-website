CXX = g++
CFLAGS = -O3 -Wall -Wextra -Wpedantic
SRC = src
OUT = main

all:
	$(CXX) $(CFLAGS) $(SRC)/*.cpp -o $(OUT)

clean:
	rm -f $(OUT)