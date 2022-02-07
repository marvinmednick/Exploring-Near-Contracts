#!/bin/bash
echo "export CONTRACT_NAME=`cat contracts/explore_near_main/neardev/dev-account`" > devconfig
echo "export SUBCONTRACT_NAME=`cat contracts/explore_near_proxy/neardev/dev-account`" >> devconfig
echo "exports stored in \"devconfig\" file.  Type \"source devconfig\" to setup environment"
