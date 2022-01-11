use near_sdk_sim::{view, call, DEFAULT_GAS};
use near_sdk::serde_json::json;
use crate::utils::init;



#[test]
fn simulate_basic_operation() {
	println!("Starting");
	let (root, contract, subcontract) = init();
	println!("After Init");
	// call the main contract directly
	let y  = view!(contract.num_entries());
	println!("After first main  call {:?}",y);
	let main_actual : u64 = y.unwrap_json();
	println!("After first main  call {:?}",main_actual);
	let x : String = view!(subcontract.info()).unwrap_json();
	println!("After Info {:?}",x);

	println!("After first main  call {:?}",main_actual);
	// let z = view!(subcontract.indirect_num_entries());
	let z = root.call(
        subcontract.account_id(),
        "indirect_num_entries",
        &json!({})
            .to_string()
            .into_bytes(),
        DEFAULT_GAS,
        0, // attached deposit
    );

	println!("After Info {:?}",z);
	let actual : u64 = z.unwrap_json();
	println!("After Unwrap {}", actual);
	assert_eq!(actual, 0);
	call!(root, subcontract
		.indirect_add( "Now".to_string(), "Me".to_string(), "My Message".to_string())
		).assert_success();

// Now use the non-macro approach to increment the number.
    root.call(
        subcontract.account_id(),
        "indirect_add",
        &json!({"timestamp": "Now".to_string(), "name": "Me".to_string(), "message": "My Message".to_string()})
            .to_string()
            .into_bytes(),
        DEFAULT_GAS,
        0, // attached deposit
    ).assert_success();


	let actual : u64 = view!(contract.num_entries()).unwrap_json();
	assert_eq!(actual, 2);
	let x = root.call(
        subcontract.account_id(),
        "indirect_num_entries",
        &json!({})
            .to_string()
            .into_bytes(),
        DEFAULT_GAS,
        0, // attached deposit
    );
    println!("After 2 adds {:?}", x);
    let actual : u64 = x.unwrap_json();
	assert_eq!(actual, 2);
	
	let x : String = view!(subcontract.info()).unwrap_json();
	println!("At End {:?}",x);

	

}

