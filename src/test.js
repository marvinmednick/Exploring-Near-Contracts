describe('Token', function () {
  let near;
  let contract;
  let accountId;

  beforeAll(async function () {
    console.log('nearConfig', nearConfig);
    near = await nearlib.connect(nearConfig);
    accountId = nearConfig.contractName;
    contract = await near.loadContract(nearConfig.contractName, {
      viewMethods: ['num_entries'],
      changeMethods: ['new','add_entry', 'reset_log'],
      sender: accountId
    });
  });

  describe('entries', function () {

    it('can be initialized', async function() {
      await contract.new();
      const endCounter = await contract.num_entries();
      expect(endCounter).toEqual(0);
    });
    it('can be accessed', async function() {
      const endCounter = await contract.num_entries();
      expect(endCounter).toEqual(0);
    });
    it('can add entries', async function () {
      const startCounter = await contract.num_entries();
      await contract.add_entry({ "timestamp" : "Time1","name" : "My Name","message": "My Message"});
      const endCounter = await contract.num_entries();
      expect(endCounter).toEqual(startCounter + 1);
    });
    it('can be reset', async function () {
      await contract.reset_log();
      const endCounter = await contract.num_entries(args={});
      expect(endCounter).toEqual(0);
    });
  });
});
