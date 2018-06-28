var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');
const Web3 = require('web3');
const chalk = require('chalk');
const HDWalletProvider = require("truffle-hdwallet-provider");
const privKey = require('fs').readFileSync('./privKey').toString();

////////////////////////////USER INPUTS//////////////////////////////////////////
let BATCH_SIZE = process.argv.slice(2)[0];
if(!BATCH_SIZE) BATCH_SIZE = 70;
let NETWORK_SELECTED = process.argv.slice(2)[1]; // Selected network
if(!NETWORK_SELECTED) NETWORK_SELECTED = 15;
let DECIMALS = process.argv.slice(2)[2]; 
if(!DECIMALS) DECIMALS = 18;

/////////////////////////////ARTIFACTS//////////////////////////////////////////

let airdropABI;
let aridropAddress;
let airdrop;
let tokenContractABI;

try {
   airdropABI = JSON.parse(require('fs').readFileSync('./build/contracts/Airdrop.json').toString()).abi;
   tokenContractABI = JSON.parse(fs.readFileSync('./abi/tokenContractAbi.json').toString());
   airdropAddress = JSON.parse(require('fs').readFileSync('./build/contracts/Airdrop.json').toString()).networks[NETWORK_SELECTED].address;
} catch (err) {
  console.log('\x1b[31m%s\x1b[0m', "Couldn't find contracts' artifacts. Make sure you ran truffle compile first");
  return;
}


