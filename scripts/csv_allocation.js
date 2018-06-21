var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');
var Web3 = require('web3');
let airdropAddress = process.argv.slice(2)[0];
let BATCH_SIZE = process.argv.slice(2)[1];
if(!BATCH_SIZE) BATCH_SIZE = 40;
let distribData = new Array();
let distribDataToken = new Array();
let allocAddress = new Array();
let allocToken = new Array();
var web3;
console.log("Start");
//Ethereum testnet connection
web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/eenkErjk3rtwXMAOCZjb'));  

// else{
// //Ethereum mainnet connection
//     web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/mROzXUBaQKkqSyXQFXLq'));  
// }

const contractAbi = JSON.parse(fs.readFileSync('../build/contracts/Airdrop.json').toString()).abi;


// if(config.TESTING == true) {
//     contractAddress = config.TOKEN_CONTRACT_ADDRESS_DEV;
// }
// else {
//     contractAddress = config.TOKEN_CONTRACT_ADDRESS_PROD;
// }



function readFile() {
    var stream = fs.createReadStream("scripts/data/airdrop.csv");
    let index = 0;
    let batch = 0;
    console.log(`
        --------------------------------------------
        --------- Parsing distrib.csv file ---------
        --------------------------------------------
    ******** Removing beneficiaries without address data
    `);
    var csvStream = csv()
        .on("data", function(data){
            let isAddress = web3.utils.isAddress(data[0]);
            if(isAddress && data[0]!=null && data[0]!='' && data[1]!=null && data[1]!=''){
                allocAddress.push(data[0]);
                allocToken.push(data[1]);
                index++;
                if(index >= BATCH_SIZE)
                {
                distribData.push(allocAddress);
                distribDataToken.push(allocToken);
                allocAddress = [];
                allocToken = [];
                index = 0;
                }
            }
        })
        .on("end", function(){
            //Add last remainder batch
            distribData.push(allocAddress);
            distribDataToken.push(allocToken);
            allocAddress = [];
            allocToken = [];
            setAllocation();
        });
    stream.pipe(csvStream);
}
if(airdropAddress){
  console.log("Processing airdrop. Batch size is",BATCH_SIZE, "accounts per transaction");
  readFile();
}else{
  console.log("Please run the script by providing the address of the airdrop contract");
}

var setAllocation = async => {
    console.log(`
        --------------------------------------------
        ---------Performing allocations ------------
        --------------------------------------------
      `);
    
    for(var i = 0;i< distribData.length;i++){
        try{
          console.log("Attempting to allocate",distribDataToken[i],"to accounts:",distribData[i],"\n\n");
          console.log(contractAbi);
          var Contract = new web3.eth.Contract(contractAbi, "0xfeb336286461f44080451749951c84db7f97d4ee");
          console.log(Contract);
          let code = await Contract.methods.transferToMutipleAddress(distribData[i],distribDataToken[i]).encodeABI();
          let keys = {pubkey:"0xf8c7b132cd6bd4ff0e4260a4185e25a0fd49cea3",privkey:"9F82B55CC2F2B061E7CE5DB75AFC7D902969D5A2A9DE1086AFC9EF153EFC831A"};
          var rawTx = {
            nonce: await web3.eth.getTransactionCount(keys.pubkey),
            gasPrice: 50000000000,
            gasLimit: 4500000,
            data: code
          }
          var tx = new Tx(rawTx);
          tx.sign(keys.privkey);
          var serializedTx = tx.serialize();
          web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
          .on('receipt',async(receipt)=>{
            console.log("---------- ---------- ---------- ----------");
            console.log("Allocation + transfer was successful.", receipt.gasUsed, "gas used. Spent:",receipt.gasUsed * gPrice,"wei");
            console.log("---------- ---------- ---------- ----------\n\n")
          })
          .on('error',async(error)=>{
            console.log("Error:",error);
          })
         
        } catch (err){
          console.log("ERROR:",err);
        }
    }
}