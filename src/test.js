describe('Token', function () {
  let near;
  let contract;
  let subcontract;
  let accountId;
  let main_init = false;
  let sub_init = false;

  beforeAll(async function () {
    debugger;
    console.log("Starting beforeAll");
    console.log("NEAR Configs",nearConfig,nearConfig1,nearConfig2);
    console.log("Test accounts", testAccounts);
    near = await nearlib.connect(nearConfig);
    //near1 = await nearlib.connect(nearConfig1);
    //near2 = await nearlib.connect(nearConfig2);
    console.log("NEAR Vars",near); // ,near1,near2);
    accountId = nearConfig.a_contractName;
    subAccountId = nearConfig1.a_contractName;
    admin_user = "admin";

    var mainContractConfig = {
      viewMethods: ['num_entries'],
      changeMethods: ['new','add_entry', 'reset_log', 'get_last'],
      sender: accountId
    };

    var subContractConfig = {
      viewMethods: [],
      changeMethods: ['new', 'indirect_num_entries','indirect_add_entry', 'info'],
      sender: accountId
    }

    contract = await near.loadContract(testAccounts.main_contract, mainContractConfig);
    subcontract = await near.loadContract(testAccounts.sub_contract, subContractConfig);
  });


  describe('init', function () {

	var counter;
	var startCounter;

    console.log("Starting subcontract jest test")
    it('main contract can be initialized', async function() {
      await contract.new({"args" : {}});
      const counter = await contract.num_entries({"args": {}});
      expect(counter).toEqual(0);
    });
    it('subcontract can be initialized', async function() {
      await subcontract.new({"args" : {"log_contract" : accountId, 'admin' : admin_user}});
      const info = await subcontract.info({"args" : {}});
      expect.stringMatching(".*log_contract.*")
    },10000);
    it('subcontract can be read count', async function() {
      const counter = await subcontract.indirect_num_entries({"args" : {}});
      expect(counter).toEqual(0)
    },10000);

    it('count can be accessed', async function() {
      startCounter = await contract.num_entries({"args": {}});
      expect(startCounter).toEqual(0);
    });
    it('main contract can add entries', async function () {
      await contract.add_entry({"args" : { "timestamp" : "Time1","name" : "My Name","message": "My Message", "cc_used_gas": "0"}});
      counter = await contract.num_entries({"args": {}});
      expect(counter).toEqual(startCounter + 1);
    });
    it('sub account config is can be read', async function() {
      const cfg_contract = await subcontract.info({"args" : {}});
      expect(cfg_contract).toEqual(accountId);
    });
    it('sub contract can add entries', async function () {
      const startCounter = await contract.num_entries({"args": {}});
      console.log("A");
      await subcontract.indirect_add_entry({"args" : { "timestamp" : "Time2","name" : "Joe","message": "Cool" }});
      console.log("B");
      const endCounter = await subcontract.indirect_num_entries({"args": {}});
      console.log("C");
      expect(endCounter).toEqual(startCounter + 1);
    },15000);
    it('get last data is valid', async function () {
      await subcontract.indirect_add_entry({"args" : { "timestamp" : "Time3","name" : "Luke","message": "Your father" }});
      var last_data = await contract.get_last({"args": {}});
      var last_entry = JSON.parse(last_data);
	  expect(last_entry.name).toEqual("Luke");
	  expect(last_entry.message).toEqual("Your father");

      await contract.add_entry({"args" : { "timestamp" : "Time1","name" : "R2D2","message": "Beep, boop","cc_used_gas": "0"}});
      last_data = await contract.get_last({"args": {}});
      last_entry = JSON.parse(last_data);
	  expect(last_entry.name).toEqual("R2D2");
	  expect(last_entry.message).toEqual("Beep, boop");
    },12000);
    it('can be reset', async function () {
      await contract.reset_log({"args": {}});
      const endCounter = await contract.num_entries({"args": {}});
      expect(endCounter).toEqual(0);
    });
  });
});
