pragma solidity ^0.4.23;
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
//@title- ICO token application
//@owner- SecureBlocks

contract Airdrop is Ownable {
   
    /**@dev constructor is getting tokens from the token contract
      *@param _token Address of the token
      *@return ERC20 standard token 
     */
    constructor(address _token) public {
        ERC20 Token = ERC20(_token);
    }
    
    /**@dev This function is used to sort the array of address and token to send tokens 
      *@param _investorsAdd Address array of the investors
      *@param _token Array of the tokens
      *@return tokens Calling function to send the tokens
     */
    function sendTokens(address[] _investorsAdd, uint256[] _tokenVal) public onlyOwner  returns (bool success){
        require(_investorsAdd.length == _tokenVal.length);
        for(uint i = 0;i <= _investorsAdd.length; i++ ){
            transferToken(_investorsAdd[i], _tokenVal[i]);    
        }
        return true;
    }

    /**@dev This function is used to get token balance at oddresses  from the array
      *@param _investorsAddress Array if address of the investors
      *@param _token Array of tokens to be send
      *@return bal Balance 
     */
    function transferToken(address _investorsAdd, uint256 _tokenVal) public onlyOwner returns (bool success){
        require(_investorsAdd != owner);
        require(Token.transfer(_investorsAdd, _tokenVal));
        return true;
    }

    /**@dev This function is used to add remaining token balance to the owner address
      *@param _token Address of the token contract
      *@return true  
     */
    function WithdrawTokenBalance() public onlyOwner returns (bool success){
        require(Token.transfer(owner, Token.balanceof(address(this))));
        return true;
    }
    /**@dev This function is used to add remaining balance to the owner address
      *@param _token Address of the token contract
      *@return true 
     */
    function WithdrawEtherBalance() public onlyOwner returns (bool success){
        require(owner.transfer(_token.balanceof(address(this))));
        return true;
    }
}