use near_sdk_sim::{init_simulator, to_yocto, STORAGE_AMOUNT, UserAccount, ContractAccount};
use near_sdk_sim::types::AccountId;
use marvfirst_main::LogContractContract;

near_sdk_sim::lazy_static_include::lazy_static_include_bytes! {
    CONTRACT_WASM_BYTES => "../target/wasm32-unknown-unknown/debug/marvfirst_main.wasm",
}


pub fn init() -> (UserAccount, UserAccount, UserAccount) {
    // Use `None` for default genesis configuration; more info below
    let root = init_simulator(None);

    let contract = ContractAccount<LogContractContract>.deploy(
        &CONTRACT_WASM_BYTES,
        "contract".to_string(),
        STORAGE_AMOUNT // attached deposit
    );

    let alice = root.create_user(
        "alice".parse().unwrap(),
        to_yocto("100") // initial balance
    );

    (root, contract, alice)
}
