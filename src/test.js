describe('Token', function () {
  let near;
  let contract;
  let subcontract;
  let accountId;
  let main_init = false;
  let sub_init = false;

  beforeAll(async function () {
    debugger;
    near = await nearlib.connect(nearConfig);
    admin_user = "admin";

    // base configuration with view and changes methods for the main contract

    var mainContractConfig = {
      viewMethods: ['num_entries', 'info'],
      changeMethods: ['new','add_entry', 'reset_log', 'get_last'],
      sender: testAccounts.main_contract
    };

    var subContractConfig = {
      viewMethods: [],
      changeMethods: ['new', 'indirect_num_entries','indirect_add_entry', 'info'],
      sender: testAccounts.sub_contract
    }

  
    contract = await near.loadContract(testAccounts.main_contract, mainContractConfig);
    subcontract = await near.loadContract(testAccounts.sub_contract, subContractConfig);
   
    var user1Config = Object.assign(mainContractConfig,{sender : testAccounts.user1_acct})
    test1sub =  await near.loadContract(testAccounts.sub_contract, user1Config);

  });


  describe('init', function () {

	var counter;
	var startCounter;

//    console.log("Starting subcontract jest test")
    it('main contract can be initialized', async function() {
      await contract.new({"args" : {"admin" : admin_user }});
      const info_json = await contract.info({"args" : {}});
      const info = JSON.parse(info_json);
      expect(info.admin).toEqual("admin");
      const counter = await contract.num_entries({"args": {}});
      expect(counter).toEqual(0);
    });

    it('subcontract can be initialized', async function() {
      await subcontract.new({"args" : {"log_contract" : testAccounts.main_contract, 'admin' : admin_user}});
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
      const cfg_contract = JSON.parse(await subcontract.info({"args" : {}} ));
      expect(cfg_contract.log_contract).toEqual(testAccounts.main_contract);
      expect(cfg_contract.admin).toEqual(admin_user);
    });
    it('sub contract can add entries', async function () {
      const startCounter = await contract.num_entries({"args": {}});
     
      await subcontract.indirect_add_entry({"args" : { "timestamp" : "Time2","name" : "Joe","message": "Cool" }});
     
      const endCounter = await subcontract.indirect_num_entries({"args": {}});
     
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
