# 电子现金与去中心化（Princeton Ch1–2 精要）

| 项目 | 内容 |
|------|------|
| **对应** | Bitcoin and Cryptocurrency Technologies 第 1–2 章 |
| **核心问题** | 为什么传统电子现金失败？比特币如何实现去中心化？ |

> **一句话结论**：传统 e-cash 因中心化与双重支付等问题失败；比特币用 PoW + 最长链规则在无中心前提下达成共识，把「投票权」绑在算力上抗 Sybil。

---

## 电子现金历史与双重支付

传统电子支付（信用卡、PayPal）依赖中心化机构。电子现金（e-cash）试图实现匿名、可离线验证的数字化货币，但面临 **双重支付（double spending / 双花）** 问题：数字信息可复制，如何防止同一笔钱花两次？

**Chaum 方案**：盲签名（Blind Signature）实现匿名电子现金，银行无法关联身份与消费记录。DigiCash、Ecash 等曾部署，但依赖中心化银行在线参与，**不是去中心化**，且用户体验、商业模式、监管等问题导致失败。

**检索关键词**：电子现金、e-cash、electronic cash、双重支付、double spending、双花、Chaum、盲签名、blind signature、DigiCash、Ecash、中心化、centralized、单点失败、single point of failure、匿名、anonymity、隐私、privacy。

---

## 去中心化共识与 PoW

在没有中央机构时，全网节点如何对「哪条账本是正统」达成一致？比特币用 **工作量证明（Proof of Work, PoW）** 解决：

- **P2P 网络（peer-to-peer, 点对点）**：节点广播交易与区块，无中心服务器。
- **Sybil 攻击（Sybil attack）**：若按「一节点一票」投票，攻击者可伪造大量节点控制共识。PoW 将投票权绑定到 **算力（hashrate）**，而非节点数。
- **最长链规则（longest chain rule）**：诚实节点跟随当前最长链，攻击者需控制多数算力才能改写历史。
- **安全目标**：一致性（consistency）、活性（liveness）、抗 Sybil（Sybil resistance）。

**检索关键词**：去中心化、decentralization、共识、consensus、工作量证明、PoW、Proof of Work、挖矿、mining、Sybil、Sybil attack、最长链、longest chain、算力、hashrate、区块、block、哈希难题、hash puzzle、51% 攻击、51% attack、一致性、consistency、活性、liveness、威胁模型、threat model。
