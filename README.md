# Steps to run scripts:

1. Create a file with name `privKey` and add the seed words of the ethereum account in it. This address will become the owner address of the airdrop contract.

2. Run command `npm install`.

3. Add ethereum addresses and token amount in the file `airdrop.csv`(scripts->data->airdrop.csv). This file contains those addresses to which owner wants to send the tokens.

4. Add ethereum addresses and token amount in the file `whitelist.csv`(scripts->data->airdrop.csv). All the addresses of this file will get whitelisted and whitelisted addresses can claim there tokens from myetherwallet.

5. Change the `token address(tokenAddress)` in the `2_deploy_contracts.js`(migrations->2_deploy_contracts.js) file. This address will be used to set the token address in the airdrop contract.

6. Run command `npm run`. This command will compile the airdrop contract.

7. Run command `npm run migrate-mainnet`. This command will deploy the airdrop contract to the mainnet and you will get the airdrop contract address in the console.

8. After contract migration you have to transfer tokens to the airdrop contract address as tokens will be distributed from that contract. If tokens won't be there in contract the transctions would get failed.

9. After token transfer you need to run the scripts. Run command `node scripts/csv_allocation.js 70 1 18` in this `70` is the batch size `1` refers to the mainnet ethereum network and `18` is decimal. This script will transfer the tokens to the addresses which is set in the airdrop.csv file.

10. Run command `node scripts/whitelist.js 70 1 18` in this `70` is the batch size `1` refers to the mainnet ethereum network and `18` is decimal. This script will whitelist addresses with the desired tokens.

# Steps to claim tokens from myetherwallet

1. User need to login into [myetherwallet.com](https://www.myetherwallet.com/) using the address that is whitelisted.

2. Click on Send Ether & Tokens and select private key option then insert the private key and login into the myetherwallet.

3. After login user need to fill fields as follows:
> 
	     To Address: <Airdrop contract address>
	     Amount To send:0
	     Gas Limit:80000 (If transaction fails increase the gas limit value)
 	     Then click on +Advanced:Add data and enter 
         Data:0x48c54b9d
	
4. After enter all details just click on the generate transaction user will receive the airdrop tokens in its address.





