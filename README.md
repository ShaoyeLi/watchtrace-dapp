# WatchTrace – Watch Provenance, Warranty & NFT Certificates

> Demo test account (Sepolia only)  
> A dedicated test account is provided so you can immediately experience the dApp without setting up your own data.  
> Private key: `50a1978d6fca900d0ea122307860b26b33f8eb8fb57d68fb66975d75e1834a05`  
> Please import this key **only on the Sepolia testnet**, never on mainnet or any wallet holding real funds.
>
> After importing the account and connecting your wallet to the dApp on Sepolia, you will see two sample watches under “My Watches”:  
> - An Apple Watch: warranty duration 730 days, already serviced once, with an NFT certificate minted;  
> - A Patek Philippe: not yet serviced, but ownership has been transferred once; you can use the Overview view to search by product ID and inspect full trace details.  
> Feel free to interact with these watches (request service, transfer ownership, etc.) to explore the full workflow.

**Live Demo (front‑end on Vercel)**: https://watchtrace-dapp.vercel.app/

> A full‑stack demo dApp for luxury watch anti‑counterfeiting, provenance tracking and on‑chain warranty, built on Ethereum (Hardhat) with a static front‑end and MetaMask.

## 1. Overview

This project turns a physical watch into an on‑chain asset with:

- **Product registry** – immutable factory record (serial number, model, manufacturer, timestamp);
- **On‑chain ownership** – current owner + full transfer history;
- **Warranty lifecycle** – issuance, claims, approvals, and usage limits;
- **NFT certificate** – an ERC‑721 token bound to a specific watch as a digital warranty card.

The system is designed around three main roles:

- **Manufacturer** – registers watches, initializes ownership, issues warranty, mints NFT certificates;
- **Service Center** – reviews and approves warranty claims;
- **End users / Watch holders** – own watches, submit warranty claims, transfer ownership and NFTs.

Everyone (including guests) can verify authenticity and history via the public “Overview & Verification” view.

## 2. Architecture

### 2.1 Smart contracts

Located in `WatchTrace_Hardhat/contracts`:

- `AccessControlRoles.sol` – central role management using OpenZeppelin’s `AccessControl`:
  - `DEFAULT_ADMIN_ROLE` – admin, can grant/revoke roles;
  - `MANUFACTURER_ROLE` – allowed to register products, initialize ownership, issue warranty, mint NFTs;
  - `SERVICE_CENTER_ROLE` – allowed to approve warranty claims.
- `ProductRegistry.sol` – immutable product registry:
  - Stores `productId`, `serialNumber`, `model`, `manufacturer`, `manufactureTimestamp`.
- `OwnershipManager.sol` – tracks ownership:
  - `initializeOwnership(productId, owner)`, `transferOwnership(productId, to)`,
  - `currentOwner(productId)` and `getOwnershipHistory(productId)`.
- `WarrantyManager.sol` – manages on‑chain warranty:
  - Issuance by manufacturer (`issueWarranty`);
  - Every claim must come from the **current on‑chain owner**:

    ```solidity
    require(ownershipManager.currentOwner(productId) == msg.sender, "Not current owner");
    ```

  - Claims are approved by addresses with `SERVICE_CENTER_ROLE`.
- `WatchNFT.sol` – ERC‑721 certificate:
  - `mintForProduct(productId, to)` mints exactly one NFT per product;
  - `productToToken(productId)` binds a watch to a tokenId.

### 2.2 Front‑end views

The front‑end is in `fronted/index-improved.html` and provides four conceptual views:

- **Overview & Verification** (public)
  - Query product info, warranty status, ownership history and NFT owner;
  - “Product Trace & Risk Assessment” card that aggregates data from all contracts and computes a 0‑100 risk score based on transfer count, warranty usage and expiry.
- **Manufacturer Console** (manufacturer/admin only)
  - Dashboard with:
    - total registered products,
    - number of products with warranties / active warranties,
    - number of products with minted NFT certificates (via `productToToken`).
  - Actions: register product, initialize ownership, issue warranty, mint NFT.
- **My Watches** (end user / holder)
  - Shows all watches where `currentOwner(productId) == connected wallet`;
  - Indicates warranty status per watch;
  - Actions: submit warranty claim, transfer ownership, transfer NFT.
- **Service Center Console** (service center/admin)
  - Warranty queue with SLA metrics:
    - pending claim count;
    - average waiting time;
    - maximum waiting time;
  - Per‑request cards with productId, index, requester and timestamp, with one‑click approval.

MetaMask is used for connection and transaction signing; roles are inferred on the front‑end from `AccessControlRoles.hasRole`.

## 3. Security Considerations

- **Role‑based access control** – all privileged functions are protected by `AccessControlRoles`:
  - Only manufacturers can modify product, ownership initialization, warranty issuance and NFT minting;
  - Only service centers can approve warranty claims;
  - Admin is used sparingly, mainly for role management.
- **Warranty abuse prevention** – warranty claims are restricted to the current owner of the product, preventing attackers from draining someone else’s warranty just by knowing a productId.
- **Separation of concerns** – product, ownership, warranty and NFT are separate contracts, making it easier to upgrade one component without touching others.

## 4. Installation, Local Setup & Going Live

### 4.1 Prerequisites

