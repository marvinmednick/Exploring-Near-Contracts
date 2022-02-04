import "regenerator-runtime/runtime";
import * as nearAPI from "near-api-js";
const { utils } = require("near-api-js");
import getConfig from "./config";
import {CONTRACT_NAME, SUBCONTRACT_NAME}  from "./contract_names"
import Big from 'big.js';
const nearMainConfig = getConfig(process.env.NODE_ENV || "development");
import getSubAcctConfig from "./subacct_config";
const  nearSubAcctConfig = getSubAcctConfig(process.env.NODE_ENV || "development");

var main_contract;
var proxy_contract;

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

// Define Object to hold separate connnections and wallets to allow multiple signin accounts
//  However it seems that the local storage for the web page only seems to support once
// account logged in at time...
window.nearConnections = {
    mainacct: { near: null,
                login_account: null,
                contract_name: null,
                contract_account: null,
                walletConnection: null,
                contract: null,
                viewMethods: ['num_entries', 'list_entries', 'get_last', 'info', 'get_info'],
                changeMethods: ['new', 'add_entry', 'reset_log', ],
              },
    subacct:  { near: null,
                login_account: null,
                contract_name: null,
                contract_account: null,
                walletConnection: null,
                contract: null,
                viewMethods: ['indirect_num_entries', 'indirect_get_last', 'info'],
                changeMethods: ['new', 'indirect_add_entry', 'reset_log' ],
              },
}


function localStorage_log(Value) {
    let index = 0
    if (index = window.localStorage.getItem("logIndex") != null ) {
        index = index + 1;
    }

    let key = "log_" + index;
    window.localStorage.setItem(key, Value);
    window.localStorage.setItem("logIndex",index);
}


async function getKeyStore(account) {
    let x = await new nearAPI.keyStores.BrowserLocalStorageKeyStore(window.localStorage,account); 
    // console.log(x); 
    return(x);

}

// Copied from rust-counter
async function connect(nearConfig, account, contractName) {
    let connection = window.nearConnections[account];

    // Connects to NEAR and provides `near`, `walletAccount` and `contract` objects in `window` scope
    // Initializing connection to the NEAR node.
    connection.near = await nearAPI.connect({
        deps: {
            keyStore: await getKeyStore(account)
        },
        ...nearConfig
    });
    const currentUrl = new URL(window.location.href);


    // Needed to access wallet loginf
    connection.walletConnection = await new nearAPI.WalletConnection(connection.near, account);


    // Initializing our contract APIs by contract name and configuration.
    connection.contract = await new nearAPI.Contract(connection.walletConnection.account(), contractName, {
        // View methods are read-only – they don't modify the state, but usually return some value
        viewMethods: connection.viewMethods,
        // Change methods can modify the state, but you don't receive the returned value when called
        changeMethods: connection.changeMethods,
        // Sender is the account ID to initialize transactions.
        // getAccountId() will return empty string if user is still unauthorized
        sender: connection.walletConnection.getAccountId()
    });

    connection.login_account = await connection.near.account(connection.walletConnection.getAccountId());
    connection.contract_name = contractName;
    connection.contract_account = await connection.near.account(contractName);
}


function processJSONErrObject(errObject) {

//    console.log("Processing Object")
    var retval = "Error during processing";

    if ('kind' in errObject && 'ExecutionError' in errObject.kind) {
       if (errObject.kind.ExecutionError.includes('Only contract or admin can reset')) {
            console.error("Reset Authorization Error");
            document.querySelector('#reset_error').innerText = "Sorry. Only the admin is allowed to reset the log";
            document.querySelector('#reset_error').style.setProperty('display', 'block');  
            retval = false;
        }
        else {
            retval += " : " + errObject;
        }
    }
    return retval;
}


