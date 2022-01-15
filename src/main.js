import "regenerator-runtime/runtime";
import * as nearAPI from "near-api-js";
const { utils } = require("near-api-js");
import getConfig from "./config";
import Big from 'big.js';
const nearMainConfig = getConfig(process.env.NODE_ENV || "development");
import getSubAcctConfig from "./subacct_config";
const  nearSubAcctConfig = getSubAcctConfig(process.env.NODE_ENV || "development");

var mainContract;
var subAcctContract;

const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed();
const TOKEN_AMOUNT = Big(1).times(10**24).toFixed();
  
function allStorage() {

    var values = [],
        keys = Object.keys(localStorage),
        i = keys.length;

    while (i--) {
        var entry = {
            'key' : keys[i],
            'value' : localStorage.getItem(keys[i])
        }
        values.push(entry);
    }

    return values;
}

//console.log(allStorage());
// Define Object to hold separate connnections and wallets to allow multiple signin accounts
//  However it seems that the local storage for the web page only seems to support once
// account logged in at time... 
window.nearConnections = {
    mainacct: { near: null,
                login_account: null,
                contract_account: null,
                walletConnection: null, 
                contract: null ,
                viewMethods: ['num_entries', 'list_entries', 'get_last'],
                changeMethods: ['new', 'add_entry', 'reset_log', 'get_info'], 
              },
    subacct:  { near: null, 
                login_account: null,
                contract_account: null,
                walletConnection: null, 
                contract: null,
                viewMethods: ['indirect_num_entries', 'indirect_get_last'],
                changeMethods: ['new', 'indirect_add', 'indirect_add_entry', 'reset_log' ],
              },
}



// Copied from rust-counter
async function connect(nearConfig, account) {
    console.log("Starting connection for ", account, nearConfig);
    let connection = window.nearConnections[account];

    // Connects to NEAR and provides `near`, `walletAccount` and `contract` objects in `window` scope
    // Initializing connection to the NEAR node.
    connection.near = await nearAPI.connect({
        deps: {
            keyStore: await new nearAPI.keyStores.BrowserLocalStorageKeyStore()
        },
        ...nearConfig
    });
    const currentUrl = new URL(window.location.href);
    console.log("Before wallet", account,  currentUrl, allStorage());

    // Needed to access wallet login
    connection.walletConnection = await new nearAPI.WalletConnection(connection.near, account);
    console.log("after Wallet", account, currentUrl, allStorage());

    // Initializing our contract APIs by contract name and configuration.
    connection.contract = await new nearAPI.Contract(connection.walletConnection.account(), nearConfig.contractName, {
        // View methods are read-only – they don't modify the state, but usually return some value
        viewMethods: connection.viewMethods,
        // Change methods can modify the state, but you don't receive the returned value when called
        changeMethods: connection.changeMethods,
        // Sender is the account ID to initialize transactions.
        // getAccountId() will return empty string if user is still unauthorized
        sender: connection.walletConnection.getAccountId()
    });

    connection.login_account = await connection.near.account(connection.walletConnection.getAccountId());
    connection.contract_account = await connection.near.account(nearConfig.contractName);
    console.log("X", connection.contract, window.location.href);
}


function errorHelper(err) {
    // if there's a cryptic error, provide more helpful feedback and instructions here
    // TODO: as soon as we get the error codes propagating back, use those
    let disp_err = "Error during processing";
    if (err.message.includes('Cannot deserialize the contract state')) {
        disp_err = 'Cannot deserialize the contract state';
        console.warn('NEAR Warning: the contract/account seems to have state that is not (or no longer) compatible.\n' +
            'This may require deleting and recreating the NEAR account as shown here:\n' +
            'https://stackoverflow.com/a/60767144/711863');
    }
    if (err.message.includes('Cannot deserialize the contract state')) {
        disp_err = 'Cannot deserialize the contract state';
        console.warn('NEAR Warning: the contract/account seems to have state that is not (or no longer) compatible.\n' +
            'This may require deleting and recreating the NEAR account as shown here:\n' +
            'https://stackoverflow.com/a/60767144/711863');
    }
    if (err.message.includes('The contract is not initialized')) {
        disp_err = 'Contract is not initialized';
        console.warn('NEAR Warning: the contract/accountis not yet initialized.');
    }
    // err_string = JSON.stringify(error_info,null,2);
    //console.log(error_info, err_string)
    console.error(err);
    document.querySelector('#error_status').innerText = "ERROR: " + disp_err;
    document.querySelector('#error_status').style.setProperty('display', 'block')

}

