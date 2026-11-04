import { expect } from "chai";
import { ethers } from "hardhat";

describe("WatchTrace business workflow", function () {
  let acl: any;
  let registry: any;
  let ownership: any;
  let warranty: any;
  let watchNft: any;
  let admin: any;
  let manufacturer: any;
  let serviceCenter: any;
  let owner: any;
  let nextOwner: any;
  let outsider: any;

  beforeEach(async function () {
    [admin, manufacturer, serviceCenter, owner, nextOwner, outsider] =
      await ethers.getSigners();

    acl = await ethers.deployContract("AccessControlRoles");
    await acl.waitForDeployment();

    await acl.addRole(await acl.MANUFACTURER_ROLE(), manufacturer.address);
    await acl.addRole(await acl.SERVICE_CENTER_ROLE(), serviceCenter.address);

    registry = await ethers.deployContract("ProductRegistry", [
      await acl.getAddress(),
    ]);
    ownership = await ethers.deployContract("OwnershipManager", [
      await acl.getAddress(),
    ]);
    warranty = await ethers.deployContract("WarrantyManager", [
      await acl.getAddress(),
      await ownership.getAddress(),
    ]);
    watchNft = await ethers.deployContract("WatchNFT", [
      await acl.getAddress(),
    ]);

    await Promise.all([
      registry.waitForDeployment(),
      ownership.waitForDeployment(),
      warranty.waitForDeployment(),
      watchNft.waitForDeployment(),
    ]);
  });

  async function registerProduct() {
    await expect(
      registry
        .connect(manufacturer)
        .registerProduct("WT-2026-0001", "Chronograph X"),
    )
      .to.emit(registry, "ProductRegistered")
      .withArgs(1n, manufacturer.address);
    return 1n;
  }

  it("runs registration, ownership, warranty, approval, and NFT minting", async function () {
    const productId = await registerProduct();

    await expect(
      ownership
        .connect(manufacturer)
        .initializeOwnership(productId, owner.address),
    )
      .to.emit(ownership, "OwnershipTransferred")
      .withArgs(productId, ethers.ZeroAddress, owner.address);

    await warranty.connect(manufacturer).issueWarranty(productId, 365, 2);
    await warranty.connect(owner).requestWarranty(productId);

    await expect(
      warranty.connect(serviceCenter).approveWarranty(productId, 0),
    )
      .to.emit(warranty, "WarrantyApproved")
      .withArgs(productId, serviceCenter.address);

    const warrantyState = await warranty.getWarranty(productId);
    expect(warrantyState.claimCount).to.equal(1n);
    expect(warrantyState.active).to.equal(true);

    await expect(
      watchNft.connect(manufacturer).mintForProduct(productId, owner.address),
    )
      .to.emit(watchNft, "WatchMinted")
      .withArgs(productId, 1n, owner.address);
    expect(await watchNft.ownerOf(1n)).to.equal(owner.address);
  });

  it("enforces manufacturer and service-center roles", async function () {
    await expect(
      registry
        .connect(outsider)
        .registerProduct("UNAUTHORISED", "Unknown"),
    ).to.be.revertedWith("Not manufacturer");

    const productId = await registerProduct();
    await ownership
      .connect(manufacturer)
      .initializeOwnership(productId, owner.address);
    await warranty.connect(manufacturer).issueWarranty(productId, 30, 1);
    await warranty.connect(owner).requestWarranty(productId);

    await expect(
      warranty.connect(outsider).approveWarranty(productId, 0),
    ).to.be.revertedWith("Not service center");
  });

  it("moves warranty authority with the current on-chain owner", async function () {
    const productId = await registerProduct();
    await ownership
      .connect(manufacturer)
      .initializeOwnership(productId, owner.address);
    await warranty.connect(manufacturer).issueWarranty(productId, 30, 2);

    await ownership.connect(owner).transferOwnership(productId, nextOwner.address);

    await expect(
      warranty.connect(owner).requestWarranty(productId),
    ).to.be.revertedWith("Not current owner");

    await expect(warranty.connect(nextOwner).requestWarranty(productId))
      .to.emit(warranty, "WarrantyRequested")
      .withArgs(productId, nextOwner.address);
  });

  it("stops further claims at the configured limit and prevents duplicate NFTs", async function () {
    const productId = await registerProduct();
    await ownership
      .connect(manufacturer)
      .initializeOwnership(productId, owner.address);
    await warranty.connect(manufacturer).issueWarranty(productId, 30, 1);

    await warranty.connect(owner).requestWarranty(productId);
    await warranty.connect(serviceCenter).approveWarranty(productId, 0);

    expect((await warranty.getWarranty(productId)).active).to.equal(false);
    await expect(
      warranty.connect(owner).requestWarranty(productId),
    ).to.be.revertedWith("No active warranty");

    await watchNft
      .connect(manufacturer)
      .mintForProduct(productId, owner.address);
    await expect(
      watchNft
        .connect(manufacturer)
        .mintForProduct(productId, nextOwner.address),
    ).to.be.revertedWith("Already minted");
  });
});
