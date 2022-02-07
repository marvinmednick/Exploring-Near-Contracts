use near_sdk_sim::{view, call, init_simulator, deploy, UserAccount, ContractAccount, DEFAULT_GAS};
use near_sdk::serde_json::json;
use explore_near_main::LogContractContract;

near_sdk_sim::lazy_static_include::lazy_static_include_bytes! {
    CONTRACT_WASM_BYTES => "../target/wasm32-unknown-unknown/release/explore_near_main.wasm",
}

pub fn init() -> (UserAccount, ContractAccount<LogContractContract>) {
    let _root = init_simulator(None);

    let contract : ContractAccount<LogContractContract> = deploy!(
        contract: LogContractContract,
        contract_id: "contract".to_string(),
		bytes: &CONTRACT_WASM_BYTES,
		signer_account:  _root,
    );

    (_root, contract)
}



#[test]
fn simulate_some_view_function() {
	let (root, contract) = init();
	call!(root, contract.new()).assert_success();
	let actual : u64 = view!(contract.num_entries()).unwrap_json();
	assert_eq!(actual, 0);
	call!(root, contract
		.add_entry( "Now".to_string(), "Me".to_string(), "My Message".to_string())
		).assert_success();

// Now use the non-macro approach to increment the number.
    root.call(
        contract.account_id(),
        "add_entry",
        &json!({"timestamp": "Now".to_string(), "name": "Me".to_string(), "message": "My Message".to_string()})
            .to_string()
            .into_bytes(),
        DEFAULT_GAS,
        0, // attached deposit
    ).assert_success();

	let actual : u64 = view!(contract.num_entries()).unwrap_json();
	assert_eq!(actual, 2);

}

