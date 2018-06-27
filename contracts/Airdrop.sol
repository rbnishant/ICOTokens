pragma solidity ^0.4.23;
import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
//@title- ICO token application
//@owner- SecureBlocks

contract Airdrop is Ownable {

    struct Investor {
        uint256 amount;
        bool locked;
    }

    ERC20 public Token;

    mapping(address => bool) public whitelisted;
    mapping(address => Investor) public investorDetails;

    event LogWhitelisted(address _investor, uint256 _amount, uint256 _timestamp);

    /**
     * @dev constructor is getting tokens from the token contract
     * @param _token Address of the token
     * @return ERC20 standard token 
     */
    constructor(address _token) public {
        Token = ERC20(_token);
    }


    /**
     * @notice Use to whitelist the investor
     * @param _investorAddresses Array of investors need to whitelist
     * only be called by the owner
     */

    function whitelist(address[] _investorAddresses,uint256[] _tokenAmount) external onlyOwner {
        require(_investorAddresses.length == _tokenAmount.length,"Input array's length mismatch");
        for (uint i = 0; i < _investorAddresses.length; i++) {
            whitelisted[_investorAddresses[i]] = true;
            investorDetails[_investorAddresses[i]] = Investor(_tokenAmount[i],false);
            emit LogWhitelisted(_investorAddresses[i], _tokenAmount[i], now);
        }
    }

     /**
      * @notice user can claim their airdrop tokens 
      */

    function claimTokens() external {
        require(whitelisted[msg.sender]);
        require(!investorDetails[msg.sender].locked);
        investorDetails[msg.sender] = Investor(investorDetails[msg.sender].amount, true);
        Token.transfer(msg.sender, investorDetails[msg.sender].amount);
    } 
    
    /**
     * @dev This function is used to sort the array of address and token to send tokens 
     * @param _investorsAdd Address array of the investors
     * @param _tokenVal Array of the tokens
     * @return tokens Calling function to send the tokens
     */
    function airdropTokenDistributionMulti(address[] _investorsAdd, uint256[] _tokenVal) public onlyOwner  returns (bool success){
        require(_investorsAdd.length == _tokenVal.length, "Input array's length mismatch");
        for(uint i = 0; i < _investorsAdd.length; i++ ){
            require(airdropTokenDistribution(_investorsAdd[i], _tokenVal[i]));
        }
        return true;
    }

    /**
     * @dev This function is used to get token balance at oddresses  from the array
     * @param _investorsAdd Array if address of the investors
     * @param _tokenVal Array of tokens to be send
     * @return bal Balance 
     */
    function airdropTokenDistribution(address _investorsAdd, uint256 _tokenVal) public onlyOwner returns (bool success){
        require(_investorsAdd != owner, "Reciever should not be the owner of the contract");
        require(Token.transfer(_investorsAdd, _tokenVal));
        return true;
    }

    /**
     * @dev This function is used to add remaining token balance to the owner address
     * @param _tokenAddress Address of the token contract
     * @return true  
     */
    function withdrawTokenBalance(address _tokenAddress) public onlyOwner returns (bool success){
        require(Token.transfer(_tokenAddress, Token.balanceOf(address(this))));
        return true;
    }

    /**
     * @dev This function is used to add remaining balance to the owner address
     * @return true 
     */
    function withdrawEtherBalance() public onlyOwner returns (bool success){
        owner.transfer(address(this).balance);
        return true;
    }
}