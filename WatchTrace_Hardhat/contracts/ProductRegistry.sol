// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControlRoles.sol";

contract ProductRegistry {
    AccessControlRoles public acl;

    struct Product {
        uint256 productId;
        string serialNumber;
        string model;
        address manufacturer;
        uint256 manufactureTimestamp;
    }

    uint256 public nextProductId = 1;
    mapping(uint256 => Product) public products;

    event ProductRegistered(uint256 indexed productId, address indexed manufacturer);

    constructor(address _acl) {
        require(_acl != address(0), "Invalid ACL");
        acl = AccessControlRoles(_acl);
    }

    modifier onlyManufacturer() {
        bytes32 role = acl.MANUFACTURER_ROLE();
        require(acl.hasRole(role, msg.sender), "Not manufacturer");
        _;
    }

    function registerProduct(string memory serialNumber, string memory model)
        external
        onlyManufacturer
        returns (uint256)
    {
        uint256 productId = nextProductId++;
        products[productId] = Product({
            productId: productId,
            serialNumber: serialNumber,
            model: model,
            manufacturer: msg.sender,
            manufactureTimestamp: block.timestamp
        });
        emit ProductRegistered(productId, msg.sender);
        return productId;
    }

    function getProduct(uint256 productId) external view returns (Product memory) {
        require(products[productId].productId != 0, "Product does not exist");
        return products[productId];
    }
}