function processStringErrMessage(message) {

  //  console.log("Processing Message")
    let disp_err = "Error during processing";

    if (message.includes('Cannot deserialize the contract state')) {
        disp_err = 'Cannot deserialize the contract state';
        console.warn('NEAR Warning: the contract/account seems to have state that is not (or no longer) compatible.\n' +
            'This may require deleting and recreating the NEAR account as shown here:\n' +
            'https://stackoverflow.com/a/60767144/711863');
    }
    if (message.includes('Cannot deserialize the contract state')) {
        disp_err = 'Cannot deserialize the contract state';
        console.warn('NEAR Warning: the contract/account seems to have state that is not (or no longer) compatible.\n' +
            'This may require deleting and recreating the NEAR account as shown here:\n' +
            'https://stackoverflow.com/a/60767144/711863');
    }
    if (message.includes('The contract is not initialized')) {
        disp_err = 'Contract is not initialized';
        console.warn('NEAR Warning: the contract/accountis not yet initialized.');
    }

    return disp_err
}

function errorHelper(err) {
    /* if there's a cryptic error, provide more helpful feedback and instructions here
     * as soon as we get the error codes propagating back, use those
    */
    console.log("ERROR INFO",err.message,"TYPE:",typeof(err.message));

    var disp_err;
    var isObject = false;
    var err_detail;

    try {
        err_detail = JSON.parse(err.message);
 
        if (err_detail && typeof(err_detail) === "object") {
            isObject = true;
        }
        console.log("ERR DETAIL:",err_detail,isObject)
    }
    catch (e) {};

    if (isObject) {
         disp_err = processJSONErrObject(err_detail);
    }
    else {
        disp_err = processStringErrMessage(err.message);
    }

   if (disp_err) {
       document.querySelector('#error_status').innerText = "ERROR: " + disp_err;
       document.querySelector('#error_status').style.setProperty('display', 'block');
   }
}

// Variables used tp size the columns of data and headers in display all entries
let col1_size = 4;
let col2_size = 55;
let col3_size = 35;
let col4_size = 5;
let col5_size = 25;

function formatLogHdr() {
    let spacer = "  "
    let result = "#".padEnd(col1_size)
        + spacer + "Timestamps".padEnd(col2_size, " ")
        + spacer + "Account".padEnd(col3_size, " ")
        + spacer + "CC".padEnd(col4_size)
        + spacer + "Gas used".padEnd(col5_size)
        + spacer + "Message\n"

    return (result);
}

function formatLogEntry(entry) {
    let spacer = "  "
    let block_time = new Date(entry.block_ts / 1e6);
    let block_iso = block_time.toISOString();
    let is_cross_contract = "No".padEnd(col4_size)

    let sign_account_info = "";
    if (entry.signaccount != entry.account) {
        sign_account_info = "(signed by: " + entry.signaccount + ")";
        is_cross_contract = "Yes".padEnd(col4_size);
    }


    var rowtype = "entry_row_odd";
    if (entry.entry_id % 2 == 0) {
        rowtype = "entry_row_even"
    }

    let formatStart = '<div class="'+ rowtype +'"><pre>'
    let line1 = entry.entry_id.toString().padEnd(col1_size)
      + spacer + ("User: ".padEnd(7) + entry.timestamp).padEnd(col2_size, " ")
      + spacer + entry.account.padEnd(col3_size, " ")
      + spacer + is_cross_contract
      + spacer + ("Main: ".padEnd(7) + entry.used_gas).padEnd(col5_size)
      + spacer + entry.message
      + '\n';


    let line2 = " ".padEnd(col1_size)
        + spacer + ("Block: ".padStart(7) + block_iso
        + spacer + " (" + entry.block_ts.toString()+ ")").padEnd(col2_size, " ")
        + spacer +  sign_account_info.padEnd(col3_size," ")
        + spacer + "".padEnd(col4_size)
        + spacer + ("CC: ".padEnd(7) + entry.cc_used_gas).padEnd(col5_size);
    let formatEnd = '</pre></div>';
    /*
    let result = entry.entry_id.toString().padEnd(4)
               + spacer + entry.timestamp.padEnd(25," ")
               + spacer + (block_iso + " (" + entry.block_ts.toString() + ")").padEnd(50," ")
               + spacer + entry.account.padEnd(35," ")
               + "   " + entry.message+ '\n';
    */

    return (formatStart + line1 + line2 + formatEnd);
}