// Variables used tp size the columns of data and headers in display all entries
let col1_size = 4;
let col2_size = 55;
let col3_size = 50;

function formatLogHdr() {
    let spacer = "  "
    let result = "#".padEnd(col1_size) +
        spacer + "Timestamps".padEnd(col2_size, " ") +
        spacer + "Account".padEnd(col3_size, " ") +
        spacer + "Message\n"

    return (result);
}

function formatLogEntry(entry) {
    let spacer = "  "
    let block_time = new Date(entry.block_ts / 1e6);
    console.log(block_time, typeof(block_time));
    let block_iso = block_time.toISOString();


    let line1 = entry.entry_id.toString().padEnd(col1_size) 
      + spacer + ("User: ".padEnd(7) + entry.timestamp).padEnd(col2_size, " ") 
      + spacer + entry.account.padEnd(col3_size, " ") +
      + spacer + entry.message + '\n';

    let sign_account_info = "";
    if (entry.signaccount != entry.account) {
        sign_account_info = "(signed by: " + entry.signaccount + ")";
    }
    let line2 = " ".padEnd(col1_size) 
        + spacer + ("Block: ".padStart(7) + block_iso 
        + spacer + " (" + entry.block_ts.toString()+ ")").padEnd(col2_size, " ")  
        + spacer +  sign_account_info.padEnd(col3_size," ") + '\n';
    /*
    let result = entry.entry_id.toString().padEnd(4)
               + spacer + entry.timestamp.padEnd(25," ")
               + spacer + (block_iso + " (" + entry.block_ts.toString() + ")").padEnd(50," ")
               + spacer + entry.account.padEnd(35," ")
               + "   " + entry.message+ '\n';
    */

    return (line1 + line2);
}

function update_current_info(account) {

    let cur_count = 0;
    let update_info = "The log is empty";

    mainContract.num_entries().then(count => {
        cur_count = count;
        document.querySelector('#showcount').innerText = cur_count;
        mainContract.get_last().then(last_info => {
            var lastEntry;
            if (cur_count > 0) {
                lastEntry = JSON.parse(last_info);
                update_info = JSON.stringify(lastEntry, null, 2);
            }
            document.querySelector('#cur_info').innerText = update_info;
        }).catch(err => errorHelper(err));
    }).catch(err => errorHelper(err));
    console.log("BUNCH OF GAS",BOATLOAD_OF_GAS, "TOKEN_AMOUNT",TOKEN_AMOUNT);
}


var prevBalances = { 
        main_login_balance:  { "available" : "Not Available" },
        sub_login_balance: { "available" : "Not Available" },
        main_acct_balance: { "available" : "Not Available" },
        sub_acct_balance:  { "available" : "Not Available" },
 };

 var curBalances = {
        main_login_balance: { "available" : "Not Available" },
        sub_login_balance:  { "available" : "Not Available" },
        main_acct_balance:  { "available" : "Not Available" },
        sub_acct_balance:   { "available" : "Not Available" },
 };


function updatePrevBalances () {
    prevBalances = JSON.parse(JSON.stringify(curBalances));
    console.log("updateBal:", prevBalances, curBalances);   
};


function updateLogins() {

};


