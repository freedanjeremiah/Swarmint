// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Maps agent archetype IDs (1-based) to their minted AgentINFT token IDs.
contract AgentRegistry is Ownable {
    mapping(uint256 => uint256) private _agentToToken;

    event AgentRegistered(uint256 indexed agentId, uint256 indexed tokenId);

    constructor() Ownable(msg.sender) {}

    function register(uint256 agentId, uint256 tokenId) external onlyOwner {
        _agentToToken[agentId] = tokenId;
        emit AgentRegistered(agentId, tokenId);
    }

    function getTokenId(uint256 agentId) external view returns (uint256) {
        return _agentToToken[agentId];
    }
}
