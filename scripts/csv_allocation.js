var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');
var Web3 = require('web3');
let chalk = require('chalk');

/////////////////// RUNTIME ARGUMENT ////
let BATCH_SIZE = process.argv.slice(2)[0];
if(!BATCH_SIZE) BATCH_SIZE = 40;


let airdropDistribution;
let token;
let airdropContractAddress;
let airdropContractABI;
let tokenContractABI;

var web3;
const DEFAULT_GAS_PRICE = 11000000000;


////////////////////////////WEB3//////////////////////////////////////////
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
  } else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }


try {
    airdropContractABI = JSON.parse(fs.readFileSync('./build/contracts/Airdrop.json').toString()).abi;
    tokenContractABI = JSON.parse(fs.readFileSync('./build/contracts/Faucet.json').toString()).abi;
    airdropContractAddress = JSON.parse(fs.readFileSync('./build/contracts/Airdrop.json').toString()).networks[15].address;
} catch(error) {
    console.log('\x1b[31m%s\x1b[0m', "Couldn't find contracts' artifacts. Make sure you ran truffle compile first");
    return;
}

/////////////////////////GLOBAL VARS//////////////////////////////////////////

//distribData is an array of batches. i.e. if there are 200 entries, with batch sizes of 75, we get [[75],[75],[50]]
let distribData = new Array();
//allocData is a temporary array that stores up to the batch size,
//then gets push into distribData, then gets set to 0 to start another batch
let allocData = new Array();
//full file data is a single array that contains all arrays. i.e. if there are 200 entries we get [[200]]
let fullFileData = new Array();
let badData = new Array();



startScript();

async function startScript() {
    try {
        airdropDistribution = new web3.eth.Contract(airdropContractABI, airdropContractAddress);
        console.log("Processing investor CSV upload. Batch size is "+BATCH_SIZE+" accounts per transaction");
        readFile();
    } catch (error) {
        console.log(error.message);
        console.log('\x1b[31m%s\x1b[0m', "There was a problem getting the contracts. Make sure they are deployed to the selected network.");
        return;
    }
}

function readFile() {
    var stream = fs.createReadStream("./scripts/data/airdrop.csv");
    let index = 0;
    let batch = 0;
    console.log(`
        --------------------------------------------
        --------- Parsing distrib.csv file ---------
        --------------------------------------------
    ******** Removing beneficiaries without address data
    `);
    var csvStream = csv()
    .on("data", function(data) {
        let isAddress = web3.utils.isAddress(data[0]);
        let isValidNo = isValidToken(data[1]);

        if(isAddress && isValidNo) {
            let userArray = new Array()
            let checksummedAddress = web3.utils.toChecksumAddress(data[0]);
            let tokenAmount = web3.utils.toWei(data[1].toString(), "ether");
            userArray.push(checksummedAddress)
            userArray.push(tokenAmount)
            // console.log(userArray)
            allocData.push(userArray);
            fullFileData.push(userArray);
            index++;
            if (index >= BATCH_SIZE) {
                distribData.push(allocData);
                // console.log("DIS", distribData);
                allocData = [];
                // console.log("ALLOC", allocData);
                index = 0;
            }

        } else {
            let userArray = new Array()
            //dont need this here, as if it is NOT an address this function will fail
            //let checksummedAddress = web3.utils.toChecksumAddress(data[1]);
            userArray.push(data[0])
            userArray.push(web3.utils.toWei(data[1].toString(), "ether"))
            badData.push(userArray);
            fullFileData.push(userArray)
        }
  })
  .on("end", function () {
    //Add last remainder batch
    distribData.push(allocData);
    allocData = [];

    setAllocation();
  });

stream.pipe(csvStream);
}

