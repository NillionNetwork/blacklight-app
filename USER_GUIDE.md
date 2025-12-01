# nilAV Node Manager - User Guide

## What is this app?

The nilAV Node Manager helps you set up and manage verifier nodes for the Nillion network. By running a verifier node, you contribute to the Blind Computer and earn NIL token rewards.

---

## Quick Start Guide

### 1. Connect Your Wallet
**Page:** Landing Page (`/`)

**What you'll see:**
- "Manage your verifier node" heading
- "Set up nilAV" button
- "My Nodes" button (if you're logged in)

**What to do:**
1. Click **"Set up nilAV"**
2. Connect your wallet (MetaMask, Rainbow, Coinbase Wallet, etc.)
3. Sign the authentication message

**Why:** Your wallet identifies you as the node owner and receives all rewards

---

### 2. Set Up Your Node
**Page:** Node Setup (`/setup`)

This is a 5-step process to launch your verifier node:

#### **Step 1 of 5: Select Platform**
- Choose your operating system: **Mac**, **Linux**, or **Windows**
- Click **"Continue"**

**Why:** Different operating systems need different node binaries

---

#### **Step 2 of 5: Download Binary**
- Click **"Download Binary"** to download the node software for your platform
- Save the file to your computer
- Click **"I've Downloaded It"**

**Why:** You need the Nillion verifier node software to run a node

---

#### **Step 3 of 5: Start Node**
- Copy the command shown on screen
- Open your terminal/command prompt
- Paste and run the command
- Your node will start and generate a public key
- Click **"I've run it"**

**Why:** Running this command starts your node and creates a unique identifier (public key)

---

#### **Step 4 of 5: Log Node's Public Key**
- Find the public key in your terminal output (looks like `0x123abc...`)
- Copy and paste it into the input field
- Click **"Continue to Staking"**

**Why:** Your public key identifies your node on the network

---

#### **Step 5 of 5: Stake to your node**
- Enter how much NIL you want to stake (minimum: **1,000 NIL**)
- Use preset buttons (1,000 / 5,000 / 10,000) or **Max** for convenience
- Click **"Stake [amount] NIL"**
- Approve the transaction in your wallet

**Why:** Your node only gets assigned work after you stake. Higher stake may lead to more work assignments and rewards.

**What happens next:**
- Transaction processes on the blockchain
- Success! You're redirected to your node dashboard

---

### 3. View All Your Nodes
**Page:** My Nodes (`/nodes`)

**What you'll see:**
- Grid of all your registered nodes
- Each card shows:
  - Node status (Active / Inactive / Error)
  - Public key (first 20 characters)
  - Registration date

**What to do:**
- Click any node card to view its dashboard

**Why:** Quick overview of all your nodes at a glance

---

### 4. Manage a Node
**Page:** Node Dashboard (`/dashboard?node=0x...`)

**What you'll see:**

#### **Header**
- Node status indicator (Active / Inactive / Error)
- Current public key

#### **Node Info**
- Public key (full)
- Platform (Mac/Linux/Windows)
- Registration date
- Last seen timestamp

#### **Performance Metrics**
- **Uptime** - How often your node is online (%)
- **Total Requests** - Number of verification requests processed
- **Success Rate** - Percentage of successful verifications (%)
- **Total Earnings** - NIL tokens earned
- **Avg Response Time** - How fast your node responds (ms)

#### **Activity Log**
- Recent events (stake changes, status changes, errors)
- Timestamped activity history

#### **Stake Management**
- **"+ Increase Stake"** button - Add more NIL to your node
- **"- Decrease Stake"** button - Remove NIL from your node

**What to do:**
- Monitor your node's performance
- Increase stake to potentially get more work
- Decrease stake if you want to unstake some NIL

---

### 5. Increase Your Stake
**Triggered from:** Dashboard → Click **"+ Increase Stake"**

**What you'll see:**
- Modal with input field
- Current stake amount shown
- Preset buttons (1,000 / 5,000 / 10,000 / Max)

**What to do:**
1. Enter additional amount to stake
2. Click **"Stake [amount] NIL"**
3. Approve transaction in wallet
4. Wait for confirmation

**Why:** Increasing stake may lead to more work assignments and higher earnings

---

### 6. Decrease Your Stake
**Triggered from:** Dashboard → Click **"- Decrease Stake"**

**What you'll see:**
- Modal with input field
- Current stake amount shown
- Warning about minimum stake (if applicable)

**What to do:**
1. Enter amount to unstake
2. Click **"Unstake [amount] NIL"**
3. Approve transaction in wallet
4. Wait for confirmation

**Why:** You can withdraw NIL from your node stake if you need funds or want to reduce your commitment

---

## Navigation

### Top Navigation Bar
- **Nillion logo** - Back to landing page
- **Nodes** - View all your nodes
- **Wallet address** - Shows your connected wallet (shortened)
- **Disconnect** - Log out and disconnect wallet

---

## Common Questions

### What if I want to run multiple nodes?
From any dashboard, click the **Nillion logo** in the top left to go back to the landing page, then click **"Set up nilAV"** again to register another node.

### Can I see all my nodes at once?
Yes! Click **"Nodes"** in the navigation bar or **"My Nodes"** on the landing page.

### What happens if my node goes offline?
Your node status will change to "Inactive" and it won't receive new work assignments. Restart your node software to get back online.

### How do I earn more rewards?
- Keep your node online (high uptime)
- Increase your stake
- Maintain a high success rate
- Respond quickly to verification requests

### What's the minimum stake?
**1,000 NIL** is the minimum amount required to stake to a node.

### Can I unstake all my NIL?
Yes, but your node will stop receiving work assignments if you go below the minimum stake.

---

## Support

For technical issues, smart contract questions, or general support, please reach out to the Nillion team through the official channels.

---

## Technical Requirements

- **Wallet:** MetaMask, Rainbow, Coinbase Wallet, or any WalletConnect-compatible wallet
- **Network:** Base (mainnet) or Base Sepolia (testnet)
- **Tokens:** NIL tokens for staking (minimum 1,000 NIL)
- **Node Requirements:** Computer to run the verifier node binary (Mac, Linux, or Windows)
