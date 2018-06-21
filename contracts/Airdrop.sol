pragma solidity ^0.4.23;
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
//@title- ICO token application
//@owner- SecureBlocks

contract Airdrop is Ownable {

    ERC20 public Token;
   
    /**@dev constructor is getting tokens from the token contract
      *@param _token Address of the token
      *@return ERC20 standard token 
     */
    constructor(address _token) public {
        Token = ERC20(_token);
    }
    
    /**@dev This function is used to sort the array of address and token to send tokens 
      *@param _investorsAdd Address array of the investors
      *@param _token Array of the tokens
      *@return tokens Calling function to send the tokens
     */
    function airdropTokenDistributionMulti(address[] _investorsAdd, uint256[] _tokenVal) public onlyOwner  returns (bool success){
        require(_investorsAdd.length == _tokenVal.length, "Input array's length mismatch");
        for(uint i = 0; i < _investorsAdd.length; i++ ){
            require(airdropTokenDistribution(_investorsAdd[i], _tokenVal[i]));
        }
        return true;
    }

    /**@dev This function is used to get token balance at oddresses  from the array
      *@param _investorsAddress Array if address of the investors
      *@param _token Array of tokens to be send
      *@return bal Balance 
     */
    function airdropTokenDistribution(address _investorsAdd, uint256 _tokenVal) public onlyOwner returns (bool success){
        require(_investorsAdd != owner, "Reciever should not be the owner of the contract");
        require(Token.transfer(_investorsAdd, _tokenVal));
        return true;
    }

    /**@dev This function is used to add remaining token balance to the owner address
      *@param _token Address of the token contract
      *@return true  
     */
    function withdrawTokenBalance(address _tokenAddress) public onlyOwner returns (bool success){
        require(Token.transfer(_tokenAddress, Token.balanceOf(address(this))));
        return true;
    }
    /**@dev This function is used to add remaining balance to the owner address
      *@param _token Address of the token contract
      *@return true 
     */
    function withdrawEtherBalance() public onlyOwner returns (bool success){
        owner.transfer(address(this).balance);
        return true;
    }
}