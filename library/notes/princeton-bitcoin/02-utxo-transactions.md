# UTXO 与交易结构（Princeton Ch3 精要）

| 项目 | 内容 |
|------|------|
| **对应** | Bitcoin and Cryptocurrency Technologies 第 3 章 |
| **核心问题** | 比特币交易的数据结构是什么？UTXO 与账户模型有何区别？ |

> **一句话结论**：比特币用 UTXO 模型记账，不是「账户余额」而是「未花费输出集合」；每笔交易用输入引用旧输出、用输出锁定新金额，由脚本规定花费条件。

---

## UTXO 模型

**UTXO（Unspent Transaction Output，未花费交易输出）** 是比特币的账本模型，不是「账户余额（account balance）」，而是「可被花费的输出集合」。

- **输入（inputs）**：引用之前某笔交易的输出（output），并附解锁脚本（scriptSig）证明有权花费。
- **输出（outputs）**：金额 + 锁定脚本（scriptPubKey），规定谁在什么条件下可花。
- **找零（change）**：多出的金额作为新输出回到自己地址。

---

## 脚本与常用模式

**Bitcoin Script**：栈式、非图灵完备的脚本语言，常用模式：

- **P2PKH（Pay to Public Key Hash）**：最常用的「转给某地址」。
- **P2SH（Pay to Script Hash）**：复杂条件封装成哈希，典型如多签（multisig）。
- **多签（multisig）**：需 m-of-n 个签名才能花费。

**检索关键词**：UTXO、Unspent Transaction Output、未花费输出、交易、transaction、输入、input、输出、output、找零、change、脚本、Bitcoin Script、scriptSig、scriptPubKey、P2PKH、P2SH、多签、multisig、账户模型、account model、双重支付、double spending。
