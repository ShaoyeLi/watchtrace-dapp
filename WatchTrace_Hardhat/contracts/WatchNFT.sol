// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./AccessControlRoles.sol";

contract WatchNFT is ERC721 {
    AccessControlRoles public acl;

    uint256 public nextTokenId = 1;
    mapping(uint256 => uint256) public productToToken;

    event WatchMinted(uint256 indexed productId, uint256 indexed tokenId, address indexed owner);

    constructor(address _acl) ERC721("WatchCertificate", "WCH") {
        require(_acl != address(0), "Invalid ACL");
        acl = AccessControlRoles(_acl);
    }

    modifier onlyManufacturer() {
        bytes32 role = acl.MANUFACTURER_ROLE();
        require(acl.hasRole(role, msg.sender), "Not manufacturer");
        _;
    }

    function mintForProduct(uint256 productId, address to) external onlyManufacturer returns (uint256) {
        require(productToToken[productId] == 0, "Already minted");

        uint256 tokenId = nextTokenId++;
        productToToken[productId] = tokenId;

        _safeMint(to, tokenId);
        emit WatchMinted(productId, tokenId, to);

        return tokenId;
    }
}
