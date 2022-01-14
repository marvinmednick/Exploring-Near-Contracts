#!/bin/bash
echo "export CONTRACT_NAME=`cat contracts/marvfirst_main/neardev/dev-account`" > devconfig
echo "export SUBCONTRACT_NAME=`cat contracts/marvfirst_sub/neardev/dev-account`" >> devconfig
echo "exports stored in \"devconfig\" file.  Type \"source devconfig\" to setup environment"
