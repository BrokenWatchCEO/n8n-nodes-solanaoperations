# ![Solana Logo](https://solana.com/src/img/branding/solanaVerticalLogo.svg)

# n8n-nodes-solanaoperations

This is an n8n community node. It lets you interact with the Solana blockchain directly from your n8n workflows.

Solana is a high-performance blockchain platform known for fast and low-cost transactions. This node enables seamless interaction with Solana’s core features such as wallet creation, sending SOL or tokens, checking balances, staking, and cryptographic operations.

---

## 💜 Support Development

If you like this node and want to support its continued development, you can donate to the following addresses:

- **SOL:** `9XSkMzfD6FapMwcCYzfyZSjQ1R3bjpUB4txLm2DPco8P`  
- **ETH:** `0x439AbA3e33a9FBf9b41954724248E6965C459a68`  
- **BTC:** `bc1qd04tgjdt0mmhj0ev2cgzrjear5mvkpvp9mfl5h`

Thank you! 🙏

---

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)  

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

```bash
npm install n8n-nodes-solanaoperations
```

Then restart your n8n instance.

---

## Operations

This node currently supports the following operations:

- ✅ **Send SOL** – Transfer native SOL tokens to another wallet  
- ✅ **Send Token** – Transfer SPL tokens to another address  
- ✅ **Get Balance** – Check SOL balance of an address  
- ✅ **Get Token Balance** – Retrieve the SPL token balance  
- ✅ **Get Multiple Token Balances** – Check multiple token balances in one go  
- ✅ **Get Transaction Details** – Fetch information of a specific transaction  
- ✅ **Get Account Info** – Inspect raw Solana account data  
- ✅ **Create Wallet** – Generate a new keypair (public/private)  
- ✅ **Sign Message** – Cryptographically sign messages using your wallet  
- ✅ **Verify Signature** – Verify if a signature is valid  
- ✅ **Stake SOL** – Create a stake account and delegate SOL to a validator  
- ✅ **Withdraw Stake** – Withdraw staked SOL from a stake account  

**Bonus**  
A special option is included for **donating 1% of the transaction amount to the dev team**. This is enabled by default on `Send SOL` operations, but users can disable it as needed.

---

## Credentials

This node uses a custom credential type named **Solana API**, requiring:

- **Private Key** – A base58-encoded private key (do not share!)
- **RPC URL** – The Solana cluster URL (e.g., https://api.mainnet-beta.solana.com)

Make sure your wallet is funded and the RPC is reachable.

---

## Compatibility

- ✅ Tested on n8n `1.83.2` (self-hosted)  
- ✅ Compatible with Mainnet, Devnet, and Testnet  
- ⚠️ No additional external API integrations required  

---

## Usage

You can use this node to:

- Automate token transfers for on-chain payments  
- Build NFT or DeFi workflows  
- Monitor balances or stake SOL  
- Sign and verify messages for authentication or off-chain operations  

Great for Solana-based dApps or backend workflows needing secure wallet interactions.

---

## Resources

* [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Solana Developer Docs](https://solana.com/developers)
* [Solana JSON-RPC Reference](https://docs.solana.com/developing/clients/jsonrpc-api)

---

## Version history

| Version | Changes |
|--------|---------|
| 0.1.0  | Initial release: SOL + token transfers, staking, balances, wallet ops, message signing, and donation feature |
