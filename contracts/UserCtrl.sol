pragma solidity ^0.4.23;
//@title- ICO token application
//@owner- SecureBlocks

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
    function balanceOf(address user) view public returns (uint256 balance) {
        return balances[msg.sender];
    }


}