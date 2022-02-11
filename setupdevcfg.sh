#!/bin/bash
MAIN_DEV_ACCT_FILE="contracts/explore_near_main/neardev/dev-account"
PROXY_DEV_ACCT_FILE="contracts/explore_near_proxy/neardev/dev-account"
missing_files=()
if  [ ! -f  $MAIN_DEV_ACCT_FILE ]; then 
    missing_files+=($MAIN_DEV_ACCT_FILE)
fi
if [ ! -f $PROXY_DEV_ACCT_FILE ]; then
    missing_files+=($PROXY_DEV_ACCT_FILE)
fi
if [ ${#missing_files[@]} != 0 ]; then
    echo "The following files must exist before configuring environment; please use dev-deploy to generate new dev accounts"
    for file in ${missing_files[@]}
    do
        echo "  \"$file\""
    done
    exit 1
fi
echo "export CONTRACT_NAME=`cat $MAIN_DEV_ACCT_FILE`" > devconfig
echo "export SUBCONTRACT_NAME=`cat $PROXY_DEV_ACCT_FILE`" >> devconfig
echo "exports stored in \"devconfig\" file.  Type \"source devconfig\" to setup environment"
