// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract LingolinCreditNFT is ERC721A, Ownable {
    using Strings for uint256;

    string public metadataURI;

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
}