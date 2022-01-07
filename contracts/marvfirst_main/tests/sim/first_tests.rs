use near_sdk::serde_json::json;
use near_sdk_sim::DEFAULT_GAS;
use near_sdk_sim::UserAccount;

//use crate::utils::init;
mod utils

#[test]
fn simulate_some_view_function() {
    let (root, contract, _alice) = init();

    let actual: String = root.view(
        contract.account_id(),
        "info",
        &json!({ }).to_string().into_bytes(),).unwrap_json();
    assert_eq!("expected".to_string(), actual);
}

#[test]
fn simulate_some_change_method() {
    let (root, contract, _alice) = init();

    let result = root.call(
        contract.account_id(),
        "add_entry",
        json!({
            "timestamp": "NOW1".to_string(),
            "name": "Me".to_string(),
            "message": "you".to_string(),
        }).to_string().into_bytes(),
        DEFAULT_GAS,
        1, // deposit
    );

    assert!(result.is_ok());
}
