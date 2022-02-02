# Exploring NEAR Protocol Smart Contracts

## Overview

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

A that provide a *very* basic and limited a set of logging functionality;  they allow a user to log some data (a 'log entry') that is stored by the contract.  Entries can later be read back in the order added. 

Each 'log entry' contains some user specified data (a couple of strings) along with some additional metadata (e.g. timestamp, accountId that added the entry ).  


### Key Components 
There are three key components project:
* The **main** contract
* The **proxy** contract
* The Web User Interface



Both contracts are written in Rust using the Near Rust SDK (https://github.com/near/near-sdk-rs )

The web User Interfaces written in javascript and use the NEAR Javascript library  (https://github.com/near/near-api-js)


#### The Main contract
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

#### The Proxy Contract

THe proxy contract primary functions is the make cross contact calls the Main contract.

| Method | Description|
|--------|------------|
|new| Initialize the contract which requires AccountId of the account the main logging contract is deployed|
|indirect_add_entry| Calls add_entry on the main contact. |
|indirect_num_entries| Call num_entries on the main contract|
|info|returns the configuration information for the contract (the AccountId of the main contract)|


#### The Web User Interface

HMTL and javascript pages

# Getting Started

## Clone

## Select/Setup Admin Account

Both contracts require initialization with a NEAR account which is considered to be the admin and is allowed to use methods that affect the configuration such as being able to clear the log or for the Proxy contract configure the A 	ccountId of the main contract which it will make the cross contract calls to)

## Install packages and dependencies.   

    `yarn` 

## Build the contracts

    `yarn build`

##  Deploy

Contracts are deployed to an account, and each account can only have one contract deployed to it.  
The contract should be deployed to a subaccount or during development to a dev account.
Both methods are described below

### Deploying to Development Accounts

The script 'newdeploydev.sh' is included to deploy and initialize each contracts to two separate development accounts.    The script requires one argument the name of an account which will be the 'admin' for the contracts and will output a file named 'devconfig' which contains bash shell commands to set the necessary environmental variables for of each of the accounts that were created.  

```newdeploydev.sh <admin_acct_id>```

If the admin account set in ADMIN_NAME environmental variable (export ADMIN_NAME=<admin_acct_id>) then the command

```yarn deploy:dev:new``` 

can be used to call the same script.


### Deploying to Specific Named Accounts
The script "deploy.sh" can be used to deploy contracts to specific accounts.  the script requires three parameters the account to deploy the main contract, the account to deploy the proxy contract, and the name of the account to initialize the contracts as the 'admin' account

``deploy.sh <main_acct_id> <proxy_acct_id> <admin_acct_id>```

Alternatively the 3 ID can be provided as environmental variables:
```
export CONTRACT_NAME=<main_acct_id>
export SUBCONTRACT_NAME=<proxy_acct_id>
export ADMIN_NAME=<admin_acct_id>
```

# References

* [Rust Smart Contract Quick Start](https://docs.near.org/docs/develop/contracts/rust/intro)
* [Rust SDK Book](https://www.near-sdk.io/)

