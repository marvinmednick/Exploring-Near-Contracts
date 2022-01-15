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
            contractName: 'test-account-' + id + now + '-' + randomNumber,
            accountId: 'test-account-' + id + now + '-' + randomNumber
        });
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(PROJECT_KEY_DIR);
        config.deps = Object.assign(config.deps || {}, {
            storage:  this.createFakeStorage(),
            keyStore,
        });
        const near = await nearAPI.connect(config);

        const masterAccount = await near.account(testAccountName);
        const randomKey = await nearAPI.KeyPair.fromRandom('ed25519');
        const data = [...fs.readFileSync(wasmFile)];
        await config.deps.keyStore.setKey(config.networkId, config.contractName, randomKey);
        await masterAccount.createAndDeployContract(config.contractName, randomKey.getPublicKey(), data, INITIAL_BALANCE);

        return(config.contractName);
    }

    async setup() {
        this.global.nearlib = require('near-api-js');
        this.global.nearAPI = require('near-api-js');
        this.global.window = {};
        let config = require('near-cli/get-config')();
        let config1 = require('near-cli/get-config')();
        this.global.testSettings = this.global.nearConfig = config;
        this.global.nearConfig1 = config1;
        let main_contract_name = await this.setupContract(config,'./contracts/out/marvfirst_main.wasm','main');
        let sub_contract_name = await this.setupContract(config1,'./contracts/out/marvfirst_sub.wasm','sub');


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
