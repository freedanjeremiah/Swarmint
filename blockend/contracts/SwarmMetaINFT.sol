// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice The Swarmint novel primitive. A swarm is a meta-iNFT that references its member
/// AgentINFT token IDs and anchors the deliberation record (Merkle root of the full
/// per-agent recommendation/dissent/attestation bundle stored on 0G Storage Log).
contract SwarmMetaINFT is ERC721, ReentrancyGuard {
    uint256 private _tokenIdCounter;

    enum SwarmStatus { Active, Paused, Inactive }

    struct SwarmData {
        string threadId;
        uint256[] memberTokenIds;
        bytes32 deliberationRoot;
        uint256 createdAt;
        SwarmStatus status;
    }

    mapping(uint256 => SwarmData) public swarms;
    mapping(address => uint256[]) private _userSwarms;

    event SwarmComposed(uint256 indexed swarmTokenId, address indexed owner, uint256[] memberTokenIds, bytes32 deliberationRoot);
    event DeliberationRootUpdated(uint256 indexed swarmTokenId, bytes32 newRoot);
    event SwarmStatusUpdated(uint256 indexed swarmTokenId, SwarmStatus status);

    constructor() ERC721("Swarmint Meta", "SMETA") {}

    function compose(
        string calldata threadId,
        uint256[] calldata memberTokenIds,
        bytes32 deliberationRoot
    ) external nonReentrant returns (uint256) {
        require(memberTokenIds.length >= 2, "Need at least 2 agents");
        uint256 tokenId = ++_tokenIdCounter;
        _safeMint(msg.sender, tokenId);
        swarms[tokenId] = SwarmData({
            threadId: threadId,
            memberTokenIds: memberTokenIds,
            deliberationRoot: deliberationRoot,
            createdAt: block.timestamp,
            status: SwarmStatus.Active
        });
        _userSwarms[msg.sender].push(tokenId);
        emit SwarmComposed(tokenId, msg.sender, memberTokenIds, deliberationRoot);
        return tokenId;
    }

    function updateDeliberationRoot(uint256 swarmTokenId, bytes32 newRoot) external {
        require(ownerOf(swarmTokenId) == msg.sender, "Not token owner");
        swarms[swarmTokenId].deliberationRoot = newRoot;
        emit DeliberationRootUpdated(swarmTokenId, newRoot);
    }

    function getSwarmMembers(uint256 swarmTokenId) external view returns (uint256[] memory) {
        return swarms[swarmTokenId].memberTokenIds;
    }

    function getUserSwarms(address user) external view returns (uint256[] memory) {
        return _userSwarms[user];
    }

    function updateSwarmStatus(uint256 swarmTokenId, SwarmStatus newStatus) external {
        require(ownerOf(swarmTokenId) == msg.sender, "Not token owner");
        swarms[swarmTokenId].status = newStatus;
        emit SwarmStatusUpdated(swarmTokenId, newStatus);
    }
}
