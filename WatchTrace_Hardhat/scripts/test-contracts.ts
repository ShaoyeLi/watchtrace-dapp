import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🧪 开始测试合约功能...\n");

  // 读取部署的合约地址
  if (!fs.existsSync('deployed-addresses.json')) {
    console.error("❌ 找不到 deployed-addresses.json");
    console.error("请先运行部署和初始化脚本");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync('deployed-addresses.json', 'utf8'));
  const [deployer] = await ethers.getSigners();

  console.log("测试账户:", deployer.address, "\n");

  // 连接到合约
  const productRegistry = await ethers.getContractAt("ProductRegistry", addresses.ProductRegistry);
  const ownershipManager = await ethers.getContractAt("OwnershipManager", addresses.OwnershipManager);
  const warrantyManager = await ethers.getContractAt("WarrantyManager", addresses.WarrantyManager);
  const watchNFT = await ethers.getContractAt("WatchNFT", addresses.WatchNFT);

  try {
    // 测试1: 注册产品
    console.log("📝 测试1: 注册新手表产品");
    const tx1 = await productRegistry.registerProduct("SN-2024-001", "Rolex Submariner");
    const receipt1 = await tx1.wait();
    console.log("✅ 产品注册成功! 交易哈希:", receipt1?.hash);
    
    // 获取产品ID (从事件中读取)
    const productId = 1; // 第一个产品
    const product = await productRegistry.getProduct(productId);
    console.log("产品信息:", {
      序列号: product.serialNumber,
      型号: product.model,
      制造商: product.manufacturer
    });
    console.log();

    // 测试2: 初始化所有权
    console.log("📝 测试2: 初始化产品所有权");
    const tx2 = await ownershipManager.initializeOwnership(productId, deployer.address);
    await tx2.wait();
    console.log("✅ 所有权初始化成功!");
    const owner = await ownershipManager.currentOwner(productId);
    console.log("当前所有者:", owner);
    console.log();

    // 测试3: 发行保修
    console.log("📝 测试3: 发行保修 (2年期,最多3次理赔)");
    const tx3 = await warrantyManager.issueWarranty(productId, 730, 3); // 730天 = 2年
    await tx3.wait();
    console.log("✅ 保修发行成功!");
    const warranty = await warrantyManager.getWarranty(productId);
    console.log("保修信息:", {
      开始日期: new Date(Number(warranty.startDate) * 1000).toLocaleDateString(),
      过期日期: new Date(Number(warranty.expirationDate) * 1000).toLocaleDateString(),
      最大理赔次数: warranty.maxClaims.toString(),
      已理赔次数: warranty.claimCount.toString(),
      是否有效: warranty.active
    });
    console.log();

    // 测试4: 铸造NFT
    console.log("📝 测试4: 为产品铸造NFT证书");
    const tx4 = await watchNFT.mintForProduct(productId, deployer.address);
    await tx4.wait();
    console.log("✅ NFT铸造成功!");
    const tokenId = await watchNFT.productToToken(productId);
    const nftOwner = await watchNFT.ownerOf(tokenId);
    console.log("NFT信息:", {
      TokenID: tokenId.toString(),
      所有者: nftOwner
    });
    console.log();

    // 测试5: 申请保修
    console.log("📝 测试5: 申请保修服务");
    const tx5 = await warrantyManager.requestWarranty(productId);
    await tx5.wait();
    console.log("✅ 保修申请成功!");
    const requests = await warrantyManager.getWarrantyRequests(productId);
    console.log("保修申请记录数:", requests.length);
    console.log();

    console.log("=".repeat(60));
    console.log("🎉 所有测试完成!");
    console.log("=".repeat(60));
    console.log("总结:");
    console.log("- 成功注册产品");
    console.log("- 成功设置所有权");
    console.log("- 成功发行保修");
    console.log("- 成功铸造NFT");
    console.log("- 成功申请保修");
    console.log("=".repeat(60));

  } catch (error: any) {
    console.error("\n❌ 测试失败:");
    console.error(error.message);
    if (error.message.includes("Not manufacturer")) {
      console.error("\n💡 提示: 请先运行初始化脚本分配角色");
      console.error("命令: npx hardhat run scripts/initialize.ts --network sepolia");
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
