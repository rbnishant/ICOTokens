pragma solidity ^0.4.23;
//@title- ICO token application
//@owner- SecureBlocks

contract ERC20 { 
    function tokenExchangeRate() public returns(uint); 
}

contract UserCtrl{
   /**
      * Events
      */
    
    /**
      * Variables
      */
    
    /**
      * Mappings
     */
    mapping (address => uint256) balances;

    /**@dev This function is used to get the balance of the user account and tokens 
      *@param user Address of the user 
      *@return Balance in the users account
     */
    function balanceOf(uint256 sender) view public returns (uint256 balance) {

        getETHBalance(msg.sender);
        
    }
    /**@dev This function is used to get token balance at all addreses
      *@param tokenAddress Address of the user
      *@return bal Balance 
     */
    function getETHBalance(address tokenAddress) view public returns (uint){
        ERC20 t = ERC20(tokenAddress); 
        uint bal = t.tokenExchangeRate();
        return bal;
    }


}