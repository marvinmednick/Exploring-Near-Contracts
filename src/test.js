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
    near1 = await nearlib.connect(nearConfig1);
    accountId = nearConfig.contractName;
    subAccountId = nearConfig1.contractName;
    contract = await near.loadContract(nearConfig.contractName, {
      viewMethods: ['num_entries'],
      changeMethods: ['new','add_entry', 'reset_log', 'get_last'],
      sender: accountId
    });
    subcontract = await near.loadContract(nearConfig1.contractName, {
      viewMethods: [],
      changeMethods: ['new', 'indirect_num_entries','indirect_add_entry', 'info'],
      sender: accountId
    });
  });

  
  describe('init', function () {

	var counter;
	var startCounter;

    it('main contract can be initialized', async function() {
      await contract.new({"args" : {}});
      const counter = await contract.num_entries({"args": {}});
      expect(counter).toEqual(0);
    });
    it('subcontract can be initialized', async function() {
      await subcontract.new({"args" : {"log_contract" : accountId}});
      const counter = await subcontract.indirect_num_entries({"args" : {}});
      expect(counter).toEqual(0);
    },10000);
    it('count can be accessed', async function() {
      startCounter = await contract.num_entries({"args": {}});
      expect(startCounter).toEqual(0);
    });
    it('main contract can add entries', async function () {
      await contract.add_entry({"args" : { "timestamp" : "Time1","name" : "My Name","message": "My Message"}});
      counter = await contract.num_entries({"args": {}});
      expect(counter).toEqual(startCounter + 1);
    });
    it('sub account config is can be read', async function() {
      const cfg_contract = await subcontract.info({"args" : {}});
      expect(cfg_contract).toEqual(accountId);
    });
    it('sub contract can add entries', async function () {
      const startCounter = await contract.num_entries({"args": {}});
      await subcontract.indirect_add_entry({"args" : { "timestamp" : "Time2","name" : "Joe","message": "Cool", "transfer_amount" : "0"}});
      const endCounter = await subcontract.indirect_num_entries({"args": {}});
      expect(endCounter).toEqual(startCounter + 1);
    },15000);
    it('get last data is valid', async function () {
      await subcontract.indirect_add_entry({"args" : { "timestamp" : "Time3","name" : "Luke","message": "Your father", "transfer_amount" : "0"}});
      var last_data = await contract.get_last({"args": {}});
      var last_entry = JSON.parse(last_data);
	  expect(last_entry.name).toEqual("indirect Luke");
	  expect(last_entry.message).toEqual("indirect Your father");

      await contract.add_entry({"args" : { "timestamp" : "Time1","name" : "R2D2","message": "Beep, boop"}});
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
