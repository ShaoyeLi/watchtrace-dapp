import { ethers } from "hardhat";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔧 开始初始化合约（模拟真实多角色场景）...\n");

  // 读取部署的合约地址
  if (!fs.existsSync("deployed-addresses.json")) {
    console.error("❌ 找不到 deployed-addresses.json 文件");
    console.error(
      "请先运行部署脚本（本地示例: npx hardhat run scripts/deploy.ts --network localhost）"
    );
    process.exit(1);
  }

  const addresses = JSON.parse(
    fs.readFileSync("deployed-addresses.json", "utf8")
  );

  // 读取环境变量中的目标地址
  const manufacturerAddress = process.env.MANUFACTURER_ADDRESS;
  const serviceCenterAddress = process.env.SERVICE_CENTER_ADDRESS;

  if (!manufacturerAddress || !serviceCenterAddress) {
    console.error("❌ 环境变量未配置完整：需要 MANUFACTURER_ADDRESS 和 SERVICE_CENTER_ADDRESS");
    process.exit(1);
  }

  // 使用当前网络配置的第一个 signer 作为管理员（通常是 PRIVATE_KEY 对应的地址）
  const [admin] = await ethers.getSigners();

  console.log("账户与角色分配（请在终端记下，用于对应 MetaMask）：");
  console.log("👑 管理员 (DEFAULT_ADMIN_ROLE):", admin.address);
  console.log("🏭 制造商 (MANUFACTURER_ROLE):", manufacturerAddress);
  console.log("🛠 服务中心 (SERVICE_CENTER_ROLE):", serviceCenterAddress, "\n");

  console.log("使用的 AccessControlRoles 合约地址:", addresses.AccessControlRoles, "\n");

  // 使用管理员账户连接到 AccessControlRoles（管理员拥有 DEFAULT_ADMIN_ROLE）
  const acl = await ethers.getContractAt(
    "AccessControlRoles",
    addresses.AccessControlRoles,
    admin
  );

  // 获取角色哈希
  const MANUFACTURER_ROLE = await acl.MANUFACTURER_ROLE();
  const SERVICE_CENTER_ROLE = await acl.SERVICE_CENTER_ROLE();

  console.log("角色哈希值:");
  console.log("MANUFACTURER_ROLE:", MANUFACTURER_ROLE);
  console.log("SERVICE_CENTER_ROLE:", SERVICE_CENTER_ROLE);
  console.log();

  console.log("📝 管理员开始给不同账户分配角色...\n");

  try {
    // 制造商
    const tx1 = await acl.addRole(MANUFACTURER_ROLE, manufacturerAddress);
    await tx1.wait();
    console.log("✅ 制造商角色已分配给:", manufacturerAddress);

    // 服务中心
    const tx2 = await acl.addRole(SERVICE_CENTER_ROLE, serviceCenterAddress);
    await tx2.wait();
    console.log("✅ 服务中心角色已分配给:", serviceCenterAddress);

    console.log("\n🎉 初始化完成!");
    console.log("👉 建议在 MetaMask 中按上面地址重命名钱包：");
    console.log("   如：Admin / Manufacturer / ServiceCenter / User");
    console.log("   注意：普通用户/持表人不需要链上角色，任何地址都可以使用“概览与验真”和“我的手表”。");
  } catch (error: any) {
    console.error("❌ 初始化失败:");
    console.error(error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
