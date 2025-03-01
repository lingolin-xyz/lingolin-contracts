// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title LingolinAchievementNFT
 * @dev A soulbound (non-transferable) ERC721 token implementation for Lingolin Achievement system
 *
 * Key Features:
 * - Tokens are soulbound (cannot be transferred once minted)
 * - Only addresses with MINTER_ROLE can mint new tokens
 * - Only addresses with ADMIN_ROLE can update base URI
 * - Each token has a unique ID and associated metadata URI
 * - Achievements are permanent and cannot be burned
 *
 * Rules:
 * 1. Minting:
 *    - Only MINTER_ROLE can mint new tokens
 *    - Each token gets an auto-incrementing ID
 *
 * 2. Access Control:
 *    - ADMIN_ROLE: Can set base URI
 *    - MINTER_ROLE: Can mint new tokens
 *    - Contract deployer gets both roles initially
 *
 * 3. Metadata:
 *    - Each token has a URI constructed from base URI + token ID
 *    - Base URI can be updated by ADMIN_ROLE
 */

contract LingolinAchievementNFT is ERC721, AccessControl {
    using Strings for uint256;

    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;

    // State variables
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    // Custom errors
    error LingolinAchievementNFT__SoulboundTokenNonTransferable();
    error LingolinAchievementNFT__TokenNonexistent();
    error LingolinAchievementNFT__DuplicateTokenId();

    // Events
    event AchievementNFTMinted(address indexed to, uint256 indexed tokenId);
    event BaseURIUpdated(string newBaseURI);

    constructor(string memory baseURI) ERC721("LingolinAchievement", "LACH") {
        _baseTokenURI = baseURI;
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    // Mint function - only minter role can mint
    function mint(address to) public onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        emit AchievementNFTMinted(to, tokenId);
        return tokenId;
    }

    // Override transfer functions to make tokens soulbound
    function transferFrom(address, address, uint256) public pure override {
        revert LingolinAchievementNFT__SoulboundTokenNonTransferable();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert LingolinAchievementNFT__SoulboundTokenNonTransferable();
    }

    function safeTransferFrom(address, address, uint256) public pure override {
        revert LingolinAchievementNFT__SoulboundTokenNonTransferable();
    }

    // Base URI management
    function setBaseURI(string memory newBaseURI) public onlyRole(ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // View functions
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId < _nextTokenId && ERC721.ownerOf(tokenId) != address(0);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert LingolinAchievementNFT__TokenNonexistent();
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    // Required override
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
