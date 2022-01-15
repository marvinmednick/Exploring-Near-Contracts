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
	json_types::U128,
    log,
};

//use std::result;


#[ext_contract(ext_logger)]
trait LoggerContract {
    fn add_entry(&self, timestamp: String, name: String, message: String);
    fn num_entries();
    fn get_last();
}

#[ext_contract(ext_self)]
pub trait MyContract {
    fn num_entries_callback(&self) -> u64;
    fn get_last_callback(&self) -> String;
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize,PanicOnDefault)]
struct CallLoggerContract {
	log_contract_id : AccountId,
    counter : u64 
}


#[near_bindgen]
impl CallLoggerContract {
    
	#[init]
    pub fn new(log_contract : String) -> Self {
        log!("Init Log_contract: {}", log_contract);
        Self {
          log_contract_id : log_contract.try_into().unwrap(),
          counter : 0,
        } 
    }

    pub fn update_log_contract(&mut self, log_contract: String) {
        self.log_contract_id = log_contract.try_into().unwrap();
    }

	#[payable]
    pub fn indirect_add_entry(&mut self, timestamp: String, name: String, message: String, transfer_amount: U128) {

		let amount = u128::from(transfer_amount);
        let _cross_contract_call = Promise::new(self.log_contract_id.clone())
        .function_call(
            "add_entry".to_string(),
            json!({
                "timestamp" : timestamp,
                "name"      : String::from("indirect ") + &name,
                "message"   : String::from("indirect ") + &message,
            }).to_string().into_bytes(),
            amount, // yocto NEAR to attach
            Gas::from(5_000_000_000_000) // gas to attach
        );
        env::log_str("indirect_entry_add completed");
    }

	#[payable]
    pub fn indirect_add(&mut self, timestamp: String, name: String, message: String) {

        // let add_info = " - PP: ".to_string() + &u64::from(env::prepaid_gas()).to_string() + &"Used: " + &u64::from(env::used_gas()).to_string();


        ext_logger::add_entry(
            String::from("indirect ") + &timestamp,
            String::from("indirect ") + &name,
            String::from("indirect ") + &message,
            self.log_contract_id.clone(),
            // take any attached deposit and send it on as to the main contract
            env::attached_deposit(), // yocto NEAR to attach
            Gas::from(5_000_000_000_000) // gas to attach
        );
    }


	pub fn indirect_num_entries(&self) -> Promise {
		ext_logger::num_entries(  
            self.log_contract_id.clone(),
            0, // yocto NEAR to attach
            Gas::from(5_000_000_000_000) // gas to attach
		).then(ext_self::num_entries_callback(
			env::current_account_id(), // this contract's account id
			0, // yocto NEAR to attach to the callback
			Gas::from(5_000_000_000_000) // gas to attach to the callback
			)
		) 
	}

    pub fn indirect_get_last(&self) -> Promise {
        ext_logger::get_last(  
            self.log_contract_id.clone(),
            0, // yocto NEAR to attach
            Gas::from(5_000_000_000_000) // gas to attach
        ).then(ext_self::get_last_callback(
            env::current_account_id(), // this contract's account id
            0, // yocto NEAR to attach to the callback
            Gas::from(5_000_000_000_000) // gas to attach to the callback
            )
        ) 
    }



	pub fn info(&self) -> String {
        
        let result = self.log_contract_id.to_string();
        result
	}

    fn test_ok(&self) -> Result<u64,&'static str>  {
        Ok(1)
    } 

	pub fn num_entries_callback(&mut self)  -> u64 {
        
        self.counter += 1;

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
    use near_sdk::test_utils::{get_logs, VMContextBuilder};
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
        let account = AccountId::new_unchecked("mmednick.testnet".to_string());
        let _mainaccount = AccountId::new_unchecked("mmednicktoss.testnet".to_string());
        let context = get_context(account);
        testing_env!(context.build());

		let amount : u128 = 1_000_000_000_000_000_000_000_000;
        let transfer_amount = U128::from(amount);
        let mut contract = CallLoggerContract::new("mmednicktoss.testnet".to_string());
        println!("{:?}",get_logs());
        contract.indirect_add_entry("dateAndTime".to_string(),"NameofSam".to_string(),"My Message is".to_string(),transfer_amount);
        println!("{:?}",get_logs());
        assert_eq!(get_logs(), ["Init Log_contract: mmednicktoss.testnet", "indirect_entry_add completed"], "Exec.");


        }

}
