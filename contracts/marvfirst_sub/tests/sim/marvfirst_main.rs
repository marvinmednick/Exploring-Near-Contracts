use near_sdk::near_bindgen;
    
#[allow(dead_code)]
#[near_bindgen]
pub struct LogContract {
}

#[near_bindgen]
impl LogContract {

    #[allow(unused_variables, dead_code)]    
    pub fn new() {}
    #[allow(unused_variables, dead_code)]   
    pub fn add_entry (&mut self, timestamp: String, name: String, message: String) {}
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

