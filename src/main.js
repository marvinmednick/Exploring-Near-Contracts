import "regenerator-runtime/runtime";
import * as nearAPI from "near-api-js";
import getConfig from "./config";
const nearConfig = getConfig(process.env.NODE_ENV || "development");


  // Copied from rust-counter
async function connect(nearConfig) {
  // Connects to NEAR and provides `near`, `walletAccount` and `contract` objects in `window` scope
  // Initializing connection to the NEAR node.
  window.near = await nearAPI.connect({
    deps: {
      keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore()
    },
    ...nearConfig
  });

  // Needed to access wallet login
  window.walletConnection = new nearAPI.WalletConnection(window.near);

  // Initializing our contract APIs by contract name and configuration.
  window.contract = await new nearAPI.Contract(window.walletConnection.account(), nearConfig.contractName, {
    // View methods are read-only – they don't modify the state, but usually return some value
    viewMethods: ['num_entries', 'list_entries'],
    // Change methods can modify the state, but you don't receive the returned value when called
    changeMethods: ['new', 'add_entry', 'reset_log'],
    // Sender is the account ID to initialize transactions.
    // getAccountId() will return empty string if user is still unauthorized
    sender: window.walletConnection.getAccountId()
  });
}

function errorHelper(err) {
  // if there's a cryptic error, provide more helpful feedback and instructions here
  // TODO: as soon as we get the error codes propagating back, use those
  if (err.message.includes('Cannot deserialize the contract state')) {
    console.warn('NEAR Warning: the contract/account seems to have state that is not (or no longer) compatible.\n' +
        'This may require deleting and recreating the NEAR account as shown here:\n' +
        'https://stackoverflow.com/a/60767144/711863');
  }
  if (err.message.includes('Cannot deserialize the contract state')) {
    console.warn('NEAR Warning: the contract/account seems to have state that is not (or no longer) compatible.\n' +
        'This may require deleting and recreating the NEAR account as shown here:\n' +
        'https://stackoverflow.com/a/60767144/711863');
  }
  console.error(err);
}

function updateUI() {
  let cur_account = window.walletConnection.getAccountId();
  if (!cur_account) {
    document.querySelector('#cur_login_id').innerText = "";
    document.querySelector('#cur_login_text').innerText = "You are not currently logged in.";
    Array.from(document.querySelectorAll('.sign-in')).map(it => it.style = 'display: block;');
  } else {
    document.querySelector('#cur_login_text').innerText = "You current are logged in as "
    document.querySelector('#cur_login_id').innerText = cur_account;
    Array.from(document.querySelectorAll('.after-sign-in')).map(it => it.style = 'display: block;');
  }
}

// Log in user using NEAR Wallet on "Sign In" button click
document.querySelector('.sign-in .btn').addEventListener('click', () => {
  walletConnection.requestSignIn(nearConfig.contractName, 'Marvin First Contract Demo');
});

document.querySelector('.sign-out .btn').addEventListener('click', () => {
  walletConnection.signOut();
  // TODO: Move redirect to .signOut() ^^^
  window.location.replace(window.location.origin + window.location.pathname);
});



document.querySelector('.get_entry_count .btn').addEventListener('click', () => {
  contract.num_entries().then(count => {
      console.log("Count is",count);
      console.log(document.querySelector('#showcount').innerText)
      // document.querySelector('#showcount').classList.replace('loader','number');
      document.querySelector('#showcount').innerText = count === undefined ? 'calculating...' : count;
  }).catch(err => errorHelper(err));
});


document.querySelector('.get_entry_list .btn').addEventListener('click', () => {
  contract.list_entries().then(listdata => {
      console.log("retrieved", listdata);
      console.log(document.querySelector('#showlistdata').innerText);
       // document.querySelector('#showcount').classList.replace('loader','number');
      document.querySelector('#showlistdata').innerText = listdata;
  }).catch(err => errorHelper(err));
});


document.querySelector('.log_reset .btn').addEventListener('click', () => {
  contract.reset_log({msg: "A Reset occurred"}).then(listdata => {
      console.log("retrieved", listdata);
  }).catch(err => errorHelper(err));

  console.log("CONTRACT IS:", typeof contract); 
});


document.querySelector('#add-entry').onsubmit = function() { 
   add_new_entry(this);
   event.preventDefault();
};

function add_new_entry(form_info) {
   const d = new Date();
   console.log(d.valueOf())
   console.log(Date().valueOf());
   console.log(form_info.elements['name'].value);
   console.log(form_info.elements['msg'].value);


   let args = {
       timestamp: d, 
       name: form_info.elements['name'].value, 
       message: form_info.elements['msg'].value
   }
   contract.add_entry(args).then(result => {
       console.log("Add Entry",result);
       form_info.reset();
   }).catch(err => errorHelper(err));
 
} 



window.nearInitPromise = connect(nearConfig)
    .then(updateUI)
    .catch(console.error);

console.log("Reloaded...")