// query the contract to get current info about admin, number of entries and last entry
async function update_current_info(account) {

    let cur_count = 0;
    let update_info = "The log is empty";

    try {
        let main_info = JSON.parse(await main_contract.info({"args" : {}}));
        document.querySelector('#main_contract_admin').innerText = main_info.admin;

        cur_count = await main_contract.num_entries();
        document.querySelector('#showcount').innerText = cur_count;

        if (cur_count > 0) {
            let lastEntry = JSON.parse(await main_contract.get_last());
            update_info = JSON.stringify(lastEntry, null, 2);
        }
        document.querySelector('#cur_info').innerText = update_info;

        let sub_info = JSON.parse(await proxy_contract.info({"args" : {}}));
        document.querySelector('#sub_acct_admin').innerText = sub_info.admin;
        document.querySelector('#sub_acct_log_contract').innerText = sub_info.log_contract;

   } catch (e) {
       errorHelper(e);
   }


}




/*  NOT CURRENTLY USED -- was intend to keep track of balance so it would be 
 * easy to see/visualize the changes are gas and transfere were made, 
 * but since page is reloaded with the transition to the wallet and back
 * these vars get reset on page load, so not useful for the history
 * this data would need to be stored elsewhere to be useful
 */

var prevBalances = {
        main_login_balance:{ "available" : "Not Available" },
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
    /*  NOT CURRENTLY USED
     * This was to keep the copy, but since the page reloads wheen interface with the wallet
     * the variables get reset -- need to move this data to cookies?
     */
    prevBalances = JSON.parse(JSON.stringify(curBalances));
    console.log("updateBal:", prevBalances, curBalances);
};


function updateLogins() {

};


async function updateCurBalances() {

    curBalances.main_acct_balance = await nearConnections.mainacct.contract_account.getAccountBalance();

    curBalances.sub_acct_balance = await nearConnections.subacct.contract_account.getAccountBalance();


    if (nearConnections.mainacct.walletConnection.isSignedIn()) {
        curBalances.main_login_balance = await nearConnections.mainacct.login_account.getAccountBalance();
    }

    if (nearConnections.subacct.walletConnection.isSignedIn()) {
        curBalances.sub_login_balance = await  nearConnections.subacct.login_account.getAccountBalance();
    }

    document.querySelector('#main_acct_balance').innerText = curBalances.main_acct_balance.available;
    document.querySelector('#sub_acct_balance').innerText =  curBalances.sub_acct_balance.available;

};


async function updateUI() {


    document.querySelector('#error_status').style.setProperty('display', 'none');   
    document.querySelector('#reset_error').style.setProperty('display', 'none');  

    document.querySelector('#main_contract_id').innerText =
    nearConnections.mainacct.contract_name;
    document.querySelector('#sub_contract_id').innerText =
    nearConnections.subacct.contract_name;


    let cur_account = nearConnections.mainacct.walletConnection.getAccountId();
    document.querySelector('#main_login_id').innerText = cur_account;

    let cur_subaccount = nearConnections.subacct.walletConnection.getAccountId();

    await  updateCurBalances();

    await update_current_info();

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

}


// Log in user using NEAR Wallet on "Sign In" button click
document.querySelector('#sign-in-main-button').addEventListener('click', () => {
    nearConnections.mainacct.walletConnection.requestSignIn(
        { "contractId": nearConnections.mainacct.contract_name,
          "successUrl": window.location.origin + '/mainacct' }
    );
});

document.querySelector('#sign-out-main-button').addEventListener('click', () => {
    nearConnections.mainacct.walletConnection.signOut();
     window.location.replace(window.location.origin + window.location.pathname);
});


