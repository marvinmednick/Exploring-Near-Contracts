
const localStorage_log_config = {
    maxlen : 100
}


function storedLog(value, prefix = null) {
   

    let storage_key = "storageLog";
    if (prefix != null && typeof prefix === 'string') {
        storage_key = prefix + "_" + storage_key;

    }
    var mydata = window.localStorage.getItem(storage_key);
    console.log("MD", mydata);
    //var mydata = localStorage[storage_key];
    var mylog;
    if (mydata == null) {
            console.log("starting fressh")
            mylog = [];
    }
    else {
        console.log("continuing")
        let newdata = localStorage[storage_key];
        console.log("S1",storage_key,mydata,newdata)
        mylog = JSON.parse(mydata);
    }
    const entry = {
        ts : new Date(),
        data : value
   }

   console.log("Adding")
   // add an entry at the end
    mylog.push(entry)

    // if length has reached the max, then remove the oldest entry
    if (mylog.length > localStorage_log_config.maxlen) {
        mylog.shift();
    }
   
   console.log("Creating string",mylog);
   mydata = JSON.stringify(mylog)
    console.log("STORING",mylog, mydata);
    localStorage[storage_key] = mydata;


/*
    var logdata = window.localStorage.getItem("storageLog");
    console.log("BEFORE",logdata);
    if (logdata == null) {
        log = new Array();
    }
    else {
        log = JSON.parse(logdata);
    }


    log.push(value);

    logdata = JSON.stringify(log);
    console.log("AFTER",log,logdata);
      
    window.localStorage.setItem("storageLog",log);
   */
}


module.exports = storedLog
