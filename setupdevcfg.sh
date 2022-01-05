#!/bin/bash
echo "export CONTRACT_NAME=`cat contract/neardev/dev-account`" > devconfig
echo "export SUBCONTRACT_NAME=`cat contract2/neardev/dev-account`" >> devconfig
echo "exports stored in \"devconfig\" file.  Type \"source devconfig\" to setup environment"