async function updateCurBalances() {
    console.log("update1");
    curBalances.main_acct_balance = await nearConnections.mainacct.contract_account.getAccountBalance();
    console.log("update2");
    curBalances.sub_acct_balance = await nearConnections.subacct.contract_account.getAccountBalance();
    console.log("update3");
    
    if (nearConnections.mainacct.walletConnection.isSignedIn()) {
        curBalances.main_login_balance = await nearConnections.mainacct.login_account.getAccountBalance();
    }
    console.log("update4");
    if (nearConnections.subacct.walletConnection.isSignedIn()) {
        curBalances.sub_login_balance = await  nearConnections.subacct.login_account.getAccountBalance();
    }
    console.log("update5");
 
    document.querySelector('#main_acct_balance').innerText = curBalances.main_acct_balance.available;
    document.querySelector('#sub_acct_balance').innerText =  curBalances.sub_acct_balance.available;
    
    
    console.log("update6");

};


async function updateUI() {

    console.log("Beg updateUI",window.location);
    document.querySelector('#error_status').style.setProperty('display', 'none');

    document.querySelector('#main_contract_id').innerText = 
    nearMainConfig.contractName ;
    document.querySelector('#sub_contract_id').innerText = 
    nearSubAcctConfig.contractName;
    

    let cur_account = nearConnections.mainacct.walletConnection.getAccountId();
    document.querySelector('#main_login_id').innerText = cur_account;
    
    let cur_subaccount = nearConnections.subacct.walletConnection.getAccountId();

    console.log("Here");
    await  updateCurBalances();
    console.log("THere");
      

    update_current_info();

    if (!cur_account) {
        document.querySelector('#main_login_id').innerText = "";
        document.querySelector('#main_login_text').innerText = "You are not currently logged in.";
        Array.from(document.querySelectorAll('.sign-in-main')).map(it => it.style = 'display: block;');
        Array.from(document.querySelectorAll('.after-sign-in-main')).map(it => it.style = 'display: none;');
        Array.from(document.querySelectorAll('.sign-in-subacct')).map(it => it.style = 'display: block;');
        Array.from(document.querySelectorAll('.after-sign-in-subacct')).map(it => it.style = 'display: none;');
        document.querySelector('#main_login_balance').innerText = "---";
    } else {
        document.querySelector('#main_login_text').innerText = "You current are logged in as ";
        document.querySelector('#main_login_id').innerText = cur_account;
        Array.from(document.querySelectorAll('.sign-in-main')).map(it => it.style = 'display: none;');
        Array.from(document.querySelectorAll('.after-sign-in-main')).map(it => it.style = 'display: block;');
        Array.from(document.querySelectorAll('.sign-in-subacct')).map(it => it.style = 'display: none;');
        Array.from(document.querySelectorAll('.after-sign-in-subacct')).map(it => it.style = 'display: block;');
        document.querySelector('#main_login_balance').innerText = curBalances.main_login_balance.available;

    }



     if (!cur_subaccount) {
        document.querySelector('#subacct_login_id').innerText = "";
        document.querySelector('#subacct_login_text').innerText = "You are not currently logged in.";
        Array.from(document.querySelectorAll('.sign-in-subacct')).map(it => it.style = 'display: block;');
        Array.from(document.querySelectorAll('.after-sign-in-subacct')).map(it => it.style = 'display: none;');
        document.querySelector('#sub_login_balance').innerText =  "---";
    } else {
        document.querySelector('#subacct_login_text').innerText = "You current are logged in as "
        document.querySelector('#subacct_login_id').innerText = cur_subaccount;
        Array.from(document.querySelectorAll('.sign-in-subacct')).map(it => it.style = 'display: none;');
        Array.from(document.querySelectorAll('.after-sign-in-subacct')).map(it => it.style = 'display: block;');
        document.querySelector('#sub_login_balance').innerText =  curBalances.sub_login_balance.available;

    }
    console.log("End updateUI",window.location);
}


// Log in user using NEAR Wallet on "Sign In" button click
document.querySelector('#sign-in-main-button').addEventListener('click', () => {
    nearConnections.mainacct.walletConnection.requestSignIn(
        { "contractId": nearMainConfig.contractName,
          "successUrl": window.location.origin + '/mainacct' }
    );
});

document.querySelector('#sign-out-main-button').addEventListener('click', () => {
    nearConnections.mainacct.walletConnection.signOut();
    // TODO: Move redirect to .signOut() ^^^
    window.location.replace(window.location.origin + window.location.pathname);
});