////////////////////////////WEB3//////////////////////////////////////////
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else if(NETWORK_SELECTED == '3') {
  const provider = new HDWalletProvider(privKey, 'https://ropsten.infura.io/I7P2ErGiQjuq4jNp41OE');
  web3 = new Web3(provider);
} else if(NETWORK_SELECTED == '1') {
  const provider = new HDWalletProvider(privKey, 'https://mainnet.infura.io/mROzXUBaQKkqSyXQFXLq');
  web3 = new Web3(provider);
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

let Issuer;
let accounts;

let DEFAULT_GAS_PRICE = 10000000000;



//////////////////////////////////////////ENTRY INTO SCRIPT//////////////////////////////////////////

startScript();

async function startScript() {
  try {
    airdrop = new web3.eth.Contract(airdropABI, airdropAddress);
    airdrop.setProvider(web3.currentProvider);
    console.log("Processing investor CSV upload. Batch size is "+BATCH_SIZE+" accounts per transaction");
    readFile();
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m', "There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    return;
  }
}

///////////////////////////FUNCTION READING THE CSV FILE
function readFile() {
  var stream = fs.createReadStream("./scripts/data/whitelist.csv");

  let index = 0;
  let batch = 0;
  console.log(`
    --------------------------------------------
    ----------- Parsing the csv file -----------
    --------------------------------------------
  `);

  var csvStream = csv()
    .on("data", function (data) {
      let isAddress = web3.utils.isAddress(data[0]);
      let isValidNo = isValidToken(data[1]);
      if (isAddress && isValidNo) {
        let userArray = new Array()
        let checksummedAddress = web3.utils.toChecksumAddress(data[0]);
        let tokenAmount = new BigNumber(data[1].toString()).times(new BigNumber(10).pow(DECIMALS));
        userArray.push(checksummedAddress);
        userArray.push(tokenAmount);
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
        userArray.push(data[0])
        userArray.push(new BigNumber(data[1].toString()).times(new BigNumber(10).pow(DECIMALS)))
        badData.push(userArray);
        fullFileData.push(userArray)
      }
    })
    .on("end", function () {
      //Add last remainder batch
      distribData.push(allocData);
      allocData = [];

      setInvestors();
    });

  stream.pipe(csvStream);
}

////////////////////////MAIN FUNCTION COMMUNICATING TO BLOCKCHAIN
async function setInvestors() {
   accounts = await web3.eth.getAccounts();
   Issuer = accounts[0];

  let tokenDeployed = false;
  let tokenDeployedAddress;
  await airdrop.methods.Token().call({from: Issuer}, function(error, result) {
        if (result != "0x0000000000000000000000000000000000000000") {
            console.log('\x1b[32m%s\x1b[0m', "Token deployed at address " + result + ".");
            tokenDeployedAddress = result;
            tokenDeployed = true;
          }
      });
      if (tokenDeployed) {
            token = new web3.eth.Contract(tokenContractABI, tokenDeployedAddress);   
      } else {
            console.log(chalk.red(`Token address is not set in to the airdrop contract`));
            return;
      }

  console.log(`
    -------------------------------------------------------
    ----- Sending buy/sell restrictions to blockchain -----
    -------------------------------------------------------
  `);

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

      let gas = await airdrop.methods.whitelist(investorArray,tokenArray).estimateGas({from: Issuer});
      let gasCalculated = gas+ ((10 * gas)/100);
      let EthUsed = gasCalculated * DEFAULT_GAS_PRICE;
      let ownerBalance = await web3.eth.getBalance(Issuer);

      if (parseInt(ownerBalance) < parseFloat(EthUsed)) {
        console.log(chalk.red(`${Issuer} have not enough balance to process the transaction. need ${web3.utils.fromWei(EthUsed)} ETH to execute the transaction`)); 
        process.exit();
      }
      let r = await airdrop.methods.whitelist(investorArray,tokenArray).send({ from: Issuer, gas: Math.round(gasCalculated), gasPrice: DEFAULT_GAS_PRICE })
      console.log(`Batch ${i} - Attempting to modifyWhitelist accounts:\n\n`, investorArray, "\n\n");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------");
      console.log("Whitelist transaxction was successful.", r.gasUsed, "gas used. Spent:", web3.utils.fromWei(BigNumber(r.gasUsed * DEFAULT_GAS_PRICE).toString(), "ether"), "Ether");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------\n\n");

    } catch (err) {
      console.log("ERROR:", err);
    }
  }

  console.log("Retrieving logs to determine investors have had their times uploaded correctly.\n\n")

  let totalInvestors = 0;
  let updatedInvestors = 0;

  let investorData_Events = new Array();
  let investorObjectLookup = {};

  let event_data = await airdrop.getPastEvents('LogWhitelisted', {
    fromBlock: 0,
    toBlock: 'latest'
  }, function (error, events) {
    //console.log(error);
  });

  for (var i = 0; i < event_data.length; i++) {
    let combineArray = [];

    let investorAddress_Event = event_data[i].returnValues._investor;
    let tokenAmount_Event = event_data[i].returnValues._amount;
    let atTime_event = event_data[i].returnValues._timestamp
    let blockNumber = event_data[i].blockNumber

    combineArray.push(investorAddress_Event);
    combineArray.push(tokenAmount_Event);
    combineArray.push(blockNumber)

    investorData_Events.push(combineArray)

    //we have already recorded it, so this is an update to our object
    if (investorObjectLookup.hasOwnProperty(investorAddress_Event)) {

      //the block number form the event we are checking is bigger, so we gotta replace it
      if (investorObjectLookup[investorAddress_Event].recordedBlockNumber < blockNumber) {
        investorObjectLookup[investorAddress_Event] = {atTime: atTime_event, recordedBlockNumber: blockNumber };
        updatedInvestors += 1;
        // investorAddress_Events.push(investorAddress_Event); not needed, because we start the obj with zero events

      } else {
        //do nothing. so if we find an event, and it was an older block, its old, we dont care
      }
      //we have never recorded this address as an object key, so we need to add it to our list of investors updated by the csv
    } else {
      investorObjectLookup[investorAddress_Event] = { atTime: atTime_event, recordedBlockNumber: blockNumber };
      totalInvestors += 1;
      // investorAddress_Events.push(investorAddress_Event);
    }
  }
  let investorAddress_Events = Object.keys(investorObjectLookup)

  console.log(`******************** EVENT LOGS ANALYSIS COMPLETE ********************\n`);
  console.log(`A total of ${totalInvestors} investors have been whitelisted total, all time.\n`);
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
    console.log("-- No LogModifyWhitelist event was found for the following data arrays. Please review them manually --")
    console.log(missingDistribs)
    console.log("************************************************************************************************");
    process.exit();
  } else {
    console.log("\n************************************************************************************************");
    console.log("All accounts passed through from the CSV were successfully whitelisted, because we were able to read them all from events")
    console.log("************************************************************************************************");
    process.exit();
  }

}

function isValidToken(_tokenAmount) {
  if(_tokenAmount != '' && parseInt(_tokenAmount) > 0)
       return true;
   return false;
}

