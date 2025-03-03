// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract LingolinCreditNFT is ERC721A, Ownable {
    using Strings for uint256;

    string public metadataURI;
    
    // Custom errors
    error LingolinCreditNFT__NotTokenOwner();
    error LingolinCreditNFT__NonTransferableToken();
    error LingolinCreditNFT__InsufficientContractBalance();

    uint256 public constant REWARD_PER_BURN = 10000 gwei;

    constructor(string memory _metadataURI) 
        ERC721A("LingolinCreditNFTTEST123123", "LCN") 
        Ownable(msg.sender) 
    {
        metadataURI = _metadataURI;
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
    function transferFrom(address from, address to, uint256 tokenId) public payable override {
        revert LingolinCreditNFT__NonTransferableToken();
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public payable override {
        revert LingolinCreditNFT__NonTransferableToken();
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public payable override {
        revert LingolinCreditNFT__NonTransferableToken();
    }

    // Function to withdraw ETH from the contract (in case of emergency)
    function withdraw() external onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Burns a specific token. Only the token owner can burn their own token.
     */
    function burn(uint256 tokenId) external {
        // Check if caller is the token owner
        if (ownerOf(tokenId) != msg.sender) {
            revert LingolinCreditNFT__NotTokenOwner();
        }
        
        // Check if contract has enough balance
        if (address(this).balance < REWARD_PER_BURN) {
            revert LingolinCreditNFT__InsufficientContractBalance();
        }

        _burn(tokenId);

        // Transfer 1 ETH to the burner
        (bool success, ) = msg.sender.call{value: REWARD_PER_BURN}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Burns multiple tokens in a batch. Only the token owner can burn their own tokens.
     */
    function burnBatch(uint256[] calldata tokenIds) external {
        uint256 totalReward = tokenIds.length * REWARD_PER_BURN;
        
        // Check if contract has enough balance for all burns
        if (address(this).balance < totalReward) {
            revert LingolinCreditNFT__InsufficientContractBalance();
        }

        for (uint256 i = 0; i < tokenIds.length; i++) {
            // Check if caller is the token owner for each token
            if (ownerOf(tokenIds[i]) != msg.sender) {
                revert LingolinCreditNFT__NotTokenOwner();
            }
            _burn(tokenIds[i]);
        }

        // Transfer the total reward after all burns are successful
        (bool success, ) = msg.sender.call{value: totalReward}("");
        require(success, "Transfer failed");
    }

    // Allow contract to receive ETH
    receive() external payable {}
    fallback() external payable {}
}