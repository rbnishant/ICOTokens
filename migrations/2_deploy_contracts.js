const Airdrop = artifacts.require('Airdrop.sol');
const tokenAddress = 0x5f3a0f407a8e7dd8b26a5c14d7fc5ed3ef850f72;


module.exports = function(deployer,network){
    if(network == 'development'){
        deployer.deploy(Airdrop,tokenAddress).then(function(){
    
        }) 
    }
    else if(network == 'ropsten'){
        deployer.deploy(Airdrop,tokenAddress).then(function(){
        }) 
    }

}