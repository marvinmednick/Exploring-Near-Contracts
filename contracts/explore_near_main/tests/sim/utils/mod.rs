use near_sdk_sim::{call, init_simulator, deploy, UserAccount, ContractAccount};
//use near_sdk_sim::types::AccountId;
use explore_near_main::LogContractContract;

near_sdk_sim::lazy_static_include::lazy_static_include_bytes! {
    CONTRACT_WASM_BYTES => "../target/wasm32-unknown-unknown/release/explore_near_main.wasm",
}


pub fn init() -> (UserAccount, ContractAccount<LogContractContract>) {
    // Use `None` for default genesis configuration; more info below
    let root = init_simulator(None);

    let contract : ContractAccount<LogContractContract> = deploy!(
        contract: LogContractContract,
        contract_id: "contract".to_string(),
		bytes: &CONTRACT_WASM_BYTES,
		signer_account:  root,
     );
	call!(root, contract.new("admin".to_string())).assert_success();

    (root, contract)
}