- Node.js LTS;
- MetaMask browser extension.

### 4.2 Install dependencies & compile

From the repository root:

```bash
cd WatchTrace_Hardhat
npm install
npx hardhat compile
```

### 4.3 Environment variables

In `WatchTrace_Hardhat/.env` configure:

- `INFURA_API_KEY` – for Sepolia RPC (testnet deployment);
- `PRIVATE_KEY` – admin / deployer private key (used for both deploy and role initialization);
- `MANUFACTURER_ADDRESS` – wallet address that should receive `MANUFACTURER_ROLE` (no private key needed here);
- `SERVICE_CENTER_ADDRESS` – wallet address that should receive `SERVICE_CENTER_ROLE`.

> On localhost, `PRIVATE_KEY` can be one of the accounts printed by `npx hardhat node`.  
> On Sepolia, use a funded testnet account and **never commit this file**.

### 4.4 Run a local Hardhat node

In a new terminal:

```bash
cd WatchTrace_Hardhat
npx hardhat node
```

Keep this terminal open; it prints 20 funded test accounts and private keys.

### 4.5 Deploy contracts & initialize roles (localhost)

In another terminal:

```bash
cd WatchTrace_Hardhat
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/initialize.ts --network localhost
```

The initialize script will:

- use `PRIVATE_KEY` (or the first local signer) as admin;
- grant `MANUFACTURER_ROLE` to `MANUFACTURER_ADDRESS`;
- grant `SERVICE_CENTER_ROLE` to `SERVICE_CENTER_ADDRESS`.

Import those addresses into MetaMask to test different role views.

### 4.6 Run the front‑end locally

The current front‑end lives in `WatchTraceFronte` and is powered by Vite + React.

```bash
cd WatchTraceFronte
npm install
npm run dev
```

Connect MetaMask to the local Hardhat network (`http://127.0.0.1:8545`, chain id `31337`) and test:

- `MANUFACTURER_ADDRESS` → Manufacturer view;
- `SERVICE_CENTER_ADDRESS` → Service Center view;
- any other address → My Watches + Overview.

### 4.7 From zero to an online demo (GitHub + Vercel)

This section describes how to turn the project into a public demo so others (e.g. interviewers) can open a URL and use the dApp directly.

**1. Push the project to GitHub**

Assuming the project root is `WatchTrace`:

```bash
cd /Users/Truth/Downloads/300学习/370项目/HardHat/WatchTrace

git init
git add .
git commit -m "Initial WatchTrace project"
git branch -M main
git remote add origin https://github.com/<your-username>/watchtrace-dapp.git
git push -u origin main
```

After pushing, the GitHub repo should contain both `WatchTrace_Hardhat` and `WatchTraceFronte`.

**2. First-time deployment to Vercel**

1. Go to `https://vercel.com` and log in with your GitHub account.  
2. Click `New Project` → select the GitHub repository you just created.  
3. In the project settings:
   - **Root Directory**: `WatchTraceFronte`
   - **Framework Preset**: `Vite` (usually auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click `Deploy`. After the build finishes, Vercel will give you a URL like `https://your-project.vercel.app`. This is the public demo link.

> Vercel does **not** run `npm run dev` in production. It runs `npm run build` once and serves the static files from the `dist` directory via CDN.

**3. Updating the online version**

After you change front-end code, just commit and push to GitHub:

```bash
cd /Users/Truth/Downloads/300学习/370项目/HardHat/WatchTrace
git add .
git commit -m "Update front-end"
git push
```

Vercel automatically detects new commits, rebuilds, and redeploys. The same `*.vercel.app` URL always points to the latest version—no extra `npm run deploy` is required.

**4. How others can use the demo**

In this `README.md`, you can add a small “Live Demo” note (without personal info), for example:

- Live demo: `https://your-project.vercel.app`  
- Network: `Sepolia` testnet  
- Usage:
  1. Install MetaMask and switch to the Sepolia network.
  2. Open the URL and click “Connect Wallet”.
  3. Any address can use Overview / My Watches; addresses that have been granted `MANUFACTURER_ROLE` or `SERVICE_CENTER_ROLE` will see the Manufacturer / Service Center views.

Optionally you can prepare a Sepolia-only demo account (never used on mainnet) to make testing easier, but that is not required.

## 5. English Documentation vs. Original Chinese Docs

This README is an English high‑level summary of:

- the system design;
- how to run and interact with the project;
- why it’s relevant for your portfolio.

For more detailed step‑by‑step instructions and Chinese explanations, see `手表溯源开发文档.md` in the repository root.

## 6. Main Contributions (for portfolio use)

This project is primarily the work of a single contributor, with responsibilities including:

- Designing and implementing all Solidity contracts (access control, product registry, ownership, warranty, NFT) and Hardhat deployment / initialization scripts;
- Building the role‑aware front‑end dApp, including the Manufacturer / Holder / Service Center views and their interactions with the contracts via ethers.js;
- Implementing the data‑driven dashboards:
  - manufacturer overview (products, warranties, NFTs),
  - service‑center warranty queue with SLA metrics,
  - per‑product trace & risk visualisation (timeline + risk score);
- Writing the system design report and developer documentation (Chinese and English) and preparing slides / demos for presentation.

These points can be reused directly in a CV under a “Selected Projects” section.
