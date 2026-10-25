# CSIT5610 复习资料 · 总目录

> 共 **3 章**，对应课件 `ch1-8.pdf`–`ch3-8.pdf`。
> 每章统一结构：**本章主线 → 知识精讲 → 例题精讲 → 易错点 → 自测（含答案）→ 考前速记卡**。
> 配套总览：[知识大纲](../outline.md)

---

## 章节目录

| 章 | 主题 | 对应课件 | 建议用时 | 文件 |
|---|---|---|---|---|
| 1 | 计算机网络导论 | Chapter 1 Introduction | 130 min | [第1章](ch1-intro.md) |
| 2 | 应用层 | Chapter 2 Application Layer | 160 min | [第2章](ch2-application.md) |
| 3 | 传输层 | Chapter 3 Transport Layer | 210 min | [第3章](ch3-transport.md) |

---

## 怎么用（三遍法）

**第一遍：建框架（每章 10–15 分钟）**
1. 读“本章主线”三句话；
2. 直接看最后的“考前速记卡”；
3. 合上文件，用白纸画出该章结构（协议栈/时序/状态机）。

**第二遍：抠机制（每章 60–90 分钟）**
1. 精读“知识精讲”，公式自己推一遍；
2. 遮住例题解答先做，再对照；
3. 把错点记到“易错点”旁边。

**第三遍：自测（每章 30 分钟）**
1. 遮住答案做“自测”；
2. 错题回到精讲对应小节；
3. 第二天只看速记卡 + 错题。

**考前 30 分钟**：只看每章“速记卡”+“易错点”，以及知识大纲 §6 的公式表。

---

## 高频计算题清单

| 类型 | 所在章 | 关键公式 |
|---|---|---|
| 四种延迟 | 1 | <span class="mchip">\(d = d_{\text{proc}} + d_{\text{queue}} + L/R + d/s\)</span> |
| 流量强度/排队 | 1 | <span class="mchip">\(La/R\)</span> |
| 吞吐/瓶颈 | 1 | `min(R_s,R_c,...)` |
| 非持久 HTTP | 2 | `2 RTT + L/R` |
| 持久 HTTP | 2 | 建连 1 RTT；流水线约 1 RTT 总计 |
| P2P 分发 | 2 | `max{F/u_s, F/d_min, NF/(u_s+Σu_i)}` |
| stop-and-wait | 3 | <span class="mchip">\(U=(L/R)/(RTT+L/R)\)</span> |
| TCP RTT/超时 | 3 | <span class="mchip">\(\text{Est}=0.875\text{Est}+0.125\text{Sample}\)</span>；<span class="mchip">\(\text{Timeout}=\text{Est}+4\text{Dev}\)</span> |
| TCP 吞吐 | 3 | <span class="mchip">\(0.75\cdot W/RTT\)</span> |

---

## 各章“一句话”复习

1. **第 1 章**：互联网 = 主机 + 交换机 + 链路 + 网络；数据走“分组交换 + 分层封装”；性能看四种延迟、<span class="mchip">\(La/R\)</span>、瓶颈吞吐。
2. **第 2 章**：应用层协议定义报文/时序；HTTP 无状态靠 Cookie/缓存补，DNS 是层次数据库，P2P 靠 peer 上传带宽扩展。
3. **第 3 章**：传输层进程到进程；可靠传输 = 确认 + 序号 + 定时器；TCP 在可靠之上做流控/拥塞控制；AIMD/慢启动是核心。

---

## 备注

- 课件对应 Kurose & Ross *Computer Networking: A Top-Down Approach* (8th ed.) 第 1–3 章。
- 课件中的“Additional slides”（如 GBN 扩展 FSM、TCP 吞吐推导）本资料只保留结论，不逐页展开。
- 若要把某章扩展成“30 道模拟题 + 详解”，可在本目录基础上继续加工。