// Log in user using NEAR Wallet on "Sign In" button click
document.querySelector('#sign-in-subacct-button').addEventListener('click', () => {
    nearConnections.subacct.walletConnection.requestSignIn(
            { "contractId": nearConnections.subacct.contract_name,
              "successUrl": window.location.origin + '/subacct' }
    );
});

document.querySelector('#sign-out-subacct-button').addEventListener('click', () => {
    nearConnections.subacct.walletConnection.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
});





document.querySelector('#refresh').addEventListener('click', () => {
    main_contract.num_entries().then(count => {
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
    main_contract.list_entries().then(listdata => {
        //console.log("retrieved", listdata);
        const obj = JSON.parse(listdata);
        //console.log("retrieved", obj);
        let finaldata = "";
        // obj.log_entries.forEach(element => document.querySelector('#showlistdata').appendChild(formatLogEntry(element));
        obj.log_entries.forEach(element => finaldata += formatLogEntry(element));
        //console.log(finaldata)
        //console.log(finaldata.length)
        //console.log(document.querySelector('#showlistdata').innerText);
        // document.querySelector('#showcount').classList.replace('loader','number');
         document.querySelector('#showlistdata').innerHTML = finaldata;
    }).catch(err => errorHelper(err));
});

document.querySelector('#hide_entries').addEventListener('click', () => {
    document.querySelector('#entry_list_hdr').innerText = "";
    document.querySelector('#showlistdata').innerText = "";
});

document.querySelector('#main_reset').addEventListener('click', () => {
    main_contract.reset_log({})
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
    add_new_entry(this, main_contract);

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
        message: form_info.elements['msg'].value,
        cc_used_gas: "0",
    }
  //  $('inprocess_modal').modal('show');
    $("main-add_status").style = "display:block;";
    document.querySelector('#main-add-status').style = "display: block;";
    document.querySelector('#main-add-entry-form').style = "display: none;";
        main_contract.add_entry(args,BOATLOAD_OF_GAS,0).then(result => {
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

    $("add_status").style = "display:block;";
    document.querySelector('#subacct-add-status').style = "display: block;";
    document.querySelector('#subacct-add-entry-form').style = "display: none;";

    proxy_contract.indirect_add_entry(args, BOATLOAD_OF_GAS, nearamt)
        .then(result => {
            form_info.reset();
            document.querySelector('#subacct-add-status').style = "display: none;";
            document.querySelector('#subacct-add-entry-form').style = "display: block;";
    }).then(updateUI).catch(err => errorHelper(err));


    updatePrevBalances();
}


async function setupConnections() {

  // Save a copy of the incoming URL  --
  // if this is redirected from the wallet it will include the account and key information
  let incomingURL = new URL(window.location.href);
  console.log(incomingURL);
  localStorage_log(JSON.stringify(incomingURL));

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
      await connect(nearSubAcctConfig,'subacct',SUBCONTRACT_NAME);
      // restore the original URL with the account name and keys, then setup
      // the connection for the main account
      window.history.replaceState({}, document.title, incomingURL.toString());
      await connect(nearMainConfig,'mainacct',CONTRACT_NAME);
  } else {
    // not processing a call back for the main account, so this is either
    // a callback for the subacct OR its not callback at all.
    // Either way the code will process the mainacct first, with no parameters from the wallet
    // and then process the subacct with the original URL (which may or may not  have
    // and account/keys  -- depending on how we got her)
    window.history.replaceState({}, document.title,  noParameterURL.toString());
    await connect(nearMainConfig, 'mainacct',CONTRACT_NAME);

    window.history.replaceState({}, document.title, incomingURL.toString());
    await connect(nearSubAcctConfig,'subacct',SUBCONTRACT_NAME);
  }
  // restore the URL to main page URL removing the path addded by the wallet callback
  window.history.replaceState({}, document.title,  noParameterURL.toString());

  // update global shortcuts for contracts
  main_contract = nearConnections.mainacct.contract;
  proxy_contract = nearConnections.subacct.contract;

}


window.nearInitPromise = setupConnections()
    .then(updateUI)
    .catch(console.error);
console.log("Reloaded...", new Date());
