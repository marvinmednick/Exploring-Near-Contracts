use near_sdk_sim::{view, call, DEFAULT_GAS};
use near_sdk::{
	serde_json::{json, from_str},
	serde::{Deserialize, Serialize},
	borsh::{self, BorshDeserialize, BorshSerialize}
};
use crate::utils::init;

use crate::explore_near_main::LogEntry;

#[test]
fn simluate_initial_setup() {

     #[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug, Clone)]
     #[serde(crate = "near_sdk::serde")]
     struct ContractInfo {
               log_contract:  String,
               admin: String,
     }

	println!("Starting");
	let (_root, contract, subcontract) = init();
	
	let actual :u64 = view!(contract.num_entries()).unwrap_json();
	assert_eq!(actual, 0);

	let x_json : String = view!(subcontract.info()).unwrap_json();
	let x = near_sdk::serde_json::from_str::<ContractInfo>(&x_json).unwrap();
	assert_eq!(x.log_contract,contract.account_id().to_string());

}

#[test]
fn simulate_basic_operation() {
	let (root, contract, subcontract) = init();
	
	// use non-macro call to check num entries from subcontract 
	let actual : u64 = root.call(
        subcontract.account_id(),
        "indirect_num_entries",
        &json!({})
            .to_string()
            .into_bytes(),
        DEFAULT_GAS,
        0, // attached deposit
    ).unwrap_json();
	assert_eq!(actual, 0);

	// use the call macro to add a entry
	call!(root, subcontract
		.indirect_add_entry( "Now".to_string(), "Me".to_string(), "My Message".to_string())
	).assert_success();

		// use the call macro to add a entry
	let ret : String = call!(root, contract.get_last()).unwrap_json();
	let deserialized: LogEntry = near_sdk::serde_json::from_str(&ret).unwrap();
	assert_eq!(deserialized.name,"Me");
	assert_eq!(deserialized.message,"My Message");
	assert_eq!(deserialized.timestamp,"Now");
	// Now use the non-macro approach to add an entry 
    root.call(
        subcontract.account_id(),
        "indirect_add_entry",
        &json!({"timestamp": "Now".to_string(), "name": "Me".to_string(), "message": "My Message1".to_string(), "cc_used_gas" : 1})
            .to_string()
            .into_bytes(),
        DEFAULT_GAS,
        0, // attached deposit
    ).assert_success();

    // check the number of entries reported both directly and indirectly
	let actual1 : u64 = view!(contract.num_entries()).unwrap_json();
	
	let actual2 : u64= root.call(
        subcontract.account_id(),
        "indirect_num_entries",
        &json!({})
            .to_string()
            .into_bytes(),
        DEFAULT_GAS,
        0, // attached deposit
    ).unwrap_json();
    
    assert_eq!(actual1, actual2);
    assert_eq!(actual1, 2);

}

