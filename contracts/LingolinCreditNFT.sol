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
    error LingolinCreditNFT__NonBurnableToken();
    error LingolinCreditNFT__TransferToZeroAddressNotAllowed();

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
     * @dev Override _beforeTokenTransfers to prevent transfers to the zero address,
     * which is a common way to burn tokens.
     */
    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override {
        if (to == address(0)) {
            revert LingolinCreditNFT__TransferToZeroAddressNotAllowed();
        }
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
    }

    /**
     * @dev Explicitly block any burn function that might be called.
     * This function is added to revert any direct attempts to burn tokens.
     */
    function burn(uint256) external pure {
        revert LingolinCreditNFT__NonBurnableToken();
    }

    /**
     * @dev Block burning multiple tokens at once.
     */
    function burnBatch(uint256[] calldata) external pure {
        revert LingolinCreditNFT__NonBurnableToken();
    }
}