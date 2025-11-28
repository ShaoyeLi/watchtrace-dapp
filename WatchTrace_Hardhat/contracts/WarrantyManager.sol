// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControlRoles.sol";
import "./OwnershipManager.sol";

contract WarrantyManager {
    AccessControlRoles public acl;
    OwnershipManager public ownershipManager;

    struct Warranty {
        uint256 productId;
        uint256 startDate;
        uint256 expirationDate;
        uint256 claimCount;
        uint256 maxClaims;
        bool active;
    }

    mapping(uint256 => Warranty) public warranties;

    struct WarrantyRequest {
        uint256 productId;
        address requester;
        uint256 timestamp;
        bool approved;
    }
    mapping(uint256 => WarrantyRequest[]) public warrantyRequests;

    event WarrantyIssued(uint256 indexed productId, uint256 expirationDate, uint256 maxClaims);
    event WarrantyRequested(uint256 indexed productId, address indexed requester);
    event WarrantyApproved(uint256 indexed productId, address indexed serviceCenter);

    constructor(address _acl, address _ownershipManager) {
        require(_acl != address(0), "Invalid ACL");
        require(_ownershipManager != address(0), "Invalid OwnershipManager");
        acl = AccessControlRoles(_acl);
        ownershipManager = OwnershipManager(_ownershipManager);
    }

    modifier onlyManufacturer() {
        bytes32 role = acl.MANUFACTURER_ROLE();
        require(acl.hasRole(role, msg.sender), "Not manufacturer");
        _;
    }

    modifier onlyServiceCenter() {
        bytes32 role = acl.SERVICE_CENTER_ROLE();
        require(acl.hasRole(role, msg.sender), "Not service center");
        _;
    }

    function issueWarranty(uint256 productId, uint256 durationDays, uint256 maxClaims)
        external
        onlyManufacturer
    {
        require(!warranties[productId].active, "Warranty already issued");
        warranties[productId] = Warranty({
            productId: productId,
            startDate: block.timestamp,
            expirationDate: block.timestamp + durationDays * 1 days,
            claimCount: 0,
            maxClaims: maxClaims,
            active: true
        });
        emit WarrantyIssued(productId, warranties[productId].expirationDate, maxClaims);
    }

    function requestWarranty(uint256 productId) external {
        require(warranties[productId].active, "No active warranty");
        require(block.timestamp <= warranties[productId].expirationDate, "Warranty expired");
        require(warranties[productId].claimCount < warranties[productId].maxClaims, "Claim limit reached");
        // 只有当前登记的所有者可以发起保修申请
        require(ownershipManager.currentOwner(productId) == msg.sender, "Not current owner");
        warrantyRequests[productId].push(WarrantyRequest(productId, msg.sender, block.timestamp, false));
        emit WarrantyRequested(productId, msg.sender);
    }

    function approveWarranty(uint256 productId, uint256 requestIdx) external onlyServiceCenter {
        WarrantyRequest storage req = warrantyRequests[productId][requestIdx];
        require(!req.approved, "Already approved");
        req.approved = true;
        warranties[productId].claimCount += 1;
        if (warranties[productId].claimCount >= warranties[productId].maxClaims) {
            warranties[productId].active = false;
        }
        emit WarrantyApproved(productId, msg.sender);
    }

    function getWarranty(uint256 productId) external view returns (Warranty memory) {
        return warranties[productId];
    }

    function getWarrantyRequests(uint256 productId) external view returns (WarrantyRequest[] memory) {
        return warrantyRequests[productId];
    }
}
