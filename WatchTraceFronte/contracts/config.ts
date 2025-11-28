export const ADDRESSES = {
  ACL: "0xe8c01a69e6dB24c7eb6dB6AB33a12E2BC1Ff9382",
  PRODUCT_REGISTRY: "0xb546bBB3a72f3bcaB71845B6cFfc904953C07785",
  OWNERSHIP_MANAGER: "0xad45f26203fA91a89A217660322A1C725D196893",
  WARRANTY_MANAGER: "0x8B8656c512845f2025571D12319774b42E2ba24f",
  WATCH_NFT: "0x8826196EC4355A026850a71AC7Fd3186B2051207",
};

export const ABIS = {
  PRODUCT_REGISTRY: [
    {"inputs":[{"internalType":"address","name":"_acl","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"productId","type":"uint256"},{"indexed":true,"internalType":"address","name":"manufacturer","type":"address"}],"name":"ProductRegistered","type":"event"},
    {"inputs":[],"name":"acl","outputs":[{"internalType":"contract AccessControlRoles","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"productId","type":"uint256"}],"name":"getProduct","outputs":[{"components":[{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"string","name":"serialNumber","type":"string"},{"internalType":"string","name":"model","type":"string"},{"internalType":"address","name":"manufacturer","type":"address"},{"internalType":"uint256","name":"manufactureTimestamp","type":"uint256"}],"internalType":"struct ProductRegistry.Product","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"nextProductId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"string","name":"serialNumber","type":"string"},{"internalType":"string","name":"model","type":"string"}],"name":"registerProduct","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}
  ],
  OWNERSHIP: [
    {"inputs":[{"internalType":"address","name":"_acl","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"productId","type":"uint256"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferred","type":"event"},
    {"inputs":[],"name":"acl","outputs":[{"internalType":"contract AccessControlRoles","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"currentOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"productId","type":"uint256"}],"name":"getOwnershipHistory","outputs":[{"components":[{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"internalType":"struct OwnershipManager.Ownership","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"address","name":"initialOwner","type":"address"}],"name":"initializeOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}
  ],
  WARRANTY: [
    {"inputs":[{"internalType":"address","name":"_acl","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"productId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"expirationDate","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"maxClaims","type":"uint256"}],"name":"WarrantyIssued","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"productId","type":"uint256"},{"indexed":true,"internalType":"address","name":"requester","type":"address"}],"name":"WarrantyRequested","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"productId","type":"uint256"},{"indexed":true,"internalType":"address","name":"serviceCenter","type":"address"}],"name":"WarrantyApproved","type":"event"},
    {"inputs":[],"name":"acl","outputs":[{"internalType":"contract AccessControlRoles","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"uint256","name":"requestIdx","type":"uint256"}],"name":"approveWarranty","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"productId","type":"uint256"}],"name":"getWarranty","outputs":[{"components":[{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"uint256","name":"startDate","type":"uint256"},{"internalType":"uint256","name":"expirationDate","type":"uint256"},{"internalType":"uint256","name":"claimCount","type":"uint256"},{"internalType":"uint256","name":"maxClaims","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"}],"internalType":"struct WarrantyManager.Warranty","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"productId","type":"uint256"}],"name":"getWarrantyRequests","outputs":[{"components":[{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"address","name":"requester","type":"address"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"bool","name":"approved","type":"bool"}],"internalType":"struct WarrantyManager.WarrantyRequest","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"uint256","name":"durationDays","type":"uint256"},{"internalType":"uint256","name":"maxClaims","type":"uint256"}],"name":"issueWarranty","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"productId","type":"uint256"}],"name":"requestWarranty","outputs":[],"stateMutability":"nonpayable","type":"function"}
  ],
  NFT: [
    {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"productId","type":"uint256"},{"internalType":"address","name":"to","type":"address"}],"name":"mintForProduct","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"productId","type":"uint256"}],"name":"productToToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}
  ],
  ACL: [
    {
      "inputs":[
        {"internalType":"bytes32","name":"role","type":"bytes32"},
        {"internalType":"address","name":"account","type":"address"}
      ],
      "name":"hasRole",
      "outputs":[{"internalType":"bool","name":"","type":"bool"}],
      "stateMutability":"view",
      "type":"function"
    }
  ]
};