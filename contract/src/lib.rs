use near_sdk::collections::{Vector};
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    serde::{Deserialize, Serialize},
    AccountId, PanicOnDefault
};
use near_sdk::{env, near_bindgen};
//use chrono::{DateTime, Utc, Local};

/*
use near_sdk::collections::{LookupMap, UnorderedSet};
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    log,
    serde::{Deserialize, Serialize},
    AccountId, PanicOnDefault, Promise,
};
use near_sdk::{env, near_bindgen};

// 5 Ⓝ in yoctoNEAR
const PRIZE_AMOUNT: u128 = 5_000_000_000_000_000_000_000_000;

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub enum AnswerDirection {
    Across,
    Down,
}

/// The origin (0,0) starts at the top left side of the square
#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct CoordinatePair {
    x: u8,
    y: u8,
}

*/

/// The origin (0,0) starts at the top left side of the square
#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct LogEntry {
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
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner_id,
            mylog: Vector::new(b"c"),        
        }
    }

    pub fn add_entry (&mut self, timestamp: String, name: String, message: String) {
        let new_entry = LogEntry {
            timestamp,
            account : env::predecessor_account_id(),
            name,
            message   
        };
        self.mylog.push(&new_entry);
        env::log_str("Entry Added!");
    }
    pub fn num_entries(&self) -> u64 {
       self.mylog.len()
    }

    pub fn list_entries(&self) -> String {
        let mut count = 0;
        let mut result = String::new();
        
        for entry in self.mylog.iter() {
            count = count + 1;
            let line = format!("Entry #{} TS: {} NAME: {} ACCT: {} MSG: {}",count, entry.timestamp, entry.name, entry.account, entry.message);
            result += &line;
            println!("{}",&result);
        }
        result
    }

    pub fn reset_log (&mut self, msg: String) -> String {
        env::predecessor_account_id().to_string();
        msg
        
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

        let account = AccountId::new_unchecked("mmednick.testnet".to_string());
        let send_account = AccountId::new_unchecked("mmednick.testnet".to_string());
        let mut contract = Contract::new(account);
        contract.add_entry(&send_account,"dateAndTime".to_string(),"NameofSam".to_string(),"My Message is".to_string());
        
        assert_eq!(get_logs(), ["Entry Added!"], "Exec.");

        assert_eq!(contract.num_entries(),1);

        contract.add_entry(&send_account,"dateAndTime".to_string(),"My Name is".to_string(),"My Message is".to_string());
        assert_eq!(contract.num_entries(),2);

        contract.list_entries()

    }

}
