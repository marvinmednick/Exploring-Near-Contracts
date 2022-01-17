use near_sdk::{near_bindgen,
               borsh::{self, BorshDeserialize, BorshSerialize},
               serde::{Deserialize, Serialize},
               };


use near_sdk::json_types::U64;           

use near_sdk::AccountId;
    
#[allow(dead_code)]
#[near_bindgen]
pub struct LogContract {
}

#[near_bindgen]
impl LogContract {

    #[allow(unused_variables, dead_code)]    
    pub fn new() {}
    #[allow(unused_variables, dead_code)]   
    pub fn add_entry (&mut self, timestamp: String, name: String, message: String, cc_used_gas: U64) {}
    #[allow(unused_variables, dead_code)]
    pub fn num_entries(&self) -> u64 { 0 }
    #[allow(unused_variables, dead_code)]
    pub fn get_info(&self)  {} 
    #[allow(unused_variables, dead_code)]
   	pub fn get_last(&self)  { } 
    #[allow(unused_variables, dead_code)]
    pub fn list_entries(&self) { } 
    #[allow(unused_variables, dead_code)]
    pub fn reset_log (&mut self)  { }
}


#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct LogEntry {
    pub entry_id:  u64,
    pub timestamp: String,
    block_ts: u64,
    pub account: AccountId,
    signaccount: AccountId,
    pub name: String,
    pub message: String,
    used_gas: u64,
    cc_used_gas: u64,
    transfer_amount: u128
}