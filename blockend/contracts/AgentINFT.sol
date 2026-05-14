// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice ERC-7857-compatible iNFT. Each token represents one agent archetype instance.
/// The agent's encrypted intelligence blob lives on 0G Storage; dataHash is its Merkle root.
contract AgentINFT is ERC721, ReentrancyGuard {
    uint256 private _tokenIdCounter;

    mapping(uint256 => uint256) public tokenAgentId;
    mapping(uint256 => bytes32) public tokenDataHash;

    event AgentMinted(uint256 indexed tokenId, uint256 indexed agentId, address owner, bytes32 dataHash);
    event DataHashUpdated(uint256 indexed tokenId, bytes32 newHash);

    constructor() ERC721("Swarmint Agent", "SAGENT") {}

    function mint(uint256 agentId, bytes32 dataHash) external nonReentrant returns (uint256) {
        uint256 tokenId = ++_tokenIdCounter;
        _safeMint(msg.sender, tokenId);
        tokenAgentId[tokenId] = agentId;
        tokenDataHash[tokenId] = dataHash;
        emit AgentMinted(tokenId, agentId, msg.sender, dataHash);
        return tokenId;
    }

    function updateDataHash(uint256 tokenId, bytes32 newHash) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        tokenDataHash[tokenId] = newHash;
        emit DataHashUpdated(tokenId, newHash);
    }
}
