import "regenerator-runtime/runtime";
import * as nearAPI from "near-api-js";
import getConfig from "./config";
const nearConfig = getConfig(process.env.NODE_ENV || "development");

window.nearConnections = {
    mainacct:  {near: null, walletConnection: null, contract: null },
    subacct:  {near: null, walletConnection: null, contract: null },
}

console.log(nearConnections);


  // Copied from rust-counter
async function connect(nearConfg, account) {

  let connection = window.nearConnections[account];

  // Connects to NEAR and provides `near`, `walletAccount` and `contract` objects in `window` scope
  // Initializing connection to the NEAR node.
  connection.near = await nearAPI.connect({
    deps: {
      keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore()
    },
    ...nearConfig
  });

    // Needed to access wallet login
  connection.walletConnection = new nearAPI.WalletConnection(connection.near);

  // MAIN CONTRACT: Initializing our contract APIs by contract name and configuration.
  connection.contract = await new nearAPI.Contract(connection.walletConnection.account(), nearConfig.contractName, {
    // View methods are read-only – they don't modify the state, but usually return some value
    viewMethods: ['num_entries', 'list_entries', 'get_last'],
    // Change methods can modify the state, but you don't receive the returned value when called
    changeMethods: ['new', 'add_entry', 'reset_log', 'get_info'],
    // Sender is the account ID to initialize transactions.
    // getAccountId() will return empty string if user is still unauthorized
    sender: connection.walletConnection.getAccountId()
  });
  console.log("X",connection.contract);
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
let col2_size = 53;
let col3_size = 35;

function formatLogHdr() {
  let spacer = "  "
  let result = "#".padEnd(col1_size)
            + spacer + "Timestamps".padEnd(col2_size," ")
            + spacer + "Account".padEnd(col3_size," ")
            + spacer + "Message\n"

  return(result);
}

function formatLogEntry (entry) {
  let spacer = "  "
  let block_time = new Date(entry.block_ts / 1e6);
  console.log(block_time,typeof(block_time));
  let block_iso = block_time.toISOString();


  let line1 = entry.entry_id.toString().padEnd(col1_size)
             + spacer + ("User: ".padEnd(7) + entry.timestamp).padEnd(col2_size," ")
             + spacer + entry.account.padEnd(col3_size," ")
             + "   " + entry.message+ '\n';

  let line2 = " ".padEnd(col1_size)
              + spacer + ("Block: ".padStart(7) + block_iso + " (" + entry.block_ts.toString() + ")").padEnd(col2_size," ") + '\n';
  /*
  let result = entry.entry_id.toString().padEnd(4)
             + spacer + entry.timestamp.padEnd(25," ")
             + spacer + (block_iso + " (" + entry.block_ts.toString() + ")").padEnd(50," ")
             + spacer + entry.account.padEnd(35," ")
             + "   " + entry.message+ '\n';
  */

  return(line1 + line2);
}

function update_current_info() {

  let cur_count = 0;
  let update_info = "The log is empty";

  mainContract.num_entries().then(count => {
      cur_count = count;
      document.querySelector('#showcount').innerText = cur_count;
      mainContract.get_last().then(last_info => {
            var lastEntry;
            if (cur_count > 0) {
                lastEntry = JSON.parse(last_info);
                update_info =  JSON.stringify(lastEntry,null,2);
            }
            document.querySelector('#cur_info').innerText = update_info;
      }).catch(err => errorHelper(err));
    }).catch(err => errorHelper(err));
}



function updateUI() {

  document.querySelector('#error_status').style.setProperty('display', 'none');

  document.querySelector('#main_contract_id').innerText = nearConfig.contractName;

  let cur_account = nearConnections.mainacct.walletConnection.getAccountId();
  document.querySelector('#cur_login_id').innerText = cur_account;

  update_current_info();

  console.log(cur_account);
  if (!cur_account) {
    document.querySelector('#cur_login_id').innerText = "";
    document.querySelector('#cur_login_text').innerText = "You are not currently logged in.";
    Array.from(document.querySelectorAll('.sign-in-main')).map(it => it.style = 'display: block;');
    Array.from(document.querySelectorAll('.after-sign-in-main')).map(it => it.style = 'display: none;');
  } else {
    document.querySelector('#cur_login_text').innerText = "You current are logged in as "
    document.querySelector('#cur_login_id').innerText = cur_account;
    Array.from(document.querySelectorAll('.sign-in-main')).map(it => it.style = 'display: none;');
    Array.from(document.querySelectorAll('.after-sign-in-main')).map(it => it.style = 'display: block;');

  }
}


function updateSubAccountUI() {
/*
   document.querySelector('#sub_contract_id').innerText = nearConfig.subcontractName;


  let cur_subaccount = window.walletConnection2.getAccountId();
  console.log(walletConnection2)
  document.querySelector('#cur_login_id').innerText = cur_subaccount;


  update_current_info();

  console.log(cur_subaccount);
  if (!cur_subaccount) {
    document.querySelector('#cur_login_id').innerText = "";
    document.querySelector('#cur_login_text').innerText = "You are not currently logged in.";
    Array.from(document.querySelectorAll('.sign-in-subacct')).map(it => it.style = 'display: block;');
    Array.from(document.querySelectorAll('.after-sign-in-subacct')).map(it => it.style = 'display: none;');
  } else {
    document.querySelector('#subacct_login_text').innerText = "You current are logged in as "
    document.querySelector('#subacct_login_id').innerText = cur_subaccount;
    Array.from(document.querySelectorAll('.sign-in-subacct')).map(it => it.style = 'display: none;');
    Array.from(document.querySelectorAll('.after-sign-in-subacct')).map(it => it.style = 'display: block;');

  }

  */
}


// Log in user using NEAR Wallet on "Sign In" button click
document.querySelector('.sign-in-main .btn').addEventListener('click', () => {
  nearConnections.mainacct.walletConnection.requestSignIn(nearConfig.contractName, 'Marvin First Contract Demo');
});

document.querySelector('.sign-out-main .btn').addEventListener('click', () => {
  nearConnections.mainacct.walletConnection.signOut();
  // TODO: Move redirect to .signOut() ^^^
  window.location.replace(window.location.origin + window.location.pathname);
});



document.querySelector('#refresh').addEventListener('click', () => {
  mainContract.num_entries().then(count => {
      console.log("Count is",count);
      console.log(document.querySelector('#showcount').innerText)
      // document.querySelector('#showcount').classList.replace('loader','number');
      document.querySelector('#showcount').innerText = count === undefined ? 'calculating...' : count;
  }).catch(err => errorHelper(err));
});



function append_entry(value, index, array) {

}

document.querySelector('#display_entries').addEventListener('click', () => {
  document.querySelector('#entry_list_hdr').innerText = formatLogHdr(); //"#".padEnd(4) + "   " + "Timestamp".padEnd(25," ") + "   " + "Account".padEnd(35," ")+ "   " + "Message\n";
  mainContract.list_entries().then(listdata => {
      console.log("retrieved", listdata);
      const obj = JSON.parse(listdata);
      console.log("retrieved", obj);
      let finaldata = "";
      obj.log_entries.forEach(element => finaldata += formatLogEntry(element));
      console.log(finaldata)
      console.log(finaldata.length)
      console.log(document.querySelector('#showlistdata').innerText);
       // document.querySelector('#showcount').classList.replace('loader','number');
      document.querySelector('#showlistdata').innerText = finaldata;
  }).catch(err => errorHelper(err));
});

document.querySelector('#hide_entries').addEventListener('click', () => {
    document.querySelector('#entry_list_hdr').innerText = "";
    document.querySelector('#showlistdata').innerText = "";
});

document.querySelector('.log_reset .btn').addEventListener('click', () => {
  mainContract.reset_log({}).then(listdata => {
      console.log("retrieved", listdata);
  }).catch(err => errorHelper(err));

  console.log("CONTRACT IS:", typeof mainContract);
});


document.querySelector('#add-entry').onsubmit = function() {
   // prevent further default processing from occuring (i.e. don't POST the result/refresh page)
   event.preventDefault();

   // process the form data
   add_new_entry(this);

};

function post_add_entry() {
    $("inprocess_modal").modal("hide")
}


function add_new_entry(form_info) {
   const d = new Date();
   console.log("Date type is",typeof(d),d)

   let args = {
       timestamp: d,
       name: form_info.elements['name'].value,
       message: form_info.elements['msg'].value
   }
   $('inprocess_modal').modal('show');
   $("add_status").style = "display:block;";
  document.querySelector('#add_status').style = "display: block;";
  document.querySelector('#add_entry_form').style = "display: none;";
   mainContract.add_entry(args).then(result => {
       console.log("Add Entry",result);
       form_info.reset();
       document.querySelector('#add_status').style = "display: none;";
       document.querySelector('#add_entry_form').style = "display: block;";
   }).then(updateUI).catch(err => errorHelper(err));

}


function logInfo () {
  console.log("logInfo")
  console.log(mainContract, nearConnections['main'], nearConnections);
   console.log("logInfo End");
   mainContract = nearConnections.mainacct.contract;
}

let mainContract = nearConnections.mainacct.contract;
window.nearInitPromise = connect(nearConfig,'mainacct')
    .then(logInfo)
    .then(updateUI)
    .then(updateSubAccountUI)
    .catch(console.error);

console.log("Reloaded...");
