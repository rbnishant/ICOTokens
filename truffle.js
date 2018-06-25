const HDWalletProvider = require("truffle-hdwallet-provider-privkey");
// const privKey = require('fs').readFileSync('./privKey').toString();
const privKey = "9F82B55CC2F2B061E7CE5DB75AFC7D902969D5A2A9DE1086AFC9EF153EFC831A";

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
      gas: 7900000,
    },
    mainnet: {
      host: 'localhost',
      port: 8545,
      network_id: '1', // Match any network id
      gas: 7900000,
      gasPrice: 10000000000
    },
    ropsten: {
      provider: new HDWalletProvider(privKey, "https://ropsten.infura.io/g5xfoQ0jFSE9S5LwM1Ei"),
      //host: 'localhost',
      //port: 8545,
      network_id: '3', // Match any network id
      gas: 4500000,
      gasPrice: 150000000000
    },
    kovan: {
      // provider: new HDWalletProvider(privKey, "http://localhost:8545"),
      host: 'localhost',
      port: 8545,
      network_id: '42', // Match any network id
      gas: 7900000,
      gasPrice: 10000000000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};