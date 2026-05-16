// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentINFT {
    function ownerOf(uint256 tokenId) external view returns (address);
}

/// @notice Maps agent archetype IDs to minted AgentINFT token IDs.
/// Any AgentINFT token owner can self-register their token for an archetype.
contract AgentRegistry {
    IAgentINFT public immutable agentNft;
    mapping(uint256 => uint256) private _agentToToken;

    event AgentRegistered(uint256 indexed agentId, uint256 indexed tokenId, address indexed owner);

    constructor(address agentNftAddress) {
        agentNft = IAgentINFT(agentNftAddress);
    }

    function register(uint256 agentId, uint256 tokenId) external {
        require(agentNft.ownerOf(tokenId) == msg.sender, "Not token owner");
        _agentToToken[agentId] = tokenId;
        emit AgentRegistered(agentId, tokenId, msg.sender);
    }

    function getTokenId(uint256 agentId) external view returns (uint256) {
        return _agentToToken[agentId];
    }
}
