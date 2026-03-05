# 挖矿与激励（Princeton Ch5 精要）

**对应**：Bitcoin and Cryptocurrency Technologies 第 5 章  
**核心问题**：为什么矿工（miner）会诚实挖矿？自私挖矿（selfish mining）等攻击在什么条件下有利？

---

## 激励设计

- **区块奖励（block reward）**：出块者获得新铸的比特币 + 该区块内交易的 **手续费（transaction fees）**。
- **难度调整（difficulty adjustment）**：根据算力波动调整哈希难题难度，维持目标出块间隔（如 10 分钟）。
- **矿池（mining pool）**：多个矿工共享算力、平分收益，降低个体收益波动（variance）。

---

## 攻击与博弈

- **51% 攻击（51% attack）**：控制多数算力可双花、拒绝打包交易，但成本高且会损害币价。
- **自私挖矿（Selfish Mining）**：恶意矿工私藏已解区块，在特定算力占比下可获利。书中用博弈论分析其可行区间。
- **算力集中化**：矿池过大带来治理与审查风险。

**检索关键词**：挖矿、mining、工作量证明、PoW、Proof of Work、区块奖励、block reward、手续费、transaction fee、难度调整、difficulty adjustment、矿池、mining pool、自私挖矿、selfish mining、51% 攻击、51% attack、算力、hashrate、nonce、哈希难题、hash puzzle、博弈论、game theory。
