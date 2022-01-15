describe('Token', function () {
  let near;
  let contract;
  let accountId;

  beforeAll(async function () {
    debugger;
    near = await nearlib.connect(nearConfig);
    near1 = await nearlib.connect(nearConfig1);
    accountId = nearConfig.contractName;
    subAccountId = nearConfig1.contractName;
    contract = await near.loadContract(nearConfig.contractName, {
      viewMethods: ['num_entries'],
      changeMethods: ['new','add_entry', 'reset_log'],
      sender: accountId
    });
    subcontract = await near.loadContract(nearConfig1.contractName, {
      viewMethods: [],
      changeMethods: ['new', 'indirect_num_entries','indirect_add_entry', 'info'],
      sender: accountId
    });
  });

  describe('entries', function () {

    it('main contract can be initialized', async function() {
      await contract.new({"args" : {}});
      const endCounter = await contract.num_entries({"args": {}});
      expect(endCounter).toEqual(0);
    });
    it('subcontract can be initialized', async function() {
      await subcontract.new({"args" : {"log_contract" : accountId}});
      const endCounter = await subcontract.indirect_num_entries({"args" : {}});
      expect(endCounter).toEqual(0);
    },10000);
    it('sub account config is can be read', async function() {
      const cfg_contract = await subcontract.info({"args" : {}});
      expect(cfg_contract).toEqual(accountId);
    });
    it('count can be accessed', async function() {
      const endCounter = await contract.num_entries({"args": {}});
      expect(endCounter).toEqual(0);
    });
    it('main contract can add entries', async function () {
      const startCounter = await contract.num_entries({"args": {}});
      await contract.add_entry({"args" : { "timestamp" : "Time1","name" : "My Name","message": "My Message"}});
      const endCounter = await contract.num_entries({"args": {}});
      expect(endCounter).toEqual(startCounter + 1);
    });
    it('sub contract can add entries', async function () {
      const startCounter = await contract.num_entries({"args": {}});
      await subcontract.indirect_add_entry({"args" : { "timestamp" : "Time2","name" : "Joe","message": "Cool", "transfer_amount" : "0"}});
      const endCounter = await subcontract.indirect_num_entries({"args": {}});
      expect(endCounter).toEqual(startCounter + 1);
    },15000);
    it('can be reset', async function () {
      await contract.reset_log({"args": {}});
      const endCounter = await contract.num_entries({"args": {}});
      expect(endCounter).toEqual(0);
    });
  });
});
