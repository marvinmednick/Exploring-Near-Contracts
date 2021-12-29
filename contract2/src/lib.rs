use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    //serde::{Deserialize, Serialize},
    serde_json::json,
    AccountId, 
    PanicOnDefault,
    env,
    Gas,
    near_bindgen,
    ext_contract,
    Promise, 
	PromiseResult,
	//json_types::U128,
    log,
};



#[ext_contract(ext_logger)]
trait LoggerContract {
    fn add_entry(&self, timestamp: String, name: String, message: String);
    fn num_entries();
}

#[ext_contract(ext_self)]
pub trait MyContract {
    fn num_entries_callback(&self) -> u64;
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize,PanicOnDefault)]
struct CallLoggerContract {
	log_contract_id : AccountId
}

#[near_bindgen]
impl CallLoggerContract {
    
	#[init]
    pub fn new(log_contract : String) -> Self {
        log!("Init Log_contract: {}", log_contract);
        Self {
//          log_contract_id : log_contract.try_into().unwrap(),
            log_contract_id : "dev-1639974321121-47529844872022".to_string().try_into().unwrap(),
        } 
    }

    pub fn update_log_contract(&mut self, log_contract: String) {
        self.log_contract_id = log_contract.try_into().unwrap();
    }

    pub fn indirect_add_entry(&self, timestamp: String, name: String, message: String) {

        let _cross_contract_call = Promise::new(self.log_contract_id.clone())
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


	pub fn indirect_num_entries() -> Promise {
		ext_logger::num_entries(
            "dev-1640639075534-62569263574205".to_string().try_into().unwrap(),
            0, // yocto NEAR to attach
            Gas::from(5_000_000_000_000) // gas to attach
		).then(ext_self::num_entries_callback(
			env::current_account_id(), // this contract's account id
			0, // yocto NEAR to attach to the callback
			Gas::from(5_000_000_000_000) // gas to attach to the callback
			)
		) 
	}

	pub fn num_entries_callback(&self)  -> u64 {
	  assert_eq!(
		  env::promise_results_count(),
		  1,
		  "This is a callback method"
	  );

	  // handle the result from the cross contract call this method is a callback for
	  match env::promise_result(0) {
		PromiseResult::NotReady => 0,
		PromiseResult::Failed => { 0 },
		PromiseResult::Successful(result) => {
			let count = near_sdk::serde_json::from_slice::<u64>(&result).unwrap();
			count
		},
	  }
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
