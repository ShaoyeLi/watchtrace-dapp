import { ethers } from "hardhat";

async function main() {
  console.log("🚀 开始部署合约...\n");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH\n");

  // 1. 部署 AccessControlRoles
  console.log("📝 部署 AccessControlRoles...");
  const AccessControlRoles = await ethers.getContractFactory("AccessControlRoles");
  const acl = await AccessControlRoles.deploy();
  await acl.waitForDeployment();
  const aclAddress = await acl.getAddress();
  console.log("✅ AccessControlRoles 部署成功:", aclAddress, "\n");

  // 2. 部署 ProductRegistry
  console.log("📝 部署 ProductRegistry...");
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = await ProductRegistry.deploy(aclAddress);
  await productRegistry.waitForDeployment();
  const productRegistryAddress = await productRegistry.getAddress();
  console.log("✅ ProductRegistry 部署成功:", productRegistryAddress, "\n");

  // 3. 部署 OwnershipManager
  console.log("📝 部署 OwnershipManager...");
  const OwnershipManager = await ethers.getContractFactory("OwnershipManager");
  const ownershipManager = await OwnershipManager.deploy(aclAddress);
  await ownershipManager.waitForDeployment();
  const ownershipManagerAddress = await ownershipManager.getAddress();
  console.log("✅ OwnershipManager 部署成功:", ownershipManagerAddress, "\n");

  // 4. 部署 WarrantyManager（依赖 OwnershipManager，用于校验当前所有者）
  console.log("📝 部署 WarrantyManager...");
  const WarrantyManager = await ethers.getContractFactory("WarrantyManager");
  const warrantyManager = await WarrantyManager.deploy(aclAddress, ownershipManagerAddress);
  await warrantyManager.waitForDeployment();
  const warrantyManagerAddress = await warrantyManager.getAddress();
  console.log("✅ WarrantyManager 部署成功:", warrantyManagerAddress, "\n");

  // 5. 部署 WatchNFT（基于权限合约，允许具有制造商角色的账户铸造）
  console.log("📝 部署 WatchNFT...");
  const WatchNFT = await ethers.getContractFactory("WatchNFT");
  const watchNFT = await WatchNFT.deploy(aclAddress);
  await watchNFT.waitForDeployment();
  const watchNFTAddress = await watchNFT.getAddress();
  console.log("✅ WatchNFT 部署成功:", watchNFTAddress, "\n");

  // 打印所有合约地址
  console.log("=".repeat(60));
  console.log("🎉 所有合约部署完成!");
  console.log("=".repeat(60));
  console.log("AccessControlRoles:", aclAddress);
  console.log("ProductRegistry:", productRegistryAddress);
  console.log("OwnershipManager:", ownershipManagerAddress);
  console.log("WarrantyManager:", warrantyManagerAddress);
  console.log("WatchNFT:", watchNFTAddress);
  console.log("=".repeat(60));

  // 保存地址到文件
  const fs = require('fs');
  const addresses = {
    AccessControlRoles: aclAddress,
    ProductRegistry: productRegistryAddress,
    OwnershipManager: ownershipManagerAddress,
    WarrantyManager: warrantyManagerAddress,
    WatchNFT: watchNFTAddress,
    deployer: deployer.address,
    network: "sepolia",
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'deployed-addresses.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n💾 合约地址已保存到 deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:");
    console.error(error);
    process.exit(1);
  });
