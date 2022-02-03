use near_sdk::{
    AccountId, PanicOnDefault, near_bindgen, ext_contract,
    Promise, PromiseResult,
    env, Gas, log, require,
    borsh::{self, BorshDeserialize, BorshSerialize},
    serde_json::json,
    json_types::{U64},
    
};

/// External definitions for Cross Contract Calls to Logger
#[ext_contract(ext_logger)]
trait LoggerContract {
    fn add_entry(&self, timestamp: String, name: String, message: String, cc_used_gas: U64);
    fn num_entries();
    fn get_last();
}

/// External definitions for Cross Contract callbacks
#[ext_contract(ext_self)]
pub trait MyContract {
    fn num_entries_callback(&self) -> u64;
    fn get_last_callback(&self) -> String;
}

/// Sub contract data structures
///
/// Contains the configuration for the address the contract that this contract 
/// will call to log data
///
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize,PanicOnDefault)]
struct CallLoggerContract {
    /// AccountId of the contract for Cross contract call for logging
	log_contract_id : AccountId,
    /// Admin account allowed to update logging contract
    admin_user: AccountId
}

/// Sub contract implmentation
#[near_bindgen]
impl CallLoggerContract {
    
    /// Initialization of contract requires address of contract to log to
	#[init]
    pub fn new(log_contract : String, admin : String) -> Self {
        log!("Init Subcongtract -  Log_contract: {} admin = {}", log_contract, admin);
        Self {
          log_contract_id : log_contract.try_into().unwrap(),
          admin_user : admin.try_into().unwrap(),
        } 
    }


    fn  check_for_admin_rights(&self) {
        let request_acct = env::predecessor_account_id().to_string();
        log!("Update of log contract requested by {}",&request_acct);
        let check1 = env::predecessor_account_id() == env::current_account_id();
        let check2 = env::predecessor_account_id() ==  self.admin_user;
        require!(check1 || check2, "Only contract or admin can update configuration");

    }

    /// Update logging contrct 
    ///
    /// Since initialization is only done one once (unless using 'init(ignore_state)' )
    pub fn update_log_contract(&mut self, log_contract: String) {
        self.check_for_admin_rights();
        /* require!(env::predecessor_account_id() == self.admin_user,"Admin account method");
        let request_acct = env::predecessor_account_id().to_string();
        log!("Update of log contract requested by {}",&request_acct);
        let check1 = env:   self.chredecessor_account_id() == self.owner_id;
        let check2 = env::predecessor_account_id() ==  self.admin;
        require!(check1 || check2, "Only contract or admin can update configuration");
        */

        self.log_contract_id = log_contract.try_into().unwrap();
    }

    /// Update admin 
    ///
    /// Since initialization is only done one once (unless using 'init(ignore_state)' )
    pub fn update_admin(&mut self, admin: String) {
        
        self.check_for_admin_rights();
        // require!(env::predecessor_account_id() == self.admin_user,"Admin account method");
        self.admin_user = admin.try_into().unwrap();
    }

    /// non-macro method for a cross contract call to add_entry
    ///
    /// Is payable and transfer amount if provide is transfered to the logging 
	#[payable]
    pub fn indirect_add_entry(&mut self, timestamp: String, name: String, message: String) {
		
        let _cross_contract_call = 
             Promise::new(self.log_contract_id.clone()).function_call(
                "add_entry".to_string(),
                json!({
                    "timestamp" : timestamp,
                    "name"      : name,
                    "message"   : message,
                    "cc_used_gas" : U64::from(u64::from(env::used_gas())),
                }).to_string().into_bytes(),
                env::attached_deposit(), // yocto NEAR to attach, // yocto NEAR to attach
                Gas::from(5_000_000_000_000) // gas to attach
            );
        env::log_str("indirect_entry_add completed");
    }

/*
    /// macro implementat method for a cross contract call to add_entry
    ///
    /// Is payable and transfer amount if provide is transfered to the logging 
	#[payable]
    pub fn indirect_add(&mut self, timestamp: String, name: String, message: String) {

        ext_logger::add_entry(
            timestamp,
            name,
            message,
            U64::from(u64::from(env::used_gas())),
            self.log_contract_id.clone(),
            // take any attached deposit and send it on as to the main contract
            env::attached_deposit(), // yocto NEAR to attach
            Gas::from(5_000_000_000_000) // gas to attach
        );
    }

*/

    /// Read the number of entries via a cross contract call
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

    /// Callback routine for indirect_num_entries promise
    pub fn num_entries_callback(&mut self)  -> u64 {
        
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



    /// Read the last entry via a cross contract call
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


    /// Callback routine for indirect_get_last promise
    pub fn get_last_callback(&mut self)  -> String {
    
        assert_eq!(
          env::promise_results_count(),
          1,
          "This is a callback method"
        );

      // handle the result from the cross contract call this method is a callback for
      match env::promise_result(0) {
        PromiseResult::NotReady => "Not Ready".to_string(),
        PromiseResult::Failed => { "Failed".to_string() },
        PromiseResult::Successful(result) => {
            let result = near_sdk::serde_json::from_slice::<String>(&result).unwrap();
            result
        },
      }
    }


    /// Return the configured information for this contract
    ///
    /// return JSON structure with the logging account and the admin user
	pub fn info(&self) -> String {
        
        let result = json!({
                "log_contract" : self.log_contract_id.to_string(),
                "admin"      : self.admin_user.to_string(),
            }).to_string();
        result
	}


}
    





/*
 * the rest of this file sets up unit tests
 * to be run as part of cargo test
 * to run these separately, the command will be:
 * cargo test --package <xxx> -- --nocapture
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
    fn basic_test() {
        let account = AccountId::new_unchecked("andre".to_string());
        let _mainaccount = AccountId::new_unchecked("barbara".to_string());
        let context = get_context(account);
        testing_env!(context.build());

        let mut contract = CallLoggerContract::new("devacct".to_string(),"mmednicktoss.testnet".to_string());
        println!("{:?}",get_logs());
        contract.indirect_add_entry("dateAndTime".to_string(),"NameofSam".to_string(),"My Message is".to_string());
        println!("{:?}",get_logs());
        assert_eq!(get_logs(), ["Init Subcongtract -  Log_contract: devacct admin = mmednicktoss.testnet", "indirect_entry_add completed"], "Exec.");
        let info = contract.info();
        println!("{:?}",info);
        
        }

}
