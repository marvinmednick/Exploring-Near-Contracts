
const localStorage_log_config = {
    maxlen : 100
}


function storedLog(value, prefix = null) {
   

    let storage_key = "storageLog";
    if (prefix != null && typeof prefix === 'string') {
        storage_key = prefix + "_" + storage_key;

    }
    var mydata = window.localStorage.getItem(storage_key);
    
    //var mydata = localStorage[storage_key];
    var mylog;
    if (mydata == null) {
        
            mylog = [];
    }
    else {
        
        let newdata = localStorage[storage_key];
         mylog = JSON.parse(mydata);
    }
    const entry = {
        ts : new Date(),
        data : value
   }

   
   // add an entry at the end
   mylog.push(entry)

    // if length has reached the max, then remove the oldest entry
    if (mylog.length > localStorage_log_config.maxlen) {
        mylog.shift();
   }
   
   
   mydata = JSON.stringify(mylog)
   
   localStorage[storage_key] = mydata;

}


module.exports = storedLog
