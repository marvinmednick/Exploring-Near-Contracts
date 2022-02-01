#!/bin/bash -x

near --version

if [ "$ADMIN_NAME" == "" ]  && [ $# -lt 1 ]; then 
	echo "Usage:  $0 <admin account>"
	exit 1
fi

if [ $# -ge 1 ]; then 
ADMIN_NAME=$1
fi

MAIN_DIR=marvfirst_main
MAIN_WASM=marvfirst_main.wasm
PROXY_DIR=marvfirst_sub
PROXY_WASM=marvfirst_sub.wasm

#Delete neardev files 
rm -f contracts/$MAIN_DIR/neardev/dev*
rm -f contracts/$PROXY_DIR/neardev/dev*

# change directories to have separate neardev directory for each contract
pushd contracts/$MAIN_DIR 
near dev-deploy --wasmFile ../out/$MAIN_WASM --initFunction new --initArgs "{ \"admin\" : \"$ADMIN_NAME\" }"
popd

#!/bin/bash
export CONTRACT_NAME=`cat contracts/$MAIN_DIR/neardev/dev-account` 
echo $CONTRACT_NAME
echo "export CONTRACT_NAME=$CONTRACT_NAME" > devconfig

pushd contracts/$PROXY_DIR 
near dev-deploy --wasmFile ../out/$PROXY_WASM --initFunction new --initArgs "{\"log_contract\" : \"$CONTRACT_NAME\", \"admin\" : \"$ADMIN_NAME\"}"
popd
export SUBCONTRACT_NAME=`cat contracts/$PROXY_DIR/neardev/dev-account` 
echo $SUBCONTRACT_NAME
echo "export SUBCONTRACT_NAME=$SUBCONTRACT_NAME" >> devconfig

echo "exports stored in \"devconfig\" file.  Type \"source devconfig\" to setup environment"
