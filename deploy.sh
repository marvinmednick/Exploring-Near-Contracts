#!/bin/bash -x

near --version

if [ "$ADMIN_NAME" == "" || "$CONTRACT_NAME" == "" || $SUBCONTRACT_NAM == "" ] && [ $# -lt 3 ]; then 
	echo "Usage:  $0 <main_account> <proxy_account> <admin account>"
	exit 1
fi

if [ $# -ge 3]; then 
CONTRACT_NAME=$1
SUBCONTRACT_NAME=$2
ADMIN_NAME=$3
fi

MAIN_DIR=explore_near_main
MAIN_WASM=explore_near_main.wasm
PROXY_DIR=explore_near_proxy
PROXY_WASM=explore_near_proxy.wasm


# change directories to have separate neardev directory for each contract
near deploy --accountId $CONTRACT_NAME --wasmFile contracts/out/$MAIN_WASM --initFunction new --initArgs "{ \"admin\" : \"$ADMIN_NAME\" }"
near deploy --accountId $SUBCONTRACT_NAME --wasmFile contracts/out/$PROXY_WASM --initFunction new --initArgs "{\"log_contract\" : \"$CONTRACT_NAME\", \"admin\" : \"$ADMIN_NAME\"}"

