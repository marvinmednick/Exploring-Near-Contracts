#!/bin/bash
set -e

RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release
#mkdir -p ./out
#cp target/wasm32-unknown-unknown/release/marvfirst_sub.wasm ./out/main.wasm

