# L01 · Course Intro（2026-01-21）

- **课程**：Cornell Tech · NBAY 5710（SP26）Cryptocurrencies and Blockchains  
- **Instructor**：Ari Juels  
- **原件**：`mvp/library/raw/cornell-tech-nbay5710-sp26/L01_Course-Intro_2026-01-21.pdf`

## TL;DR

这一讲用“为什么值得关心区块链/加密货币”的现实动机开场，然后用一个非常好用的框架来理解比特币：**把比特币当成一种“钱（money）+ 账本（ledger）+ 密钥控制（keys）”的组合体**。核心洞见是：历史上“防伪与稀缺”的问题，到了比特币这里分别被 **计算稀缺（PoW）** 和 **密码学不可伪造（hash / signatures）** 替代。

## 关键概念（中英对照）

- **货币（Money）**：广泛作为交换媒介的资源  
- **记名/登记型金融工具（Registered instrument）**：所有权由中心化登记系统记录（如股票）  
- **不记名/持有人金融工具（Bearer instrument）**：持有“物”或“秘密”的人即拥有资产（如现金；更广义包括持有密钥/秘密）  
- **工作量证明（Proof of Work, PoW）**：用计算成本抵抗 Sybil/作弊，并“背书”区块顺序  
- **哈希（Hash）**：把任意输入映射为固定长度“指纹”，用于不可篡改链接与验证  
- **伪匿名（Pseudonymity）**：身份以公钥等标识表示，不等于匿名

## 课程主线与定位

- **课程覆盖主题**：Bitcoin（轻量动机→深入机制）、密码学基础、区块链算法、智能合约（Ethereum 等）、以及 DeFi/NFT/RWA/stablecoin/AI 等应用。
- **课程性质**：面向非技术背景的“技术课”，重点是建立理解工具，而不是商业案例。

## 用“货币四要素”理解比特币

讲义给出 bearer 版“钱”的四个关键机制（可以当作复习抓手）：

1. **Creation（创造/发行）**
2. **Forgery prevention（防伪）**
3. **Verification（有效性/所有权验证）**
4. **Transfer（转移）**

传统硬币的防伪依赖：

- **稀缺资源**：贵金属（electrum 等）  
- **难复制的签记/工艺**：刻印等  

比特币把它们“抽象替换”为：

- **稀缺资源 → 计算（computation）**  
- **难伪造数据 → 密码学（cryptography）**

## Bearer vs Registered：为什么这个对比重要？

- **Bearer instrument 优点**：容易转移、天然更匿名  
- **Bearer instrument 缺点**：容易丢（丢了就没了），安全性依赖“保管秘密/实物”

- **Registered instrument 优点**：不容易“物理丢失”，可以纠错/回滚（取决于登记系统）  
- **Registered instrument 缺点**：不匿名、转移依赖中心化流程与中介

**比特币的定位**（讲义的关键表述）：它有

- **公共账本（blockchain ledger）**：类似 registered 的“登记记录”
- **密钥控制（secret keys）**：又像 bearer 的“持有秘密即控制资产”

因此它是一个“混合体”：**像登记系统一样可审计，但像不记名工具一样，控制权落在密钥上**。

## 一个贯穿课程的“历史类比”

讲义用“失羊问题（lost sheep problem）”与早期记账令牌（clay tokens / envelope）说明：

- 安全协议从古至今都围绕“**如何防止篡改、如何验证、如何让记录可追溯**”展开
- 最早的“破封验证”就是一种非常早期的安全协议思路

这段类比的价值在于：把区块链从“新奇金融玩具”拉回到一个更一般的工程问题：**信任与记账的制度/技术实现**。

## 复习自测（建议你每次回看用）

1. 用“货币四要素”分别解释：美元纸币/黄金/比特币各自的机制是什么？  
2. 为什么说比特币同时像 bearer instrument 和 registered instrument？它牺牲/获得了什么？  
3. “稀缺资源从金属变成计算”这句到底在技术上对应哪个机制？（提示：PoW）

