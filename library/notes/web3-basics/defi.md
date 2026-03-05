# DeFi（去中心化金融）基础

**定位**：面向 Web3 初学者的 DeFi 概念入门笔记，涵盖 DeFi 是什么、核心机制、与传统金融的区别、主要风险与常见协议类型。

---

## TL;DR

**DeFi（Decentralized Finance，去中心化金融）** 是指用区块链和智能合约来复现传统金融服务（借贷、交易、储蓄、保险等），整个过程不需要银行或券商等中间机构。规则写在合约里，任何人都可以验证；资金由智能合约托管而非由机构保管。

---

## 关键概念（中英对照）

- **DeFi（去中心化金融）**：借助智能合约在区块链上实现的金融服务，无中心化机构
- **智能合约（Smart Contract）**：部署在区块链上自动执行的代码，规则透明且不可篡改
- **流动性池（Liquidity Pool）**：用户把代币存入合约充当"做市商"，其他人从中交换代币
- **AMM（自动做市商，Automated Market Maker）**：用算法（如 x×y=k 恒积公式）自动定价，取代人工挂单
- **流动性提供者（LP, Liquidity Provider）**：往流动性池里存资产的用户，收取交易手续费
- **借贷协议（Lending Protocol）**：如 Aave、Compound，允许超额抵押借贷
- **超额抵押（Over-collateralization）**：抵押品价值必须超过借出资金，防止坏账
- **清算（Liquidation）**：抵押品价格跌穿阈值时合约自动出售抵押品，偿还债务
- **收益率（Yield / APY）**：存款或提供流动性能赚取的年化收益，来源于手续费或协议激励
- **无常损失（Impermanent Loss）**：为 AMM 提供流动性时，两种资产价格比变化导致的账面损失
- **DEX（去中心化交易所，Decentralized Exchange）**：不需注册、不保管资金的链上代币交换平台，如 Uniswap、Curve
- **CEX（中心化交易所，Centralized Exchange）**：如币安/Coinbase，用户资金托管于平台，需要 KYC

---

## DeFi 与传统金融（CeFi）的核心区别

| 维度 | 传统金融（CeFi） | DeFi |
|------|-----------------|------|
| 中间机构 | 银行、券商、基金 | 智能合约代替 |
| 资金保管 | 机构保管 | 用户自己的钱包 |
| 准入门槛 | 需要 KYC / 账户 | 钱包即可，无需注册 |
| 透明度 | 内部账本不公开 | 合约代码和交易链上可查 |
| 营业时间 | 工作日有限 | 7×24 小时不停 |
| 规则修改 | 平台说了算 | 合约一旦部署不可改（或需治理投票） |
| 风险 | 机构信用风险、跑路 | 合约漏洞、清算、价格操控 |

---

## 主要 DeFi 协议类型

### 1. DEX（去中心化交易所）
代表：**Uniswap、SushiSwap、Curve**

- 用流动性池 + AMM 替代传统订单簿
- 用户把两种代币存入池子，比例维持恒积 x×y=k
- 交换者支付手续费（如 0.3%），LP 按比例分成

### 2. 借贷（Lending/Borrowing）
代表：**Aave、Compound**

- 存款人存入资产，赚取利息
- 借款人必须**超额抵押**（如存入 150% 价值的 ETH 才能借出 100 美元）
- 抵押率跌破清算线 → 合约自动清算，偿还债务

### 3. 稳定币协议
代表：**MakerDAO（DAI）**

- 用超额抵押资产生成与美元挂钩的稳定币（DAI）
- 通过利率和清算机制维持 1:1 锚定

### 4. 收益聚合器（Yield Aggregator）
代表：**Yearn Finance**

- 自动把资金在不同 DeFi 协议间转移，追求最高收益

---

## 授权（Approve）是什么，为什么有风险

在使用 DeFi 时，你经常需要**授权（ERC-20 Approve）**操作：

1. 你允许某个合约地址，最多花费你钱包里 X 个代币
2. 之后合约可以在额度内随时转走你的代币
3. 如果授权数量是"无限（Unlimited Approval）"，合约漏洞或恶意合约可以把你的代币全部转走

**风险提醒**：
- 每次授权前检查合约地址是否可信
- 完成交易后建议撤销（Revoke）多余的授权（可用 Revoke.cash 等工具）
- 不要授权给不明来源的合约，DeFi 钓鱼最常见方式就是伪造授权请求

---

## 核心要点

1. DeFi 消除了中间机构，但**风险没有消失，转移到了合约漏洞和市场风险**
2. "无许可（Permissionless）"意味着任何人都能部署合约，包括骗局
3. 收益率高 = 风险高：超高 APY 通常来自早期激励代币，价格暴跌后收益归零
4. 超额抵押是 DeFi 借贷的核心安全边际，抵押物价格下跌可触发清算
5. 无常损失是 LP 特有风险：即使价格涨回来，也可能不如直接持有
6. 资金在你钱包里 ≠ 完全安全：一旦授权了恶意合约，资金仍可被盗

---

## 常见误区

- **误区**：DeFi 收益来自无中生有
  **正确**：收益来源于手续费、借款利息和协议激励代币（后者本身有价格风险）

- **误区**：合约是开源的，所以一定安全
  **正确**：开源意味着可以被审计，但也能被攻击者分析寻找漏洞

- **误区**：DeFi 里资产"在我的钱包里"所以我随时可以取回
  **正确**：存入 DeFi 协议的资产由合约控制，合约漏洞或清算可导致损失

---

## 检索关键词

DeFi、去中心化金融、Decentralized Finance、智能合约、smart contract、流动性池、liquidity pool、AMM、自动做市商、Automated Market Maker、Uniswap、Aave、Compound、借贷、lending、borrowing、超额抵押、over-collateralization、清算、liquidation、无常损失、impermanent loss、收益率、yield、APY、DEX、去中心化交易所、decentralized exchange、CEX、中心化交易所、授权、approve、ERC-20、无许可、permissionless、可组合性、composability、TVL、总锁仓量、MakerDAO、DAI、稳定币、流动性提供者、LP、手续费、fee、收益聚合、yield aggregator、Yearn、合约风险、rug pull、闪电贷、flash loan。
