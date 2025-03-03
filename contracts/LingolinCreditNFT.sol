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
    
    // Mapping for individual token URIs
    mapping(uint256 => string) private _tokenURIs;
    
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
        
        string memory _tokenURI = _tokenURIs[tokenId];
        
        // If there's no individual URI, return the default one
        if (bytes(_tokenURI).length == 0) {
            return metadataURI;
        }
        
        return _tokenURI;
    }

    /**
     * @dev Sets the token URI for a specific token ID
     * @param tokenId The token ID to update
     * @param _tokenURI The new token URI
     */
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
        _tokenURIs[tokenId] = _tokenURI;
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
     * @dev Function to withdraw specific ERC20 tokens from the contract (in case of emergency)
     * @param _token The address of the ERC20 token to withdraw
     */
    function withdrawRewardTokens(address _token) external onlyOwner {
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(msg.sender, balance), "Token transfer failed");
    }

    /**
     * @dev Function to withdraw ETH from the contract (in case of emergency)
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success,) = msg.sender.call{value: balance}("");
        require(success, "ETH transfer failed");
    }

    /**
     * @dev Function to update the reward amount per burn
     */
    function setRewardPerBurn(uint256 _rewardPerBurn) external onlyOwner {
        rewardPerBurn = _rewardPerBurn;
    }

    /**
     * @dev Function to update the reward token address
     * @param _rewardToken The new reward token address
     */
    function updateRewardToken(address _rewardToken) external onlyOwner {
        rewardToken = IERC20(_rewardToken);
    }

    // Allow contract to receive ETH
    receive() external payable {}
    fallback() external payable {}
}