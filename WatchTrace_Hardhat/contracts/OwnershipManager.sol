// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControlRoles.sol";

contract OwnershipManager {
    AccessControlRoles public acl;

    struct Ownership {
        uint256 productId;
        address owner;
        uint256 timestamp;
    }

    mapping(uint256 => address) public currentOwner;
    mapping(uint256 => Ownership[]) public ownershipHistory;

    event OwnershipTransferred(uint256 indexed productId, address indexed from, address indexed to);

    constructor(address _acl) {
        require(_acl != address(0), "Invalid ACL");
        acl = AccessControlRoles(_acl);
    }

    modifier onlyManufacturer() {
        bytes32 role = acl.MANUFACTURER_ROLE();
        require(acl.hasRole(role, msg.sender), "Not manufacturer");
        _;
    }

    function initializeOwnership(uint256 productId, address owner) external onlyManufacturer {
        require(currentOwner[productId] == address(0), "Already initialized");
        currentOwner[productId] = owner;
        ownershipHistory[productId].push(Ownership(productId, owner, block.timestamp));
        emit OwnershipTransferred(productId, address(0), owner);
    }

    function transferOwnership(uint256 productId, address to) external {
        require(currentOwner[productId] == msg.sender, "Not current owner");
        require(to != address(0), "Invalid address");
        address from = msg.sender;
        currentOwner[productId] = to;
        ownershipHistory[productId].push(Ownership(productId, to, block.timestamp));
        emit OwnershipTransferred(productId, from, to);
    }

    function getOwnershipHistory(uint256 productId) external view returns (Ownership[] memory) {
        return ownershipHistory[productId];
    }
}
