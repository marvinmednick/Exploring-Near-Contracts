use near_sdk::collections::{Vector};
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
   serde::{Deserialize, Serialize},
//    serde::ser::SerializeSeq,
    AccountId, PanicOnDefault
};
use near_sdk::{env, near_bindgen};
//use chrono::{DateTime, Utc, Local};
//use serde::{Deserialize, Serialize};


#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct LogEntry {
    entry_id:  u64,
    timestamp: String,
    account: AccountId,
    name: String,
    message: String,
}


#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize,PanicOnDefault)]
pub struct Contract {
    owner_id:  AccountId,
    mylog:  Vector<LogEntry>
}

#[near_bindgen]
impl Contract {

    #[init]
    pub fn new() -> Self {
        Self {
            owner_id: env::current_account_id(),
            mylog: Vector::new(b"c"),        
        }
   }

    pub fn add_entry (&mut self, timestamp: String, name: String, message: String) {
	let newtime = env::block_timestamp().to_string();
	let count_str = self.num_entries().to_string();
	let newinfo = self.get_info();
	
        let new_entry = LogEntry {
            entry_id : self.mylog.len() +1,
            timestamp : env::block_timestamp().to_string(),
            account : env::predecessor_account_id(),
            name,
            message   : message + &"; " + &count_str + &"; " + &newtime + &"; " + &newinfo,
        };
        self.mylog.push(&new_entry);
        env::log_str("Entry Added!");
        env::log_str(&self.get_info())
    }
    pub fn num_entries(&self) -> u64 {
       self.mylog.len()
    }

    pub fn get_info(&self) -> String {
	let env_used_gas = u64::from(env::used_gas()).to_string();
    let env_prepaid_gas = u64::from(env::prepaid_gas()).to_string();
	let env_time = env::block_timestamp().to_string();
	let curcount = self.mylog.len().to_string();

	let result = String::new() + &"Block time: " + &env_time + "; used_gas: " + &env_used_gas + "; prepaid_gas: " + &env_prepaid_gas + &"; num_entries: " + &curcount;
	result
    }

    pub fn list_entries(&self) -> String {
        let mut count = 0;
        let mut result = String::new();
        
        result += r#"{ "log_entries": ["#;
        for entry in self.mylog.iter() {
            count = count + 1;
            if count > 1 {
                result += ", ";
            }
            //let line = format!("Entry #{} TS: {} NAME: {} ACCT: {} MSG: {}",count, entry.timestamp, entry.name, entry.account, entry.message);
            let serialized = near_sdk::serde_json::to_string(&entry).unwrap();
            result += &serialized;
    
//            println!("{}",&result);
        }
        result += r#"] }"#;

        
        result
    }

    pub fn reset_log (&mut self, msg: String) -> String {
        let result = msg + " " + &env::current_account_id().to_string() + " " + &env::predecessor_account_id().to_string();
        self.mylog.clear();
        result
        
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
    fn check_add_entry() {
        let account = AccountId::new_unchecked("mmednick.testnet".to_string());
        let context = get_context(account);
        testing_env!(context.build());

        let mut contract = Contract::new();
        contract.add_entry("dateAndTime".to_string(),"NameofSam".to_string(),"My Message is".to_string());
        
        assert_eq!(get_logs(), ["Entry Added!"], "Exec.");

        assert_eq!(contract.num_entries(),1);

        contract.add_entry("dateAndTime1".to_string(),"My Name is".to_string(),"My Message is".to_string());
        assert_eq!(contract.num_entries(),2);

        contract.list_entries();

    }

}
