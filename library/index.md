# 资料库（Library）

本资料库用于沉淀原始资料与结构化笔记，便于长期检索与复习。

## 本批资料 1：Cornell Tech · NBAY 5710（SP26）Cryptocurrencies and Blockchains

- **Instructor**: Ari Juels  
- **时间范围**: 2026-01-21 ～ 2026-02-23  
- **内容主线**: 货币与账本抽象 → Bitcoin 设计动机 → 数字签名/哈希 → 共识与 PoW 挖矿 → 挖矿经济与能耗/PoS 对比 → 钱包与密钥管理 → 智能合约与 Gas 市场 → 预言机与可验证随机数（VRF）

## 推荐复习顺序（按“因果链”）

1. **L01**：为什么区块链重要 + 用“货币/账本”框架理解 Bitcoin  
2. **L02-L04**：从中心化账本推导到去中心化（签名、哈希、Sybil、PoW）  
3. **L05-L06**：挖矿产业化、矿池与能耗；PoW vs PoS；托管与密钥管理难题  
4. **L07-L08**：钱包工程细节（助记词、HD、多签、冷热、MPC）→ 智能合约抽象与 Gas  
5. **L09**：预言机为何是 DeFi 基础设施、如何去中心化与抗异常值、VRF

## 本批资料 2：Princeton · Bitcoin and Cryptocurrency Technologies（Textbook）

- **类型**：教材（textbook）  
- **定位**：配合 NBAY 5710 课件使用的“主线参考书 + 细节字典”  
- **总览笔记**：[`Princeton_Bitcoin-Book.md`](./notes/Princeton_Bitcoin-Book.md)  
- **精要笔记（高密度关键词，利于 RAG 命中）**：  
  - [01 · 电子现金与去中心化](./notes/princeton-bitcoin/01-e-cash-decentralization.md)  
  - [02 · UTXO 与交易结构](./notes/princeton-bitcoin/02-utxo-transactions.md)  
  - [03 · 挖矿与激励](./notes/princeton-bitcoin/03-mining-incentives.md)  
  - [04 · 钱包与隐私](./notes/princeton-bitcoin/04-wallets-privacy.md)  
  - [05 · 治理、分叉与替代币](./notes/princeton-bitcoin/05-governance-altcoins.md)

## 目录（原件 + 笔记）

> 说明：原件放在 `raw/`，笔记放在 `notes/`。文件名使用 `L01…L09` 统一编号，方便索引维护。

## 基础知识（建议先读）

- **00 · 基础概念补充**：[`00_Foundations_Blockchain-Basics.md`](./notes/cornell-tech-nbay5710-sp26/00_Foundations_Blockchain-Basics.md)

| 讲次 | 主题关键词 | 原始 PDF | 笔记 |
|---|---|---|---|
| L01 | 动机；货币框架；Bearer vs Registered；PoW+密码学类比 | [raw/L01_Course-Intro_2026-01-21.pdf](./raw/cornell-tech-nbay5710-sp26/L01_Course-Intro_2026-01-21.pdf) | [notes/L01](./notes/cornell-tech-nbay5710-sp26/L01_Course-Intro_2026-01-21.md) |
| L02 | 从中心化账本到区块链抽象；SigCoin/ChainCoin；ECDSA | [raw/L02_BitcoinOverview.pdf](./raw/cornell-tech-nbay5710-sp26/L02_BitcoinOverview.pdf) | [notes/L02](./notes/cornell-tech-nbay5710-sp26/L02_BitcoinOverview.md) |
| L03 | 共识问题；Sybil；PoW 挖矿（哈希老虎机、nonce、前导 0） | [raw/L03_BitcoinOverview-Contd_2026-01-28.pdf](./raw/cornell-tech-nbay5710-sp26/L03_BitcoinOverview-Contd_2026-01-28.pdf) | [notes/L03](./notes/cornell-tech-nbay5710-sp26/L03_BitcoinOverview-Contd_2026-01-28.md) |
| L04 | 练习；发行曲线；钱包/交易生命周期；哈希性质（抗碰撞/不可逆） | [raw/L04_Exercises-Basic-Crypto_2026-02-02.pdf](./raw/cornell-tech-nbay5710-sp26/L04_Exercises-Basic-Crypto_2026-02-02.pdf) | [notes/L04](./notes/cornell-tech-nbay5710-sp26/L04_Exercises-Basic-Crypto_2026-02-02.md) |
| L05 | 哈希在地址/TXID/区块链接/挖矿中的应用；签名复习；ASIC/矿池 | [raw/L05_Basic-Crypto-Bitcoin-Mining_2026-02-04.pdf](./raw/cornell-tech-nbay5710-sp26/L05_Basic-Crypto-Bitcoin-Mining_2026-02-04.pdf) | [notes/L05](./notes/cornell-tech-nbay5710-sp26/L05_Basic-Crypto-Bitcoin-Mining_2026-02-04.md) |
| L06 | 能耗与“绿色挖矿”；PoW vs PoS；伪匿名与可追踪；密钥管理与托管 | [raw/L06_Bitcoin-Mining-Wallets_2026-02-09.pdf](./raw/cornell-tech-nbay5710-sp26/L06_Bitcoin-Mining-Wallets_2026-02-09.pdf) | [notes/L06](./notes/cornell-tech-nbay5710-sp26/L06_Bitcoin-Mining-Wallets_2026-02-09.md) |
| L07 | 钱包底层；多签与托管；BIP39 助记词；HD 钱包；冷热存储；MPC；智能合约引子 | [raw/L07_Wallets-Smart-Contracts_2026-02-11.pdf](./raw/cornell-tech-nbay5710-sp26/L07_Wallets-Smart-Contracts_2026-02-11.pdf) | [notes/L07](./notes/cornell-tech-nbay5710-sp26/L07_Wallets-Smart-Contracts_2026-02-11.md) |
| L08 | 智能合约特性（不可变/透明/可组合）；Gas 与 EIP-1559；区块构建；预言机引入 | [raw/L08_Smart-Contracts-Oracles_2026-02-18.pdf](./raw/cornell-tech-nbay5710-sp26/L08_Smart-Contracts-Oracles_2026-02-18.pdf) | [notes/L08](./notes/cornell-tech-nbay5710-sp26/L08_Smart-Contracts-Oracles_2026-02-18.md) |
| L09 | 预言机（数据上链）；去中心化与 liveness；数值聚合与 medianization；VRF | [raw/L09_Oracles_2026-02-23.pdf](./raw/cornell-tech-nbay5710-sp26/L09_Oracles_2026-02-23.pdf) | [notes/L09](./notes/cornell-tech-nbay5710-sp26/L09_Oracles_2026-02-23.md) |

## 本批资料 3：Web3 基础概念（小白入门笔记）

- **定位**：覆盖示例问题中涉及的 DeFi / NFT / Layer 2 / 稳定币主题，作为 Cornell & Princeton 课件的补充
- **笔记列表**：
  - [DeFi（去中心化金融）](./notes/web3-basics/defi.md)
  - [NFT（非同质化代币）](./notes/web3-basics/nft.md)
  - [Layer 2（二层网络）](./notes/web3-basics/layer2.md)
  - [稳定币（Stablecoin）](./notes/web3-basics/stablecoins.md)

## 元数据（可机器检索）

- `metadata.json`：[`./metadata.json`](./metadata.json)

