const Airdrop = artifacts.require('./Airdrop.sol');
const Web3 = require('web3');
const tokenAddress = "0xc1fe9f098e6a96443caf46e39b0bbe983c2e44ca";

module.exports = function(deployer, network, accounts){
    let web3;
    if(network == 'development'){
        web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
    }
    if(network == 'ropsten'){
        web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/I7P2ErGiQjuq4jNp41OE'));
    }
    if(network == 'mainnet'){
        web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/mROzXUBaQKkqSyXQFXLq'));
    }
    return deployer.deploy(Airdrop, tokenAddress, {from: accounts[0],gas:350000,gasPrice:10000000000}).then(() => {
        console.log(`\n`);
        console.log(`Airdrop smart contract`);
        console.log(`**** Airdrop Contract :- ${Airdrop.address} *****`);
    });
    
}