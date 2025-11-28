# WatchTrace – Watch Provenance, Warranty & NFT Certificates

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

## 4. Installation & Local Setup

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

## 5. Deploying to GitHub & Making It Recruiter‑Friendly

### 5.1 Repository structure tips

- Keep this repository tidy:
  - Root `README.md` (this file) describing the project and how to run it;
  - `WatchTrace_Hardhat/` for contracts and Hardhat config;
  - `fronted/` for the static front‑end.
- Do **not** commit real `.env` files or private keys. Add them to `.gitignore`.

### 5.2 Let interviewers interact with the dApp

For recruiters, you generally don’t want them to run a local node. Instead:

1. **Deploy contracts to a public testnet** (e.g. Sepolia) with your existing Hardhat scripts.  
2. Update the front‑end addresses to point to the testnet deployment.  
3. Host the front‑end on:
   - GitHub Pages (static hosting), or
   - Vercel / Netlify (also fine for static HTML).
4. In this `README.md`, add a **“Live Demo”** section with:
   - Link to the deployed front‑end;
   - Note “Requires MetaMask + Sepolia testnet; you can test as a guest using the Overview view even without a funded account”.

Optionally, pre‑fund a demo account and put the public address here so interviewers can import it into MetaMask if they wish.

### 5.3 GitHub profile polish (high‑level advice)

On your GitHub profile:

- Add a short **bio**: “Web3 / Full‑stack engineer – Solidity, Hardhat, React, TypeScript”;
- Pin this repository as one of your top projects；
- In the repo description, mention key buzzwords: “Solidity, Hardhat, on‑chain warranty, NFT, role‑based access control, data visualization”.

You can also add a short section in this README called “Why this project?” explaining:

- Real‑world problem it solves (luxury watch authenticity & warranty);
- What you personally implemented (contracts, security logic, front‑end views, data viz, docs).

## 6. English Documentation vs. Original Chinese Docs

This README is an English high‑level summary of:

- the system design;
- how to run and interact with the project;
- why it’s relevant for your portfolio.

For more detailed step‑by‑step instructions and Chinese explanations, see `手表溯源开发文档.md` in the repository root.

## 7. Main Contributions (for portfolio use)

This project is primarily the work of a single contributor, with responsibilities including:

- Designing and implementing all Solidity contracts (access control, product registry, ownership, warranty, NFT) and Hardhat deployment / initialization scripts;
- Building the role‑aware front‑end dApp, including the Manufacturer / Holder / Service Center views and their interactions with the contracts via ethers.js;
- Implementing the data‑driven dashboards:
  - manufacturer overview (products, warranties, NFTs),
  - service‑center warranty queue with SLA metrics,
  - per‑product trace & risk visualisation (timeline + risk score);
- Writing the system design report and developer documentation (Chinese and English) and preparing slides / demos for presentation.

These points can be reused directly in a CV under a “Selected Projects” section.
