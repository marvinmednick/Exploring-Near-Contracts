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
      changeMethods: ['new','add_entry', 'reset'],
      sender: accountId
    });
    console.log("Contract is:", contract);
  });

  describe('entries', function () {
    console.log("A Contract is:", contract);

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
      await contract.add_entry("Time1","My Name","My Message");
      const endCounter = await contract.get_num();
      expect(endCounter).toEqual(startCounter + 1);
    });
    it('can be reset', async function () {
      const startCounter = await contract.num_entries();
      await contract.reset();
      const endCounter = await contract.num_entries();
      expect(endCounter).toEqual(0);
    });
  });
});
