# 钱包与隐私（Princeton Ch4、Ch6 精要）

**对应**：Bitcoin and Cryptocurrency Technologies 第 4、6 章  
**核心问题**：如何安全管理密钥？比特币的隐私水平如何？

---

## 钱包与密钥管理

- **热钱包（hot wallet）**：联网，易用但风险高，易被入侵。
- **冷钱包（cold wallet）**：离线存储，安全但操作不便。
- **助记词（mnemonic phrase）**：BIP39 等标准，将种子转换为可备份的人类可读词句。
- **托管 vs 非托管**：交易所/托管机构（custodial）持有私钥；自我托管（non-custodial）用户自管，责任与风险自担。备份（backup）丢失即资产永久丢失。

---

## 隐私与链上分析

比特币是 **伪匿名（pseudonymity）**，不是真匿名：地址是伪名，一旦与身份关联，历史交易可被追踪。

- **链上分析（blockchain analysis）**：地址聚类（address clustering）、交易图（transaction graph）分析。
- **隐私增强**：混币（mixing）、CoinJoin、Tor/VPN 等。比特币 ≠ 匿名币（如 Monero、Zcash）。

**检索关键词**：钱包、wallet、热钱包、hot wallet、冷钱包、cold wallet、私钥、private key、公钥、public key、助记词、mnemonic、托管、custodial、非托管、non-custodial、备份、backup、伪匿名、pseudonymity、匿名、anonymity、链上分析、blockchain analysis、地址聚类、address clustering、混币、mixing、CoinJoin。
