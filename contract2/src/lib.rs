use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    //serde::{Deserialize, Serialize},
    serde_json::json,
    //AccountId, 
    //  PanicOnDefault,
    env,
    Gas,
    near_bindgen,
    ext_contract,
    Promise,
};



#[ext_contract(ext_logger)]
trait LoggerContract {
    fn add_entry(&self, timestamp: String, name: String, message: String);
    fn add2();
}


#[near_bindgen]
#[derive(Default, BorshDeserialize, BorshSerialize)]
struct CallLoggerContract {

}

#[near_bindgen]
impl CallLoggerContract {
    
    pub fn indirect_add_entry(&self, timestamp: String, name: String, message: String) {

        let _cross_contract_call = Promise::new("dev-1640639075534-62569263574205".to_string().try_into().unwrap()) 
        .function_call(
            "add_entry".to_string(),
            json!({
                "timestamp" : String::from("indirect ") + &timestamp,
                "name"      : String::from("indirect ") + &name,
                "message"   : String::from("indirect ") + &message,
            }).to_string().into_bytes(),
            0, // yocto NEAR to attach
            Gas::from(5_000_000_000_000) // gas to attach
        );
    }

    pub fn indirect_add(&self, timestamp: String, name: String, message: String) {

        ext_logger::add_entry(
            String::from("indirect ") + &timestamp,
            String::from("indirect ") + &name,
            String::from("indirect ") + &message,
            "dev-1640639075534-62569263574205".to_string().try_into().unwrap(),
            0, // yocto NEAR to attach
            Gas::from(5_000_000_000_000) // gas to attach
        );
    }

    pub fn hello(&self) -> String {
        String::new("hello")
    }
    
}





/*
 * the rest of this file sets up unit tests
 * to run these, the command will be:
 * cargo test --package rust-template -- --nocapture
 * Note: 'rust-template' comes from Cargo.toml's 'name' key
 */

// use the attribute below for unit tests
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{VMContextBuilder};
    use near_sdk::{testing_env, AccountId};

    // part of writing unit tests is setting up a mock context
    // provide a `predecessor` here, it'll modify the default context
    fn get_context(predecessor: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder.predecessor_account_id(predecessor);
        builder
    }

     #[test]
    fn dummy_test() {

        assert_eq!(2,2);

    }

}
