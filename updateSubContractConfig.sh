#!/bin/bash
source devconfig 
echo $SUBCONTRACT_NAME
echo $CONTRACT_NAME
near call $SUBCONTRACT_NAME update_log_contract --accountId  $SUBCONTRACT_NAME --args "{\"log_contract\" : \"$CONTRACT_NAME\"}"
