const Airdrop = artifacts.require('./Airdrop.sol');
const Faucet = artifacts.require('./Faucet.sol');
const Web3 = require('web3');

module.exports = function(deployer, network, accounts){
    let web3;
    if(network == 'development'){
        web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
    }
    if(network == 'ropsten'){
        web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/I7P2ErGiQjuq4jNp41OE');
    }

    return deployer.deploy(Faucet, {from: accounts[0]}).then(() => {
        return deployer.deploy(Airdrop, Faucet.address, {from: accounts[0]}).then(() => {
            console.log(`\n`);
            console.log(`Airdrop smart contract`);
            console.log(`**** Airdrop Contract :- ${Airdrop.address} *****`);
            console.log(`**** Faucet Contract  :- ${Faucet.address} *****`);
        });
    });
}