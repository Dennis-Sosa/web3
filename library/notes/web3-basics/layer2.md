# Layer 2（二层网络）基础

**定位**：面向 Web3 初学者的 Layer 2 概念入门笔记，涵盖 L2 是什么、为什么费用更低、主流类型（Rollup / Optimistic / ZK）及常见风险。

---

## TL;DR

**Layer 2（二层网络，L2）** 是建在以太坊（Layer 1）之上的扩容方案。它把大量交易在 L2 上执行，只把"汇总结果"定期提交到 L1，从而分摊了 L1 昂贵的 Gas 费用，同时继承 L1 的安全性。简单类比：L1 是法院（最终裁定），L2 是庭外调解（快速低成本处理，争议时才上法院）。

---

## 为什么以太坊 Gas 费贵？

以太坊 Layer 1 的瓶颈：
- 每个区块的 Gas 上限是固定的（约 3000 万 Gas）
- 网络拥堵时，用户相互竞价（出更高 Gas）让矿工/验证者优先打包自己的交易
- 复杂操作（DeFi 合约调用）消耗 Gas 多，在高峰期可能花费数十美元

Layer 2 的核心思路：**把计算移到链下，只把结果放到链上**，让每笔交易分摊的 L1 成本大幅下降。

---

## Layer 1 vs Layer 2 vs 侧链

| 维度 | Layer 1（以太坊主网） | Layer 2 | 侧链（Sidechain） |
|------|----------------------|---------|------------------|
| 安全来源 | 自身共识（PoS） | 继承 L1 安全性 | 独立共识，与 L1 无关 |
| 费用 | 高（竞争出价） | 低（批量摊薄） | 低（独立运营） |
| 去中心化 | 高 | 中等 | 取决于设计 |
| 例子 | Ethereum 主网 | Arbitrum、Optimism、zkSync | Polygon PoS（旧版）、BSC |

侧链（如 Polygon PoS）有自己的验证者，不直接继承以太坊安全性；而真正的 L2 把数据和证明锚定在以太坊上。

---

## 主流 L2 类型：Rollup

**Rollup** 是当前最主流的 L2 方案：把许多交易"卷起来"批量处理，只把压缩后的交易数据和状态更新发布到以太坊 L1。

### 1. Optimistic Rollup（乐观汇总）

代表：**Arbitrum One、Optimism（OP Mainnet）、Base**

- **核心假设**：默认所有交易有效（"乐观"），除非有人提出质疑
- **欺诈证明（Fraud Proof）**：任何人在挑战期（通常 7 天）内提交证明，如果发现无效交易就回滚
- **提款延迟**：从 L2 提款到 L1 需等待 7 天挑战期（可通过桥接服务加速，但有额外费用）
- **EVM 兼容性高**：以太坊的 Solidity 合约几乎可以直接部署

### 2. ZK Rollup（零知识汇总）

代表：**zkSync Era、StarkNet、Polygon zkEVM、Linea**

- **核心技术**：用**零知识证明（Zero-Knowledge Proof, ZKP）** 在链下生成有效性证明，证明提交到 L1 即可最终确认
- **有效性证明（Validity Proof）**：数学上保证批次正确，无需等待挑战期
- **提款更快**：无需 7 天等待，证明验证通过即可提款（通常数小时）
- **技术难度高**：实现复杂，部分 EVM 功能兼容性仍在优化

### 对比

| | Optimistic Rollup | ZK Rollup |
|--|-------------------|-----------|
| 安全机制 | 欺诈证明（事后纠错） | 有效性证明（事前验证） |
| 提款到 L1 | 约 7 天 | 数小时内 |
| EVM 兼容 | 高 | 中等（在快速提升） |
| 计算成本 | 低 | 生成证明较贵 |

---

## 桥接（Bridge）

在 L1 和 L2 之间转移资产需要用到**跨链桥（Bridge）**：

1. 把资产锁定在 L1 的桥接合约中
2. L2 合约铸造等量的"映射资产"
3. 反向操作（提款）时销毁 L2 资产，解锁 L1 资产

**桥接风险**：
- 桥接合约是重点攻击目标，历史上已有多次大额漏洞（如 Ronin 桥、Wormhole）
- 不同桥的安全假设不同，选择官方桥（如 Arbitrum 官方桥）更安全但等待时间长

---

## 核心要点

1. L2 不是独立区块链，它"寄生"在以太坊上，从 L1 借安全性
2. 更便宜 = 批量摊薄 L1 成本，不是凭空变便宜
3. Optimistic Rollup 提款有 7 天等待期，ZK Rollup 更快但技术更复杂
4. 侧链（Polygon PoS）费用也低，但安全模型与 L2 不同，风险不同
5. 桥接资产时需谨慎：桥接合约漏洞是 Web3 最大的资产损失来源之一

---

## 常见误区

- **误区**：L2 比以太坊安全性低，不能信任
  **正确**：Rollup 把数据和证明发布到以太坊，安全性由以太坊背书（Optimistic 需要诚实的挑战者存在）

- **误区**：Layer 2 费用越低越好
  **正确**：超低费用可能来自中心化排序器（Sequencer）的风险，需要看去中心化程度

- **误区**：在 L2 上的资产随时可以取回
  **正确**：Optimistic Rollup 的提款到 L1 需要 7 天，部分紧急情况下流动性不足

---

## 检索关键词

Layer 2、L2、二层网络、以太坊扩容、Ethereum scaling、Rollup、Optimistic Rollup、ZK Rollup、零知识证明、Zero-Knowledge Proof、ZKP、欺诈证明、Fraud Proof、有效性证明、Validity Proof、Arbitrum、Optimism、Base、zkSync、StarkNet、Polygon、侧链、Sidechain、跨链桥、Bridge、桥接、Gas 费、Gas fee、吞吐量、TPS、排序器、Sequencer、提款延迟、withdrawal delay、7天挑战期、challenge period、EVM 兼容、Layer 1、L1、扩容瓶颈、链下计算、off-chain computation。
