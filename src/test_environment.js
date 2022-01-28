const NodeEnvironment = require('jest-environment-node');
const nearAPI = require('near-api-js');
const fs = require('fs');

const { PROJECT_KEY_DIR } = require('near-cli/middleware/key-store');

const INITIAL_BALANCE = '500000000000000000000000000';
const testAccountName = 'test.near';

class LocalTestEnvironment extends NodeEnvironment {
    constructor(config) {
        super(config);
    }

    async setupContract(config,wasmFile='./out/main.asm', id="") {


         const now = Date.now();

        // create random number with at least 7 digits
        const randomNumber = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
        if (id != "") {
            id = id + "-";
        }
        config = Object.assign(config, {
            // a_contractName: 'test-account-' + id + now + '-' + randomNumber,
            accountId: 'test-account-' + id + now + '-' + randomNumber
        });
        
        delete config.contractName;
        

        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(PROJECT_KEY_DIR);
        config.deps = Object.assign(config.deps || {}, {
            storage:  this.createFakeStorage(),
            keyStore,
        });
        const near = await nearAPI.connect(config);

        const masterAccount = await near.account(testAccountName);
        const randomKey = await nearAPI.KeyPair.fromRandom('ed25519');
        const data = [...fs.readFileSync(wasmFile)];
        await config.deps.keyStore.setKey(config.networkId, config.accountId, randomKey);
        await masterAccount.createAndDeployContract(config.accountId, randomKey.getPublicKey(), data, INITIAL_BALANCE);

        return(config.accountId);
    }

    async setupAccount(config,id) {

        const now = Date.now();

        // create random number with at least 7 digits
        const randomNumber = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
        if (id != "") {
            id = id + "-";
        }
       
        config = Object.assign(config, {
            // accountId: 'test-account-' + id + now + '-' + randomNumber,
            accountId: 'test-account-' + id + now + '-' + randomNumber
        });
        delete config.contractName;

        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(PROJECT_KEY_DIR);
        config.deps = Object.assign(config.deps || {}, {
            storage:  this.createFakeStorage(),
            keyStore,
        });
        const near = await nearAPI.connect(config);

        const masterAccount = await near.account(testAccountName);
        const randomKey = await nearAPI.KeyPair.fromRandom('ed25519');
        // const data = [...fs.readFileSync(wasmFile)];
        await config.deps.keyStore.setKey(config.networkId, config.accountId, randomKey);
        await masterAccount.createAccount(config.accountId, randomKey.getPublicKey(), INITIAL_BALANCE);

        
        return(config.accountId);

    }


    async setup() {
        
        this.global.nearlib = require('near-api-js');
        this.global.nearAPI = require('near-api-js');
        this.global.window = {};
        let config = require('near-cli/get-config')();

        // check to see if contractName is defined in the config (which is its by default)
        // and go ahead and delete it to avoid any confusion as its not going to be used in this enviorment
        if (config.contractName) {
            delete config.contractName;
        }
        this.global.testSettings = this.global.nearConfig = config;

        let main_contract_id = await this.setupContract(config,'./contracts/out/marvfirst_main.wasm','main');
        let sub_contract_id = await this.setupContract(config,'./contracts/out/marvfirst_sub.wasm','sub');
        let user1_account_id = await this.setupAccount(config,"user1");


        this.global.testAccounts = {
                main_contract :  main_contract_id,
                sub_contract  :  sub_contract_id,
                user_acct1    :  user1_account_id,
        }

        await super.setup();
    }

    async teardown() {
        await super.teardown();
    }

    runScript(script) {
        return super.runScript(script);
    }

    createFakeStorage() {
        let store = {};
        return {
            getItem: function(key) {
                return store[key];
            },
            setItem: function(key, value) {
                store[key] = value.toString();
            },
            clear: function() {
                store = {};
            },
            removeItem: function(key) {
                delete store[key];
            }
        };
    }
}

module.exports = LocalTestEnvironment;