async function setAllocation() {
    accounts = await web3.eth.getAccounts();
    Issuer = accounts[0];

    let tokenDeployed = false;
    let tokenDeployedAddress;
    await airdropDistribution.methods.Token().call({from: Issuer}, function(error, result) {
        if (result != "0x0000000000000000000000000000000000000000") {
            console.log('\x1b[32m%s\x1b[0m', "Token deployed at address " + result + ".");
            tokenDeployedAddress = result;
            tokenDeployed = true;
          }
        });
        if (tokenDeployed) {
            token = new web3.eth.Contract(tokenContractABI, tokenDeployedAddress);
            await token.methods.getTokens(web3.utils.toWei("1500", "ether"), airdropContractAddress).send({from: Issuer, gas: 200000, gasPrice: DEFAULT_GAS_PRICE})
            .on('receipt', function(receipt) {
                console.log(`
                    Congratulations! 1500 Tokens are trasfered successfully
                    Review it on Etherscan.
                    TxHash: ${receipt.transactionHash}\n`);
            })
            .on("error", console.error);
        } else {
            console.log(chalk.red(`Token address is not set in to the airdrop contract`));
            return;
        }

        //this for loop will do the batches, so it should run 75, 75, 50 with 200
  for (let i = 0; i < distribData.length; i++) {
    try {
      let investorArray = [];
      let tokenArray = [];

      //splitting the user arrays to be organized by input
      for (let j = 0; j < distribData[i].length; j++) {
        investorArray.push(distribData[i][j][0])
        tokenArray.push(distribData[i][j][1])
      }

      let r = await airdropDistribution.methods.airdropTokenDistributionMulti(investorArray, tokenArray).send({ from: Issuer, gas: 5000000, gasPrice: DEFAULT_GAS_PRICE })
      console.log(`Batch ${i} - Attempting to distribute the tokens accounts:\n\n`, investorArray, "\n\n");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------");
      console.log("Token distribution transaxction was successful.", r.gasUsed, "gas used. Spent:", web3.utils.fromWei(BigNumber(r.gasUsed * DEFAULT_GAS_PRICE).toString(), "ether"), "Ether");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------\n\n");

    } catch (err) {
      console.log("ERROR:", err.message);
    }
  }

  console.log("Retrieving logs to determine investors have had their times uploaded correctly.\n\n")

  let totalInvestors = 0;
  let updatedInvestors = 0;

  let investorData_Events = new Array();
  let investorObjectLookup = {};


  let event_data = await token.getPastEvents('Transfer', {
    fromBlock: 0,
    toBlock: 'latest'
  }, function (error, events) {
    //console.log(error);
  });

  for (var i = 0; i < event_data.length; i++) {
    let combineArray = [];

    let investorAddress_Event = event_data[i].returnValues._to;
    let tokenNo_Event = event_data[i].returnValues._value;
    let blockNumber = event_data[i].blockNumber

    combineArray.push(investorAddress_Event);
    combineArray.push(tokenNo_Event);
    combineArray.push(blockNumber)

    investorData_Events.push(combineArray)

    //we have already recorded it, so this is an update to our object
    if (investorObjectLookup.hasOwnProperty(investorAddress_Event)) {

      //the block number form the event we are checking is bigger, so we gotta replace it
      if (investorObjectLookup[investorAddress_Event].recordedBlockNumber < blockNumber) {
        investorObjectLookup[investorAddress_Event] = { to: investorAddress_Event, value: tokenNo_Event, recordedBlockNumber: blockNumber };
        updatedInvestors += 1;
        // investorAddress_Events.push(investorAddress_Event); not needed, because we start the obj with zero events

      } else {
        //do nothing. so if we find an event, and it was an older block, its old, we dont care
      }
      //we have never recorded this address as an object key, so we need to add it to our list of investors updated by the csv
    } else {
      investorObjectLookup[investorAddress_Event] = { to: investorAddress_Event, value: tokenNo_Event, recordedBlockNumber: blockNumber };
      totalInvestors += 1;
      // investorAddress_Events.push(investorAddress_Event);
    }
  }
  let investorAddress_Events = Object.keys(investorObjectLookup)

  console.log(`******************** EVENT LOGS ANALYSIS COMPLETE ********************\n`);
  console.log(`A total of ${totalInvestors} investors have been distributed total, all time.\n`);
  console.log(`This script in total sent ${fullFileData.length - badData.length} new investors and updated investors to the blockchain.\n`);
  console.log(`There were ${badData.length} bad entries that didnt get sent to the blockchain in the script.\n`);

  // console.log("LIST OF ALL INVESTOR DATA FROM EVENTS:", investorData_Events)
  // console.log(fullFileData)
  console.log("************************************************************************************************");
  console.log("OBJECT WITH EVERY USER AND THEIR UPDATED TIMES: \n\n", investorObjectLookup)
  console.log("************************************************************************************************");
  console.log("LIST OF ALL INVESTORS WHITELISTED: \n\n", investorAddress_Events)

  let missingDistribs = [];
  for (let l = 0; l < fullFileData.length; l++) {
    if (!investorObjectLookup.hasOwnProperty(fullFileData[l][0])) {
      missingDistribs.push(fullFileData[l])
    }
  }

  if (missingDistribs.length > 0) {
    console.log("************************************************************************************************");
    console.log("-- No Transfer event was found for the following data arrays. Please review them manually --")
    console.log(missingDistribs)
    console.log("************************************************************************************************");
  } else {
    console.log("\n************************************************************************************************");
    console.log("All accounts passed through from the CSV were successfully whitelisted, because we were able to read them all from events")
    console.log("************************************************************************************************");
  }
  // console.log(`Run 'node scripts/verify_airdrop.js ${polyDistribution.address} > scripts/data/review.csv' to get a log of all the accounts that were distributed the airdrop tokens.`)

}

function isValidToken(_tokenAmount) {
   if(_tokenAmount != '' && parseInt(_tokenAmount) > 0)
        return true;
    return false;
}




// async function setAllocation_temp() {
    //     console.log(`
    //         --------------------------------------------
    //         ---------Performing allocations ------------
    //         --------------------------------------------
    //       `);
        
    //     for(var i = 0;i< distribData.length;i++){
    //         try{
    //           console.log("Attempting to allocate",distribDataToken[i],"to accounts:",distribData[i],"\n\n");
    //           let code = await Contract.methods.transferToMutipleAddress(distribData[i],distribDataToken[i]).encodeABI();
    //           let keys = {pubkey:"0xf8c7b132cd6bd4ff0e4260a4185e25a0fd49cea3",privkey:"9F82B55CC2F2B061E7CE5DB75AFC7D902969D5A2A9DE1086AFC9EF153EFC831A"};
    //           var rawTx = {
    //             nonce: await web3.eth.getTransactionCount(keys.pubkey),
    //             gasPrice: 50000000000,
    //             gasLimit: 4500000,
    //             data: code
    //           }
    //           var tx = new Tx(rawTx);
    //           tx.sign(keys.privkey);
    //           var serializedTx = tx.serialize();
    //           web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    //           .on('receipt',async(receipt)=>{
    //             console.log("---------- ---------- ---------- ----------");
    //             console.log("Allocation + transfer was successful.", receipt.gasUsed, "gas used. Spent:",receipt.gasUsed * gPrice,"wei");
    //             console.log("---------- ---------- ---------- ----------\n\n")
    //           })
    //           .on('error',async(error)=>{
    //             console.log("Error:",error);
    //           })
             
    //         } catch (err){
    //           console.log("ERROR:",err);
    //         }
    //     }
    // }
