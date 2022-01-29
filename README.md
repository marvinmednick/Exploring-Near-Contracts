# Exploring NEAR Protocol Smart Contracts

`## Overview

I created this project to learn the basics of creating, testing and deploying  a smart contracts using NEAR project blockchain. 

This started out as just trying to figure out how to create a simple contract and grew as I understood more and wanted understand how various things work. 

My exploration covered the following areas

* Two Rust smart contract that were created using the near-sdk-rs
	* defining basic contract structure and methods
	* accessing and using data from the NEAR env
	* implements various testing options:
		* rust unit tests 
		* rust simulation tests 
		* jest javascript based tests 
	* A contract that NEAR specific data structures that are optimized for accessing data on the blockchain (i.e  Near "Vector" instead the Rust std "Vec") 
	* Using the NEAR U64/U128 JSON types (that workaround JSON 53 bit limitations)
* the basics of using the JS API (Reference) to interact with smart contracts 
* Integrating  with the NEAR wallet:
	- to 'log in' to acquire the signing key for requests 
	- to approving transfers associated with requests that transfer tokens
	- supports multiple wallet logins/signing keys on a single web page
* cross contract calls between two contracts
	- how to develop tests for contracts with cross contract calls
* how to transfer funds between accounts
* scripts/instructions for deploying, initializing


## Functional Overview
From a functional standpoint, this app is a web page that displays information and allows interation with two smart contracts.

A that provide a *very* basic and limited a set of logging functionality: They essentially allow some user to log some data (a 'log entry') that is stored by the contract.  Entries can later be read back in order.

Each 'log entry' contains some user specified data (a couple of strings) along with some additional metadata (e.g. timestamp).  


### Key Components 
There are three key components project:
* The **main** contract
* The **proxy** contract
* The Web User Interface


#### Main contract
The main contract is the one that does that actual data storage and retrieval of the log entries it support the following methods

| Method       | Description                                                 |
| ------------ | ----------------------------------------------------------- |
| new          | Initializes the log                                         |
| add_entry    | Adds an entry to the log                                    |
| num_entry    | Returns the number of entries that have been added to the log|
| iist_entries | provides the full list of all the entries in the log        |
| get_last     | returns only the last entry added to the log                |
| info         | Returns information about the configuration of the contract |
| reset_log    | Clears the log                                              |

#### Proxy Contract

THe proxy contract primary functions is the make cross contact calls the Main contract.

| Method | Description|
|--------|------------|
|new| Initialize the contract which requires AccountId of the account the main logging contract is deployed|
|indirect_add_entry| Calls add_entry on the main contact. |
|indirect_num_entries| Call num_entries on the main contract|
|info|returns the configuration information for the contract (the AccountId of the main contract)


#### Web User Interface





The Contract is written in Rust and uses the near-sdk-rs.  THe UI is nodejs/javascript based.

# What this contract Does

Basic logging mechanism


## Getting started

### Requirements
- Clone the project
- Install Rust/Wasm toolchain  - https://www.near-sdk.io/#install-rust-and-wasm-toolchain
- Install NodeJS   - See https://nodejs.org/en/download/
- If you do not already have one, please create  testnet account using the Near Wallet   https://docs.near.org/docs/develop/basics/create-account



## Buid and Deploy

### Install packages and dependencies.   

    `yarn` 

### Build the contract

    `yarn build`

## Initial Deployment
Contracts are deployed to an account, and each account can only have one contract deployed to it.  
The contract shoudl be deployed to a subaccount or during development to a dev account.
Both methods are described below

### Deploying to specfic named account

#### Creating a sub-account for deploying the contract to
Although you can technically uses your main testnet acocunt (e.g. <main acct name>.testnet) it is best practice to create a subaccount to deploy the contract to. 
This can be down with the near-cli command line tool (see https://github.com/near/near-cli).   


Once you have the near-cli tool installed the following:

    `near create-account <subaccountname>.<main acct name>.testnet --masterAccount <main acct name>.testnet`

For example if your primary account was ***"myaccount"*** and the sub account name for ***"thisproject"***, the full name subaccount would be ***"thisproject.myaccount.testnet"***

Once the account is created, set environment variable CONTRACT_NAME to reference it.  As example for the bash shell on linux it would be:
    
    `CONTRACT_NAME=<subaccountname>.<main acct name>.testnet; export CONTRACT_NAME`    
    
    which would be as following if our account was thisproject.myaccount.testnet
    
    `CONTRACT_NAME=thisproject.myaccount.testnet; export CONTRACT_NAME`

#### Deploying and Initializing the Contract.

The contract can be deployed and initialized via the following command:

    `yarn deploy:init`

This initializes the contract with an empty log and marks it with account name that is deployed to so that some function (e.g. 'reset') can only be called using the contract account.  The deploy:init command deploys and intializes the contract in single transaction.

**NOTE:**  The init function can only be called once, after that it will error. The contract can be updated via ***near deploy***, but cannot be re-initialized other than deleting the account and recreating it.


### Deploying to a Development Account
Alternatively during development, near-cli supports creating and deploying to an 'dev' account on the fly.  The name of the dev account will be stored in the 

    `yarn deploy:dev`

This will create a dev account with a name something like "dev-#############-##############" (which each # is a numeric digt).  It will also create a "neardev" sub-directory with a couple of files in it with the actual account number.    

For linux:
    
    `source dev-account.env; export CONTRACT_NAME  # sets environmental variable CONTRACT_NAME to the name of the account`   


(For more information see https://docs.near.org/docs/concepts/account#dev-accounts for move information about Dev accounts)
Each Near account is allowed to have one smart contract, so 

## Initialization


yarn
yarn start

To get started with this template:



    `cargo test -- --nocapture`

8. Build the contract

    `RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release`

**Get more info at:**

* [Rust Smart Contract Quick Start](https://docs.near.org/docs/develop/contracts/rust/intro)
* [Rust SDK Book](https://www.near-sdk.io/)


# Background on the Code

## package.json  
Contains the commands to used by yarn/npm 
Also includes the dependendies. 

