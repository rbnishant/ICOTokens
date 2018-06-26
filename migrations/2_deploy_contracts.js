const Airdrop = artifacts.require('./Airdrop.sol');
const Faucet = artifacts.require('./Faucet.sol');
const Web3 = require('web3');
let airdropAmount;
//let owner = "0xf8c7b132cd6bd4ff0e4260a4185e25a0fd49cea3";

module.exports = function(deployer, network, accounts){
    let web3;
    if(network == 'development'){
        web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
        airdropAmount = web3.utils.toWei("1000","ether");
    }
    if(network == 'ropsten'){
        web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/g5xfoQ0jFSE9S5LwM1Ei'))
        airdropAmount = web3.utils.toWei("1000","ether");
    }

    return deployer.deploy(Faucet, {from: accounts[0]}).then(() => {
        return deployer.deploy(Airdrop, Faucet.address, airdropAmount, {from: accounts[0]}).then(() => {
            console.log(`\n`);
            console.log(`Airdrop smart contract`);
            console.log(`**** Airdrop Contract :- ${Airdrop.address} *****`);
            console.log(`**** Faucet Contract  :- ${Faucet.address} *****`);
        });
    });

    // return deployer.deploy(Faucet, {from: owner}).then(() => {
    //     return deployer.deploy(Airdrop, Faucet.address, airdropAmount, {from: owner}).then(() => {
    //         console.log(`\n`);
    //         console.log(`Airdrop smart contract`);
    //         console.log(`**** Airdrop Contract :- ${Airdrop.address} *****`);
    //         console.log(`**** Faucet Contract  :- ${Faucet.address} *****`);
    //     });
    // });
}