use near_sdk::{
    //borsh::{self, BorshDeserialize, BorshSerialize},
    //serde::{Deserialize, Serialize},
    //AccountId, 
    //  PanicOnDefault,
    env,
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
struct CallLoggerContract {}

#[near_bindgen]
impl CallLoggerContract {
    
    pub fn indirect_add_entry(&self, timestamp: String, name: String, message: String) -> near_sdk::Promise {
        ext_logger::add_entry(
            String::from("indirect ") + &env::block_timestamp().to_string(),
            String::from("indirect ") + &name,
            String::from("indirect ") + &message,
            0, // yocto NEAR to attach
            5_000_000_000_000 // gas to attach
        );
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
