// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LingolinCreditNFT is ERC721A, Ownable {
    using Strings for uint256;

    string public metadataURI;
    IERC20 public rewardToken;
    uint256 public rewardPerBurn;
    
    // Custom errors
    error LingolinCreditNFT__NotTokenOwner();
    error LingolinCreditNFT__NonTransferableToken();
    error LingolinCreditNFT__InsufficientTokenBalance();

    constructor(
        string memory _metadataURI,
        address _rewardToken,
        uint256 _rewardPerBurn
    ) 
        ERC721A("LingolinCreditNFTTEST123123", "LCN") 
        Ownable(msg.sender) 
    {
        metadataURI = _metadataURI;
        rewardToken = IERC20(_rewardToken);
        rewardPerBurn = _rewardPerBurn;
    }

    function mintNFT(address recipient) external onlyOwner {
        _mint(recipient, 1);
    }

    function mintBatch(address recipient, uint256 quantity) external onlyOwner {
        _mint(recipient, quantity);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
        return metadataURI;
    }

    function updateMetadataURI(string memory _metadataURI) external onlyOwner {
        metadataURI = _metadataURI;
    }

    /**
     * @dev Override transfer functions to prevent transfers (soulbound token)
     */
    function transferFrom(address, address, uint256) public payable override {
        revert LingolinCreditNFT__NonTransferableToken();
    }

    function safeTransferFrom(address, address, uint256) public payable override {
        revert LingolinCreditNFT__NonTransferableToken();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public payable override {
        revert LingolinCreditNFT__NonTransferableToken();
    }

    /**
     * @dev Burns a specific token. Only the token owner can burn their own token.
     */
    function burn(uint256 tokenId) external {
        // Check if caller is the token owner
        if (ownerOf(tokenId) != msg.sender) {
            revert LingolinCreditNFT__NotTokenOwner();
        }
        
        // Check if contract has enough token balance
        if (rewardToken.balanceOf(address(this)) < rewardPerBurn) {
            revert LingolinCreditNFT__InsufficientTokenBalance();
        }

        _burn(tokenId);

        // Transfer reward tokens to the burner
        require(rewardToken.transfer(msg.sender, rewardPerBurn), "Token transfer failed");
    }

    /**
     * @dev Burns multiple tokens in a batch. Only the token owner can burn their own tokens.
     */
    function burnBatch(uint256[] calldata tokenIds) external {
        uint256 totalReward = tokenIds.length * rewardPerBurn;
        
        // Check if contract has enough token balance for all burns
        if (rewardToken.balanceOf(address(this)) < totalReward) {
            revert LingolinCreditNFT__InsufficientTokenBalance();
        }

        for (uint256 i = 0; i < tokenIds.length; i++) {
            // Check if caller is the token owner for each token
            if (ownerOf(tokenIds[i]) != msg.sender) {
                revert LingolinCreditNFT__NotTokenOwner();
            }
            _burn(tokenIds[i]);
        }

        // Transfer the total reward after all burns are successful
        require(rewardToken.transfer(msg.sender, totalReward), "Token transfer failed");
    }

    /**
     * @dev Function to withdraw reward tokens from the contract (in case of emergency)
     */
    function withdrawRewardTokens() external onlyOwner {
        uint256 balance = rewardToken.balanceOf(address(this));
        require(rewardToken.transfer(msg.sender, balance), "Token transfer failed");
    }

    /**
     * @dev Function to update the reward amount per burn
     */
    function setRewardPerBurn(uint256 _rewardPerBurn) external onlyOwner {
        rewardPerBurn = _rewardPerBurn;
    }

    // Allow contract to receive ETH
    receive() external payable {}
    fallback() external payable {}
}