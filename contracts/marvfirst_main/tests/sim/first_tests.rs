use near_sdk_sim::{view, call, DEFAULT_GAS};
use near_sdk::serde_json::json;
use crate::utils::init;
use near_sdk::json_types::U64;

#[test]
fn simulate_basic_operation() {
	let (root, contract) = init();
	let actual : u64 = view!(contract.num_entries()).unwrap_json();
	assert_eq!(actual, 0);
	call!(root, contract
		.add_entry( "Now".to_string(), "Me".to_string(), "My Message".to_string(), U64::from(0))
		).assert_success();

// Now use the non-macro approach to increment the number.
    root.call(
        contract.account_id(),
        "add_entry",
        &json!({"timestamp": "Now".to_string(), "name": "Me".to_string(), "message": "My Message".to_string(), "cc_used_gas": U64::from(0)})
            .to_string()
            .into_bytes(),
        DEFAULT_GAS,
        0, // attached deposit
    ).assert_success();

	let actual : u64 = view!(contract.num_entries()).unwrap_json();
	assert_eq!(actual, 2);

}

