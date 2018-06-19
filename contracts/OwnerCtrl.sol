pragma solidity ^0.4.23;
import "node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";

//@title- ICO token application
//@owner- SecureBlocks

contract ERC20 { 
    function tokenExchangeRate() public returns(uint); 
}

contract OwnerCtrl is Ownable{
    /**
      * Events
      */
    /**
      * Variables
      */

    /**
      * Mappings
     */
    mapping (address => bool) public isOwner;
    mapping (address => uint256) balances;
    /**
      * Modifiers
      */

    modifier ownerDoesNotExist(address owner) {
        require(!isOwner[owner]);
        _;
    }
    modifier ownerExists(address owner) {
        require(isOwner[owner]);
        _;
    }
    
    /**@dev This function is used to make transaction on the contract as an owner 
      *@Param address Address of the owner
      */
    function getBalance(address _owner) view public returns (uint256 balance)
    
    {
        isOwner[owner] = true;
        return balances[_owner];
    }
    
    /**@dev This function returns token balances of all the users 
      *@
     */
    function getAllBalances(address[] users) public returns (uint256 balance){
        isOwner[owner] = true;
        for(uint i = 0;i <= users.length; i++ ){
            getETHBalance(users[i]);
            return getBalance(users[i]);    
        }


    }
    /**@dev This function is used to get token balance at all addreses
     */
    function getETHBalance(address tokenAddress) view public returns (uint){
        ERC20 t = ERC20(tokenAddress); 
        uint bal = t.tokenExchangeRate();
        return bal;
    }


}