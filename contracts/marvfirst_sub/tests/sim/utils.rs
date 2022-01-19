use near_sdk_sim::{call, init_simulator, deploy, UserAccount, ContractAccount};
//use near_sdk_sim::types::AccountId;
use marvfirst_sub::CallLoggerContractContract;

use crate::marvfirst_main::LogContractContract;

near_sdk_sim::lazy_static_include::lazy_static_include_bytes! {
    SUBCONTRACT_WASM_BYTES => "../target/wasm32-unknown-unknown/release/marvfirst_sub.wasm",
}
near_sdk_sim::lazy_static_include::lazy_static_include_bytes! {
    CONTRACT_WASM_BYTES => "../target/wasm32-unknown-unknown/release/marvfirst_main.wasm",
}


pub fn init() -> (UserAccount, ContractAccount<LogContractContract>, ContractAccount<CallLoggerContractContract>) {
    // Use `None` for default genesis configuration; more info below
    let root = init_simulator(None);

    let contract : ContractAccount<LogContractContract> = deploy!(
        contract: LogContractContract,
        contract_id: "main_contract".to_string(),
		bytes: &CONTRACT_WASM_BYTES,
		signer_account:  root,
     );

    let sub_contract : ContractAccount<CallLoggerContractContract> = deploy!(
        contract: CallLoggerContractContract,
        contract_id: "sub_contract".to_string(),
		bytes: &SUBCONTRACT_WASM_BYTES,
		signer_account:  root,
     );




	call!(root, contract.new()).assert_success();
	call!(root, sub_contract.new("main_contract".to_string(),"admin".to_string())).assert_success();

//    let alice = root.create_user(
 //       "alice".parse().unwrap(),
  //      to_yocto("100") // initial balance
   // );

    (root, contract, sub_contract)
}
