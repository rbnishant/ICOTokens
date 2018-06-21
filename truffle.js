var HDWalletProvider = require("truffle-hdwallet-provider-privkey");
const privKey = "9F82B55CC2F2B061E7CE5DB75AFC7D902969D5A2A9DE1086AFC9EF153EFC831A";

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: new HDWalletProvider(privKey, "https://ropsten.infura.io/"),
      network_id: 3,
      gas: 4700036,
      gasPrice: 130000000000,
    }
  }
};
