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


        console.log("Start Setup Contract with id:",id,config.a_contractName, config);       
        const now = Date.now();

        // create random number with at least 7 digits
        const randomNumber = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
        if (id != "") {
            id = id + "-";
        }
        config = Object.assign(config, {
            a_contractName: 'test-account-' + id + now + '-' + randomNumber,
            accountId: 'test-account-' + id + now + '-' + randomNumber
        });
        
        delete config.contractName;
        console.log("MOD_CONFIG",config);

        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(PROJECT_KEY_DIR);
        config.deps = Object.assign(config.deps || {}, {
            storage:  this.createFakeStorage(),
            keyStore,
        });
        const near = await nearAPI.connect(config);

        const masterAccount = await near.account(testAccountName);
        const randomKey = await nearAPI.KeyPair.fromRandom('ed25519');
        const data = [...fs.readFileSync(wasmFile)];
        await config.deps.keyStore.setKey(config.networkId, config.a_contractName, randomKey);
        await masterAccount.createAndDeployContract(config.a_contractName, randomKey.getPublicKey(), data, INITIAL_BALANCE);

        console.log("End Setup Contract with id:",id,config.a_contractName, config);
        return(config.a_contractName);
    }

    async setupAccount(config,id, wasmFile='./test.asm') {

        console.log("Settting up account", id, config);
        const now = Date.now();

        // create random number with at least 7 digits
        const randomNumber = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
        if (id != "") {
            id = id + "-";
        }
       
        config = Object.assign(config, {
            a_contractName: 'test-account-' + id + now + '-' + randomNumber,
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
        await config.deps.keyStore.setKey(config.networkId, config.a_contractName, randomKey);
        await masterAccount.createAccount(config.a_contractName, randomKey.getPublicKey(), INITIAL_BALANCE);

        console.log("Setup Contract with id:",id,config.a_contractName, config);
        return(config.a_contractName);

    }


    async setup() {
        console.log("Starting Setup")
        this.global.nearlib = require('near-api-js');
        this.global.nearAPI = require('near-api-js');
        this.global.window = {};
        let config = require('near-cli/get-config')();
        let config1 = require('near-cli/get-config')();
        let config2 = require('near-cli/get-config')();
        this.global.testSettings = this.global.nearConfig = config;
        this.global.nearConfig1 = config;
        this.global.nearConfig2 = config;

        let main_contract_name = await this.setupContract(config,'./contracts/out/marvfirst_main.wasm','main');
        let sub_contract_name = await this.setupContract(config1,'./contracts/out/marvfirst_sub.wasm','sub');
        this.global.acct1 = "acct1";
        let other_account_name = await this.setupAccount(config2,this.global.acct1,'./contracts/out/marvfirst_sub.wasm');

        console.log("CONFIGS");
        console.log("1",config,"2", config1, "3", config2);

        this.global.testAccounts = {
                main_contract :  config.accountId,
                sub_contract  :  config1.accountId,
                acct1         :  config2.accountId,
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