// Log in user using NEAR Wallet on "Sign In" button click
document.querySelector('#sign-in-subacct-button').addEventListener('click', () => {
    nearConnections.subacct.walletConnection.requestSignIn(
            { "contractId": nearSubAcctConfig.contractName,
              "successUrl": window.location.origin + '/subacct' }
    );
});

document.querySelector('#sign-out-subacct-button').addEventListener('click', () => {
    nearConnections.subacct.walletConnection.signOut();
    // TODO: Move redirect to .signOut() ^^^
    window.location.replace(window.location.origin + window.location.pathname);
});





document.querySelector('#refresh').addEventListener('click', () => {
    mainContract.num_entries().then(count => {
        //console.log("Count is", count);
        //console.log(document.querySelector('#showcount').innerText)
        // document.querySelector('#showcount').classList.replace('loader','number');
        document.querySelector('#showcount').innerText = count === undefined ? 'calculating...' : count;
    }).then(updateUI)
    .catch(err => errorHelper(err));
});



function append_entry(value, index, array) {

}

document.querySelector('#display_entries').addEventListener('click', () => {
    document.querySelector('#entry_list_hdr').innerText = formatLogHdr(); //"#".padEnd(4) + "   " + "Timestamp".padEnd(25," ") + "   " + "Account".padEnd(35," ")+ "   " + "Message\n";
    mainContract.list_entries().then(listdata => {
        //console.log("retrieved", listdata);
        const obj = JSON.parse(listdata);
        //console.log("retrieved", obj);
        let finaldata = "";
        obj.log_entries.forEach(element => finaldata += formatLogEntry(element));
        //console.log(finaldata)
        //console.log(finaldata.length)
        //console.log(document.querySelector('#showlistdata').innerText);
        // document.querySelector('#showcount').classList.replace('loader','number');
        document.querySelector('#showlistdata').innerText = finaldata;
    }).catch(err => errorHelper(err));
});

document.querySelector('#hide_entries').addEventListener('click', () => {
    document.querySelector('#entry_list_hdr').innerText = "";
    document.querySelector('#showlistdata').innerText = "";
});

document.querySelector('.log_reset .btn').addEventListener('click', () => {
    mainContract.reset_log({})
      .then(listdata => {
          console.log("retrieved", listdata);
      })
      .then(updateUI)
      .catch(err => errorHelper(err));
      updatePrevBalances();
});


document.querySelector('#main-add-entry-form').onsubmit = function() {
    // prevent further default processing from occuring (i.e. don't POST the result/refresh page)
    event.preventDefault();

    // process the form data
    add_new_entry(this, mainContract);

};

document.querySelector('#subacct-add-entry-form').onsubmit = function() {
    // prevent further default processing from occuring (i.e. don't POST the result/refresh page)
    event.preventDefault();

    // process the form data
    indirect_add_new_entry(this,1);

};

/*
function post_add_entry() {
    $("inprocess_modal").modal("hide")
}
*/


function add_new_entry(form_info,contract) {
    const d = new Date();
    //console.log("Date type is", typeof(d), d)

    let args = {
        timestamp: d,
        name: form_info.elements['name'].value,
        message: form_info.elements['msg'].value
    }
  //  $('inprocess_modal').modal('show');
    $("main-add_status").style = "display:block;";
    document.querySelector('#main-add-status').style = "display: block;";
    document.querySelector('#main-add-entry-form').style = "display: none;";
        mainContract.add_entry(args,BOATLOAD_OF_GAS,TOKEN_AMOUNT).then(result => {
        console.log("Add Entry", result);
        form_info.reset();
        document.querySelector('#main-add-status').style = "display: none;";
        document.querySelector('#main-add-entry-form').style = "display: block;";
    }).then(updateUI).catch(err => errorHelper(err));

    updatePrevBalances();
}


