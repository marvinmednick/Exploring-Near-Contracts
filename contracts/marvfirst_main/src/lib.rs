use near_sdk::{
    AccountId, PanicOnDefault, env, near_bindgen, log, require,
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::{Vector},
    serde_json::json,
    json_types::U64,
    serde::{Deserialize, Serialize},
};

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug)]
#[serde(crate = "near_sdk::serde")]

pub struct MyTimestamp {
	value : u64
}
    

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct LogEntry {
    entry_id:  u64,
    timestamp: String,
    block_ts: u64,
    account: AccountId,
    signaccount: AccountId,
    name: String,
    message: String,
    used_gas: u64,
    cc_used_gas: u64,
    transfer_amount: u128,
 
}


#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize,PanicOnDefault)]
pub struct LogContract {
    owner_id:  AccountId,
    admin: AccountId,
    mylog:  Vector<LogEntry>
}

#[near_bindgen]
impl LogContract {

    #[init]
    pub fn new(admin: String) -> Self {
        log!("Log Contract Init - owner: {}",env::current_account_id());
        Self {
            owner_id: env::current_account_id(),
            admin: admin.try_into().unwrap(),
            mylog: Vector::new(b"c"),        
        }

   }

    #[payable]
    pub fn add_entry (&mut self, timestamp: String, name: String, message: String, cc_used_gas: U64) {
	                                  
        let new_entry = LogEntry {
            entry_id : self.mylog.len()+1,
            timestamp : timestamp, 
            block_ts:   u64::from(env::block_timestamp()),
            account : env::predecessor_account_id(),
            signaccount: env::signer_account_id(), 
            name    : name,
            message   : message,
            used_gas :   u64::from(env::used_gas()),
            cc_used_gas: u64::from(cc_used_gas),
            transfer_amount: env::attached_deposit(),

        };
        self.mylog.push(&new_entry);
        log!("Entry {} Added.  Attached Depost: {}",self.mylog.len(), env::attached_deposit().to_string());
        //env::log_str(&("Entry Added! ".to_owned() + "Deposit: " + &env::attached_deposit().to_string()));
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
   

	pub fn get_last(&self) -> String {

        let mut result = String::new();
		
        let len = self.mylog.len();
        if len > 0 {
    
		  let entry = self.mylog.get(len-1);
		  let x = match entry {
			Some(x) => { near_sdk::serde_json::to_string(&x).unwrap() }
			None => { String::new() }
		  };    
		   result = x;
        };
		result
	}


    fn  check_for_admin_rights(&self) {
        let request_acct = env::predecessor_account_id().to_string();
        log!("Update of log contract requested by {}",&request_acct);
        let check1 = env::predecessor_account_id() == env::current_account_id();
        let check2 = env::predecessor_account_id() ==  self.admin;
        require!(check1 || check2, "Only contract or admin can update configuration");

    }


    /// Update admin 
    ///
    /// Since initialization is only done one once (unless using 'init(ignore_state)' )
    pub fn update_admin(&mut self, admin: String) {
            
        self.check_for_admin_rights();
        // require!(env::predecessor_account_id() == self.admin_user,"Admin account method");
        self.admin = admin.try_into().unwrap();
    }



    // list_entries 
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

        }
        result += r#"] }"#;

        
        result
    }

    /// Return the configured information for this contract
    ///
    /// return JSON structure with the logging account and the admin user
    pub fn info(&self) -> String {
        



        let result = json!({
                "owner_id" : self.owner_id.to_string(),
                "admin"      : self.admin.to_string(),
            }).to_string();
        result
    }
    

    pub fn reset_log (&mut self) -> String {
        let reset_acct = env::predecessor_account_id().to_string();
        log!("Reset log requested by {}",&reset_acct);
        let check1 = env::predecessor_account_id() == self.owner_id;
        let check2 = env::predecessor_account_id() ==  self.admin;
        require!(check1 || check2, "Only contract or admin can reset");
        let result = env::current_account_id().to_string() + " " + &self.admin.to_string() + " " + &reset_acct;
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
    use near_sdk::{testing_env, AccountId,serde_json};

    // part of writing unit tests is setting up a mock context
    // provide a `predecessor` here, it'll modify the default context
    fn get_context(predecessor: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder.predecessor_account_id(predecessor);
        builder
    }

    fn setup_contract() -> LogContract {
        let account = AccountId::new_unchecked("admin".to_string());
        let context = get_context(account);
        testing_env!(context.build());

        let contract = LogContract::new("admin".to_string());
        contract
     
    }

    #[test]
    fn check_info() {

        #[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug, Clone)]
        #[serde(crate = "near_sdk::serde")]
        struct ContractInfo {
               owner_id:  String,
               admin: String,
        }
    
        let contract = setup_contract();
        let info_json = contract.info();
        println!("Info:  {:?}",info_json);
        let info_data = serde_json::from_str::<ContractInfo>(&info_json).unwrap();
        assert_eq!(info_data.admin,"admin".to_string() );

    }

	#[test]
    fn check_add_entry() {
        let mut contract = setup_contract();
        contract.add_entry("dateAndTime".to_string(),"NameofSam".to_string(),"My Message is".to_string(),U64::from(0));    
        assert_eq!(get_logs(), ["Log Contract Init - owner: alice.near", "Entry 1 Added.  Attached Depost: 0"], "Exec.");

        assert_eq!(contract.num_entries(),1);

        contract.add_entry("dateAndTime1".to_string(),"My Name is".to_string(),"My Message is".to_string(),U64::from(0));
        assert_eq!(contract.num_entries(),2);

    }

	#[test]
    fn check_list() {
        let mut contract = setup_contract();

        let entries_json = contract.list_entries();
		let loglist = serde_json::from_str::<LogList>(&entries_json).unwrap();
        assert_eq!(loglist.log_entries.len(),0);
        println!("entries: {:?}", loglist);

        contract.add_entry("dateAndTime".to_string(),"NameofSam".to_string(),"My Message is".to_string(),U64::from(0));    
        contract.add_entry("dateAndTime1".to_string(),"My Name is".to_string(),"My Message is".to_string(),U64::from(0));
        assert_eq!(contract.num_entries(),2);

		#[derive(Deserialize, Debug, Clone)]
        pub struct LogList {
            pub log_entries: Vec<LogEntry>,
        }


        let entries_json = contract.list_entries();
		let loglist = serde_json::from_str::<LogList>(&entries_json).unwrap();
        println!("entries: {:?}", loglist);

        assert_eq!(loglist.log_entries[0].entry_id,1);
        assert_eq!(loglist.log_entries[1].entry_id,2);
        assert_eq!(loglist.log_entries[0].timestamp,"dateAndTime");
        assert_eq!(loglist.log_entries[1].timestamp,"dateAndTime1");
        assert_eq!(loglist.log_entries.len(),2);
    }

	#[test]
    fn check_reset() {
        let mut contract = setup_contract();
        contract.add_entry("dateAndTime".to_string(),"NameofSam".to_string(),"My Message is".to_string(),U64::from(0));    
        contract.add_entry("dateAndTime".to_string(),"NameofSam".to_string(),"My Message is".to_string(),U64::from(0));    
        assert_eq!(contract.num_entries(),2);
		contract.reset_log();
        assert_eq!(contract.num_entries(),0);
	}

}