function indirect_add_new_entry(form_info) {
    const d = new Date();

    var amount_str = "0";
    var transfer_amount = Big(0);

    // remove any commas or _ from input string 
    if (form_info['amount'].value)  {
        amount_str = (form_info['amount'].value).replace(/,|_/g,"");
    }

      
    document.querySelector('#transfer_errmsg').style = "display:none";
    try {
        transfer_amount = Big(amount_str);
    } catch (error) {
        console.error("Bad transfer amount", amount_str);
        document.querySelector('#transfer_errmsg').style = "display:block";
        return(false)
    }
            
 
    var nearamt;
    if (form_info.elements['denomination'].value == "near") {
        nearamt = transfer_amount.times(10**24).toFixed();    
    } else {
        nearamt = transfer_amount.times(10**6).toFixed();
    }
 
 
    let args = {
        timestamp: d,
        name: form_info.elements['name'].value,
        message: form_info.elements['msg'].value,
        transfer_amount: nearamt,
    };

    //console.log("indirect add entry args:", args)
   // $('inprocess_modal').modal('show');
    $("add_status").style = "display:block;";
    document.querySelector('#subacct-add-status').style = "display: block;";
    document.querySelector('#subacct-add-entry-form').style = "display: none;";
 
    subAcctContract.indirect_add(args, BOATLOAD_OF_GAS, nearamt)
        .then(result => {
            console.log("Add Entry", result);
            form_info.reset();
            document.querySelector('#subacct-add-status').style = "display: none;";
            document.querySelector('#subacct-add-entry-form').style = "display: block;";
    }).then(updateUI).catch(err => errorHelper(err));


    updatePrevBalances();
}


async function setupConnections() {
  
  // Save a copy of the incoming URL  --
  // if this is redirected from the wallet it include the account and key information
  let incomingURL = new URL(window.location.href);

  //create a URL which is referring to the base page  
  // note that is currently assumed to be the the root of the server (e.g. localhost:1234/)
  // (if this were to be deployed at some other offset additional parsing will be needed to
  //  add in the part of the pathname which is considered the root)
  let noParameterURL = new URL(window.location.origin);


  // Initializing the wallet connection analyzes the current URL
  // and if it sees an account ID it then assumes we're logging in
  // so setups up the local storage with the key.
  //
  // In our case, we have two possible logins and we want to control
  // which one is logged in.    This is handled by specifying 
  // different URLs   (baseURL/mainacct or baseURL/subacct) for the
  ///'callback' from the NEAR wallet
  // From there the code saves a copy the original incoming URL
  // and also creates a new URL with just the root path of the page
  // 
  // Somewhere, after the wallet processing (though I haven't found it) the 
  // windows.local.href is updated to remove the addigional informatoin (acccountId/keys, etc)
  // so what is done below, we set the window.location to be the base root of the page
  // initialize the connection for the acct that IS NOT being logged in first
  // then restore the original URL and setup the connection for the one that is being logged in

  // check if this is call back from the wallet for the main account
  if (incomingURL.pathname == "/mainacct") {
      // if so setup the connection without any information from the wallete call back 
      window.history.replaceState({}, document.title,  noParameterURL.toString());
      await connect(nearSubAcctConfig,'subacct');
      // restore the original URL with the account name and keys, then setup
      // the connection for the main account
      window.history.replaceState({}, document.title, incomingURL.toString());
      await connect(nearMainConfig,'mainacct');
  } else {
    // not processing a call back for the main account, so this is either
    // a callback for the subacct OR its not callback at all.
    // Either way the code will process the mainacct first, with no parameters from the wallet
    // and then process the subacct with the original URL (which may or may not  have 
    // and account/keys  -- depending on how we got her)
    window.history.replaceState({}, document.title,  noParameterURL.toString());
    await connect(nearMainConfig, 'mainacct');
    window.history.replaceState({}, document.title, incomingURL.toString());
    await connect(nearSubAcctConfig,'subacct');
  }
  // restore the URL to main page URL removing the path addded by the wallet callback
  window.history.replaceState({}, document.title,  noParameterURL.toString());

  // update global shortcuts for contracts
  mainContract = nearConnections.mainacct.contract;
  subAcctContract = nearConnections.subacct.contract;
}


window.nearInitPromise = setupConnections()
    .then(updateUI)
    .catch(console.error);
console.log("Reloaded...", new Date());
