# CSIT5610 计算机网络 · 知识大纲

> **范围**：第 1–3 章（Kurose & Ross, *Computer Networking: A Top-Down Approach*, 8th ed.）
> 第 1 章 Introduction、第 2 章 Application Layer、第 3 章 Transport Layer。
>
> **用法**：先看 §1 全局地图 → 按章看 §2–§4 的知识树 → 用 §5 的横向对比和 §6 的公式速记 → 最后做 §7 自测。
>
> **标记**：★ 核心考点；⚔ 攻击/问题；🔧 机制/解法；⚠ 易混。

---

## 0. 三章在课程中的位置

| 章 | 主题 | 核心问题 | 学完能回答 |
|---|---|---|---|
| 1 | Introduction | 互联网由什么组成？数据怎么走？为什么分层？ | 端到端路径、四种延迟、分组 vs 电路、五层模型 |
| 2 | Application Layer | 网络应用怎么设计、协议怎么工作？ | HTTP/DNS/SMTP 流程、缓存、P2P、CDN、Socket |
| 3 | Transport Layer | 进程之间怎么可靠/高效地传数据？ | UDP/TCP、rdt、GBN/SR、流量控制、拥塞控制 |

**一句话主线**：

1. **分层**：每层只依赖下层提供的服务，向上提供抽象；理解头部（header）就是理解层与层之间的契约。
2. **协议 = 规则**：报文格式、字段含义、发送/接收动作、时序；绝大多数网络问题都能还原成“某层的状态机/字段出了问题”。
3. **性能 = 延迟 + 丢包 + 吞吐**；可靠性 = 确认 + 重传 + 序号；效率 = 流水线 + 窗口 + 拥塞控制。

---

## 1. 全局地图

### 1.1 五层协议栈（本课程的主干）

```
应用层   HTTP, SMTP, DNS, ...          报文 message
传输层   TCP, UDP                      段 segment
网络层   IP, routing protocols         数据报 datagram
链路层   Ethernet, 802.11, PPP         帧 frame
物理层   铜缆/光纤/无线电              比特 bit
```

- 封装：应用数据自上而下每层加头；路由器只处理到网络层，交换机到链路层。
- 地址：应用层用域名/URL；传输层用 **端口**；网络层用 **IP**；链路层用 **MAC**。
- 端到端（end-to-end）vs 逐跳（hop-by-hop）：传输层是端到端，网络层/链路层是逐跳。

### 1.2 一次 Web 访问的路径（把三章串起来）

```
浏览器 --HTTP--> TCP 连接（三次握手）--IP--> 路由器逐跳转发 --> 服务器
   DNS 先解析域名（UDP 53）
   TCP 提供可靠、按序、流控、拥塞控制
   HTTP 是无状态的应用协议，用 Cookie 补状态
```

### 1.3 性能三件套

| 指标 | 定义 | 关键公式/因素 |
|---|---|---|
| **Delay** | 数据从源到目的耗时 | <span class="mchip">\(d = d_{\text{proc}} + d_{\text{queue}} + d_{\text{trans}} + d_{\text{prop}}\)</span> |
| **Loss** | 排队溢出/比特错误导致丢包 | 队列有限 + 流量强度 <span class="mchip">\(La/R\)</span> |
| **Throughput** | 单位时间真正传过的比特 | 瓶颈链路 `min(R_s, R_c)` |

### 1.4 两条“状态机”主线

- **可靠传输**：发送方等 ACK、超时重传；接收方用序号/ACK 处理重复与失序。
- **连接管理**：TCP 三次握手/四次挥手；状态（LISTEN/SYN_SENT/ESTABLISHED/...）决定能收什么包。

---

## 2. 第 1 章：Introduction

### 2.1 什么是 Internet

**“nuts and bolts” 视角**

- **主机/端系统（hosts/end systems）**：PC、手机、服务器、IoT，运行网络应用。
- **分组交换机（packet switches）**：路由器（router）、交换机（switch），转发分组。
- **通信链路（links）**：光纤、铜缆、无线电、卫星；**带宽/传输速率**。
- **网络（network）**：设备、路由器、链路的集合，由组织管理。
- 互联网 = 网络的网络（network of networks）。

**“services” 视角**

- 为应用提供**通信服务**的基础设施。
- 提供 **API（socket API）**，让应用把数据交给网络。
- 协议：通信双方约定的规则。

**协议（protocol）★**

> 协议定义：① 报文格式（format）；② 报文的顺序/时序（order）；③ 发送或收到报文时采取的动作（action）。

- 人类协议类比：问“几点了？”→ 回答；网络协议类比：TCP 连接请求 → 响应。
- 协议三要素：**语法、语义、时序**（课件用 format/order/actions 表述）。

### 2.2 网络边缘（network edge）

**接入网络（access networks）**

| 类型 | 介质/结构 | 特点 |
|---|---|---|
| **Cable（HFC）** | 同轴电缆 + 光纤混合；共享到 headend | 下行速率高；共享介质，需分配 |
| **DSL** | 电话双绞线到 DSLAM/CO | 专用线路；速率随距离衰减 |
| **无线（WiFi/5G）** | 共享无线接入 | 共享、受干扰、移动性 |
| **企业网** | Ethernet + 交换机 + 路由器 | 高带宽、分层接入 |
| **数据中心** | 机架/交换机/负载均衡 | 高带宽、低延迟、东西向流量 |

**物理媒体**

- **导引型（guided）**：双绞线（UTP）、同轴电缆、光纤（高速、低误码、抗电磁干扰）。
- **非导引型（unguided）**：无线电（WiFi、蜂窝、卫星）；受环境、距离、干扰影响。

**主机如何发包**

- 主机把数据分成 **packets**；链路传输速率 `R`（bps）。
- 发送一个 `L` bit 的分组，**传输时间 = L/R**。
- 分组交换机采用 **store-and-forward**：收完整包、校验后再转发。

### 2.3 网络核心（network core）

**两种核心功能**

- **Forwarding（转发）**：把到达的分组从输入端口送到正确的输出端口（局部、快）。
- **Routing（路由）**：决定从源到目的的路径（全局、运行路由协议）。

**分组交换（packet switching）★**

- 数据切成分组，独立传输；**统计复用**（statistical multiplexing）。
- **存储转发**：<span class="mchip">\(\text{端到端延迟} \approx \tfrac{2L}{R}\)</span>（两段链路、无排队）。
- **排队（queueing）**：到达速率 > 输出速率时，分组在缓冲区排队；缓冲区满 → **丢包**。
- 优点：适合突发流量、带宽利用率高；缺点：排队延迟、丢包、需要拥塞控制。

**电路交换（circuit switching）★**

- 建立连接时**预留**端到端资源（带宽/时隙）；通话期间独占。
- **FDM**：频分复用；**TDM**：时分复用。
- 优点：有带宽/延迟保证；缺点：空闲时浪费、建立连接慢。

**分组 vs 电路（经典例子）**

- 1 Gb/s 链路，用户活跃时 100 Mb/s，活跃概率 10%。
- 电路交换：最多支持 **10** 个用户（每人预留 100 Mb/s）。
- 分组交换：35 个用户时，超过 10 个同时活跃的概率很小 → 支持更多用户。
- 结论：**突发型流量用分组交换更高效**；但分组交换不提供硬保证。

**Internet 结构：网络的网络**

- 接入 ISP → 区域 ISP → Tier-1 ISP；IXP 互联；内容提供商（Google/Netflix/Akamai）自建网络，尽量靠近用户。
- 多归（multi-homing）、对等（peering）、传输（transit）等商业关系。

### 2.4 性能：延迟、丢包、吞吐

**四种延迟 ★★**

\[
d_{\text{nodal}} = d_{\text{proc}} + d_{\text{queue}} + d_{\text{trans}} + d_{\text{prop}}
\]

| 分量 | 公式/含义 |
|---|---|
| 处理延迟 `d_proc` | 检查头部、决定输出端口；通常很小 |
| 排队延迟 `d_queue` | 取决于流量强度；用 <span class="mchip">\(La/R\)</span> 估计 |
| 传输延迟 `d_trans` | <span class="mchip">\(L/R\)</span>（把比特推上链路的时间） |
| 传播延迟 `d_prop` | <span class="mchip">\(d/s\)</span>（物理距离/信号速度） |

**流量强度（traffic intensity）★**

\[
\text{traffic intensity} = \frac{La}{R}
\]

- `a`：平均到达速率（包/秒）；`L`：包长；`R`：链路速率。
- <span class="mchip">\(\tfrac{La}{R} \approx 0\)</span>：排队延迟小；`→ 1`：延迟急剧增大；`> 1`：队列无限增长（实际会丢包）。
- ⚠ **传输延迟 vs 传播延迟**：前者是“把包推出去”，后者是“信号在介质中跑”。

**丢包（loss）**

- 队列缓冲区有限；到达速率持续超过输出速率 → 缓冲区满 → 后续包被丢弃。
- 丢包可能表现为“重传”“超时”“吞吐下降”。

**吞吐（throughput）★**

- 端到端吞吐 = 路径上**瓶颈链路**的速率：`min(R_s, R_c, ...)`；10 条连接公平共享骨干 `R` 时，每条约 `min(R_s, R_c, R/10)`。
- 链路速率相近时，吞吐 ≈ 链路速率；有一处窄带，就成为瓶颈。

**traceroute**

- 利用 TTL 递增 + ICMP 超时，逐跳测量 RTT；可看到路径和延迟变化。

### 2.5 分层与协议栈

**为什么分层**

- 复杂系统分解；模块独立演化；上层只依赖下层接口。
- 缺点：层间头部开销、可能隐藏信息（如跨层优化困难）。

**Internet 五层 vs OSI 七层**

| Internet 五层 | OSI 七层 | 功能 |
|---|---|---|
| Application | Application / Presentation / Session | 应用语义、表示、会话 |
| Transport | Transport | 进程到进程 |
| Network | Network | 主机到主机、路由 |
| Link | Data Link | 相邻节点、成帧 |
| Physical | Physical | 比特传输 |

- OSI 的 Presentation/Session 在 Internet 栈中由应用层自行处理。

**封装（encapsulation）★**

```
应用层：      message
传输层：  [H_t | message]              segment
网络层：  [H_n | H_t | message]        datagram
链路层：  [H_l | H_n | H_t | message]  frame
```

- 每层只读/写自己的头部；接收方逐层解封装。
- 路由器解封装到网络层；链路层交换机到链路层。

### 2.6 网络安全与历史（了解）

- **恶意软件**：病毒、蠕虫、木马、僵尸网络。
- **DoS/DDoS**：用大量流量/请求耗尽资源。
- **嗅探（sniffing）**：共享介质/无线下抓包。
- **欺骗（spoofing）**：伪造源 IP/MAC。
- 历史阶段：1961–1972 分组交换；1972–1980 互联网互联；1980–1990 协议标准化；1990s 商业化/Web；2005– 移动/云/SDN。

---

## 3. 第 2 章：Application Layer

### 3.1 应用层原理

**两种架构**

| 架构 | 特点 | 例子 |
|---|---|---|
| **Client-Server** | 服务器 always-on、固定地址、可扩展用数据中心；客户端主动请求 | Web、email、DNS |
| **P2P** | 无 always-on 服务器；对等体既请求又服务；可自扩展 | BitTorrent、区块链 |

**进程与套接字**

- **进程（process）**：主机上运行的程序；同主机用进程 ID，跨主机用 **IP + 端口** 标识。
- **套接字（socket）**：应用进程与传输层之间的门；应用把报文交给 socket，由传输层发送。
- 应用层协议需要定义：**报文类型、语法、语义、时序**。

**应用对传输层的需求**

| 需求 | 说明 | 典型应用 |
|---|---|---|
| 数据完整性 | 不能丢/错 | 文件传输、Web、email |
| 时延 | 低延迟 | 实时音视频、游戏 |
| 吞吐 | 最小带宽 | 视频流 |
| 安全 | 加密/认证 | 登录、支付 |

**Internet 传输服务**

- **TCP**：可靠、按序、流控、拥塞控制、面向连接；不提供时延/带宽保证。
- **UDP**：不可靠、无连接、开销小；不保证顺序/完整。
- **TLS**：在 TCP 之上提供加密、认证、完整性；应用通过 TLS 库使用（HTTPS）。

### 3.2 Web 与 HTTP

**HTTP 基础**

- 超文本传输协议；**请求/响应**模式；**无状态**（不记历史）。
- 默认端口 **80**；使用 TCP。
- 两种连接：
  - **非持久（HTTP/1.0）**：每个对象一个 TCP 连接；
  - **持久（HTTP/1.1）**：一个连接传多个对象。

**响应时间（RTT）★**

- **RTT**：小分组从客户端到服务器再回来的时间。
- 非持久 HTTP：每个对象约 **2 RTT + 传输时间**（建连 1 RTT + 请求/响应 1 RTT）。
- 持久 HTTP：建连一次；无流水线时每对象约 **1 RTT + 传输时间**，有流水线时所有对象可近似 **1 RTT** 后陆续到达。

**HTTP 报文**

- 请求行：`GET /index.html HTTP/1.1`；头部：Host、User-Agent、Accept、Connection、Cookie 等；空行；实体。
- 方法：GET、POST、HEAD、PUT、DELETE。
- 响应：状态行 + 头部 + 实体；状态码：
  - 200 OK；301 Moved Permanently；304 Not Modified；
  - 400 Bad Request；403 Forbidden；404 Not Found；505 HTTP Version Not Supported。

**Cookie ★**

- HTTP 无状态 → 用 Cookie 维护状态。
- 服务器响应 `Set-Cookie`；浏览器保存并在后续请求带 `Cookie`；服务器用后端数据库关联用户。
- 用途：购物车、会话、个性化、追踪。
- 隐私问题：跨站追踪；Cookie 不是认证机制。

**Web 缓存/代理 ★**

- 缓存命中：直接返回，减少响应时间、降低出口带宽、减轻源服务器压力。
- **条件 GET**：`If-Modified-Since`；服务器若未修改返回 **304 Not Modified**（无实体）。
- 缓存一致性：`Cache-Control`、过期时间、验证。

**HTTP/2 与 HTTP/3**

- HTTP/1.1：队头阻塞（HOL blocking）、头部冗余。
- **HTTP/2**：二进制分帧、多路复用（一个 TCP 连接上并发多个流）、头部压缩（HPACK）；仍受 TCP 层 HOL 影响。
- **HTTP/3**：基于 **QUIC（UDP）**，流级多路复用，避免 TCP HOL；0/1-RTT 建连；内置加密。

### 3.3 电子邮件

- 组成：用户代理（UA）、邮件服务器、SMTP、邮件访问协议。
- **SMTP**：推（push），从发送方 UA → 发送方邮件服务器 → 接收方邮件服务器；TCP 端口 **25**；命令/响应为 ASCII。
- **邮件访问**：POP3（110）、IMAP（143）、HTTP Webmail；拉（pull）。
- 邮件格式：头部（From/To/Subject/Date）+ 空行 + 正文；MIME 支持附件/非 ASCII。
- SMTP 与 HTTP 对比：SMTP 是推、HTTP 是拉；都是 ASCII 命令/响应，但 SMTP 要求报文为 7-bit ASCII。

### 3.4 DNS

**作用**

- 域名 → IP 地址；主机别名；邮件服务器别名；负载分配。
- 分布式、层次化数据库；UDP 端口 **53**（也可 TCP）。
- 为什么不用集中式：单点故障、流量、距离、维护。

**层次结构 ★**

```
根 DNS 服务器（root）
  → 顶级域 TLD（.com, .org, .cn）
    → 权威 DNS 服务器（authoritative）
本地 DNS 服务器（local/resolver，通常由 ISP/组织提供）
```

- 根服务器：全球 13 个逻辑集群，每个有大量镜像（美国约 200 台）。
- TLD：负责 .com/.org 等。
- 权威：保存具体域名的记录。
- 本地 DNS：代理查询、缓存。

**解析方式 ★**

- **迭代查询（iterative）**：本地 DNS 依次问根、TLD、权威，自己推进。
- **递归查询（recursive）**：本地 DNS 替主机完成全部查询（根通常不递归）。
- 实际：主机→本地 DNS 是递归；本地 DNS→根/TLD/权威通常是迭代。

**缓存**

- 任何一层都可缓存；TTL 控制过期。
- 优点：降低延迟、减少根/TLD 负载；缺点：过期记录可能不一致。

**资源记录（RR）**

| 类型 | 含义 |
|---|---|
| A | 域名 → IPv4 地址 |
| AAAA | 域名 → IPv6 地址 |
| NS | 域的权威 DNS 服务器 |
| CNAME | 别名 → 规范名 |
| MX | 邮件服务器 |

**DNS 报文**

- 头部：ID、flags、问题数、回答数、权威数、附加数；问题/回答/权威/附加四段。
- 查询与响应格式相同。

**DNS 安全**

- DDoS（攻击根/TLD/权威）；缓存投毒；伪造响应。
- 防御：DNSSEC（签名/信任链）、随机化 ID/端口、0x20 编码、限流。

### 3.5 P2P 应用

**文件分发时间 ★**

- 客户端-服务器：<span class="mchip">\(D_{\text{cs}} = \max\left\{\tfrac{NF}{u_s},\ \tfrac{F}{d_{\min}}\right\}\)</span>
- P2P：<span class="mchip">\(D_{\text{p2p}} = \max\left\{\tfrac{F}{u_s},\ \tfrac{F}{d_{\min}},\ \tfrac{NF}{u_s+\sum u_i}\right\}\)</span>
- 其中 `F` 文件大小、`N` peer 数、`u_s` 服务器上传、`u_i` peer 上传、`d_min` 最慢下载。
- 结论：P2P 随 N 增长可扩展；C-S 受服务器带宽限制。

**BitTorrent**

- 文件切块（chunk，通常 256 KB）；tracker 提供 peer 列表；peer 交换 chunk。
- **tit-for-tat**：优先给上传速率高的 peer；周期性“乐观 unchoke”给新 peer 机会。
- 激励：搭便车（free-riding）问题。

### 3.6 视频流与 CDN

- 视频：帧序列；CBR/VBR；压缩（空间/时间冗余）。
- 流式播放挑战：连续播放约束、网络抖动、带宽变化。
- **播放缓冲（playout buffer）**：预缓冲，吸收抖动；代价是启动延迟。
- **DASH**：把视频切成不同码率的片段；客户端根据带宽自适应选择。
- **CDN**：把内容副本部署到边缘节点；DNS/HTTP 重定向到最近节点；降低延迟、减少骨干流量。
- **OTT**：内容提供方越过传统运营商，自建 CDN/网络。

### 3.7 Socket 编程

- **UDP**：`socket(AF_INET, SOCK_DGRAM)`；`sendto/recvfrom`；无连接；数据报边界保留。
- **TCP**：`socket(AF_INET, SOCK_STREAM)`；`listen/accept`；`connect`；`send/recv`；字节流，无边界。
- 服务器：创建欢迎 socket → accept 新连接 → 处理；客户端：创建 socket → connect → 收发。
- 端口：服务器固定端口；客户端临时端口。

---

## 4. 第 3 章：Transport Layer

### 4.1 传输层服务

- 为不同主机上的**进程**提供逻辑通信；网络层是主机到主机，传输层是进程到进程。
- 发送方：把应用数据切段、加头、交给网络层；接收方：重组、交给 socket。
- **多路复用/解复用（mux/demux）★**：
  - 发送方从多个 socket 收集数据，加传输层头；
  - 接收方根据头部字段把段交给正确的 socket。
  - **UDP**：用 `<目的 IP, 目的端口>` 标识 socket；
  - **TCP**：用 `<源 IP, 源端口, 目的 IP, 目的端口>` 四元组标识连接。

### 4.2 UDP

**特点**

- 无连接、不可靠、无流控/拥塞控制；开销小、延迟低。
- 适合：DNS、DHCP、SNMP、流媒体、游戏、QUIC 底层。

**头部（8 字节）**

```
源端口(16) | 目的端口(16)
长度(16)   | 校验和(16)
```

**校验和**

- 覆盖 UDP 头部 + 数据 + 伪头部（源/目的 IP、协议号、UDP 长度）。
- 16-bit 反码求和，再取反；接收方验证。
- 保护很弱（16 位），但能检测部分错误。

### 4.3 可靠数据传输（rdt）★★

**接口与假设**

- `rdt_send(data)`：上层调用；`udt_send(packet)`：交给不可靠信道；`rdt_rcv(packet)`：收到包；`deliver_data(data)`：交给上层。
- 逐步增加信道假设：可靠 → 比特错误 → 丢包。

**rdt1.0：可靠信道**

- 发送方：收数据 → 打包 → 发送；接收方：收包 → 提取 → 交付。无需 ACK/序号。

**rdt2.0：有比特错误**

- 需要：差错检测（checksum）、ACK/NAK、重传。
- 发送方发完等 ACK/NAK；NAK 或损坏 → 重传。
- **致命缺陷**：ACK/NAK 本身可能损坏 → 发送方不知道发生了什么。

**rdt2.1：处理损坏的 ACK/NAK**

- 给数据包加 **序号 0/1**；发送方重传当前包；接收方用序号判重。
- 状态翻倍（等待 ACK0/ACK1）。

**rdt2.2：无 NAK**

- 只使用 ACK；接收方对正确收到的包回 ACK，并带上**期望的下一个序号**；重复 ACK 触发重传。

**rdt3.0：有丢包**

- 加**定时器**：超时重传；序号 0/1；处理 ACK 丢失、数据丢失、延迟。
- **stop-and-wait**：一次只发一个包，等 ACK；简单但效率低。

**stop-and-wait 性能 ★**

\[
U_{\text{sender}} = \frac{L/R}{RTT + L/R}
\]

- 例：1 Gbps 链路、15 ms RTT、1 KB 包 → U ≈ 0.00027，效率极低。
- 解决：**流水线（pipelining）**：允许多个未确认包同时在途。

### 4.4 流水线协议：GBN 与 SR ★★

**Go-Back-N（GBN）**

- 发送方：窗口 N；连续发送；只为最早的未确认包设一个定时器；超时 → 重传**整个窗口**。
- 接收方：只按序接收；丢弃失序包；对最后一个正确包发 ACK（累积 ACK）。
- 优点：接收方简单、无需缓存失序包；缺点：丢一个包会重传很多。

**Selective Repeat（SR）**

- 发送方：窗口 N；每个包单独定时器；只重传丢失的包。
- 接收方：缓存失序包；对每个正确包单独 ACK；按序交付。
- 窗口大小：**N ≤ 2^(k-1)**（k 为序号位数），否则无法区分新旧包。
- 优点：重传少；缺点：接收方复杂、需要缓存。

**GBN vs SR**

| 维度 | GBN | SR |
|---|---|---|
| 接收方缓存 | 不需要 | 需要 |
| ACK | 累积 ACK | 单独 ACK |
| 重传 | 整个窗口 | 只重传丢失 |
| 定时器 | 一个 | 每个包一个 |
| 窗口 | N | N ≤ 2^(k-1)（约序号空间一半） |

### 4.5 TCP

**概述**

- 点对点、可靠、按序、全双工、面向连接、流量控制、拥塞控制。
- 连接是逻辑的；双方维护状态。

**段结构（最小 20 字节）**

```
源端口 | 目的端口
序号   | 确认号
首部长度|保留|标志|窗口
校验和 | 紧急指针
选项   | 数据
```

- 标志：SYN、ACK、FIN、RST、PSH、URG。
- 序号：字节流编号（不是包编号）；确认号：期望收到的下一个字节。

**序号与 ACK**

- 发送方给每个字节编号；`Seq` 是段首字节序号。
- 接收方 `ACK = 期望的下一个字节序号`；累积确认。
- 例：收到 0–999，回 ACK 1000。

**RTT 估计与超时 ★**

\[
\begin{aligned}
\text{EstimatedRTT} &= (1-\alpha)\cdot\text{EstimatedRTT} + \alpha\cdot\text{SampleRTT}, & \alpha &= 0.125\\
\text{DevRTT} &= (1-\beta)\cdot\text{DevRTT} + \beta\cdot|\text{SampleRTT} - \text{EstimatedRTT}|, & \beta &= 0.25\\
\text{TimeoutInterval} &= \text{EstimatedRTT} + 4\cdot\text{DevRTT}
\end{aligned}
\]

- 超时太长 → 反应慢；太短 → 不必要的重传。

**TCP 发送方（简化）**

- 从应用收数据 → 封装 → 启动定时器 → 发送。
- 超时 → 重传最早未确认段，重启定时器。
- 收到 ACK → 更新窗口，若还有未确认数据则重启定时器。

**快速重传（fast retransmit）**

- 收到 **3 个重复 ACK** → 认为该段丢失，立即重传，不等超时。

**TCP 接收方 ACK 生成**

- 按序收到、之前都已确认 → 延迟 ACK（最多 500 ms）。
- 收到失序段 → 立即发重复 ACK，告知期望的序号。
- 收到填补空缺的段 → 立即 ACK。

**流量控制（flow control）★**

- 目的：防止发送方淹没接收方缓冲区。
- 接收方在头部 **rwnd（receive window）** 通告空闲空间；发送方保证未确认数据 ≤ rwnd。
- 与拥塞控制不同：流量控制是**接收方**限制，拥塞控制是**网络**限制。

**连接管理 ★**

- **三次握手**：
  1. 客户端 → 服务器：`SYN, seq=x`
  2. 服务器 → 客户端：`SYN-ACK, seq=y, ack=x+1`
  3. 客户端 → 服务器：`ACK, ack=y+1`
- 为什么三次：防止旧的重复连接请求造成错误连接；同步双方序号。
- **关闭**：FIN/ACK 四次挥手；TIME_WAIT 等待 2MSL。

### 4.6 拥塞控制

**拥塞的代价**

- 排队延迟增加；丢包（缓冲区溢出）；重传浪费带宽；拥塞崩溃。
- 三种场景：一个路由器/有限缓冲、多个路由器/重传、四发送方/多跳竞争。

**两种方法**

- **端到端**：端系统根据丢包/延迟推断拥塞（TCP）。
- **网络辅助**：路由器显式通知（ECN、ATM ABR）。

**TCP AIMD ★**

- **加性增（AI）**：每个 RTT 拥塞窗口 `cwnd += 1 MSS`。
- **乘性减（MD）**：丢包时 `cwnd = cwnd/2`（Tahoe 降到 1）。
- 锯齿状：探测带宽 → 丢包 → 减半 → 再增。

**慢启动（slow start）**

- 初始 `cwnd = 1 MSS`；每收到一个 ACK，`cwnd += 1 MSS` → 每 RTT 翻倍（指数增长）。
- 到达 `ssthresh` 后进入拥塞避免（线性增长）。
- 超时：`ssthresh = cwnd/2`，`cwnd = 1`，重新慢启动。
- 3 个重复 ACK：快速重传/快速恢复（`ssthresh = cwnd/2`，`cwnd = ssthresh`，然后线性增长）。

**TCP CUBIC**

- 用三次函数（以时间为自变量）增长窗口，更适应高带宽长延迟网络；Linux 默认。
- 比 AIMD 更快恢复、更稳定。

**延迟型拥塞控制**

- 测量 RTT 变化，保持管道“刚好满”而不引起丢包（如 Vegas/BBR 思想）。

**ECN**

- 路由器标记拥塞（而不是丢弃）；接收方回显；发送方降速。

**公平性**

- 目标：K 条 TCP 流共享瓶颈，每条约 `R/K`。
- AIMD 收敛到公平；但 RTT 不同、UDP、并行连接会影响公平。
- 公平不是唯一目标：实时应用可能要求不同待遇。

### 4.7 QUIC（了解）

- 基于 UDP 的应用层协议；HTTP/3 的传输层。
- 流级多路复用（无 TCP 层 HOL）、0/1-RTT 建连、内置加密、连接迁移。
- 在用户态实现，便于快速迭代。

---

## 5. 横向对比（高频简答）

| A | B | 关键区别 |
|---|---|---|
| 分组交换 | 电路交换 | 统计复用/无保证 vs 预留资源/有保证 |
| 传输延迟 <span class="mchip">\(L/R\)</span> | 传播延迟 <span class="mchip">\(d/s\)</span> | 推比特 vs 信号跑 |
| 路由 routing | 转发 forwarding | 全局路径决策 vs 本地端口转发 |
| TCP | UDP | 可靠/有序/流控/拥塞控制 vs 轻量/无连接 |
| 流量控制 | 拥塞控制 | 接收方缓冲 vs 网络容量 |
| GBN | SR | 累积 ACK/重传整个窗口 vs 单独 ACK/只重传丢失 |
| 非持久 HTTP | 持久 HTTP | 每对象 2 RTT vs 1 RTT/连接复用 |
| 迭代 DNS | 递归 DNS | 本地 DNS 自己问 vs 代查到底 |
| HTTP/1.1 | HTTP/2 | 文本/队头阻塞 vs 二进制分帧/多路复用 |
| HTTP/2 | HTTP/3 | TCP HOL vs QUIC/UDP 流级多路复用 |
| C-S | P2P | 服务器带宽瓶颈 vs 可扩展 |

---

## 6. 公式与数字速记

| 项目 | 公式/数值 |
|---|---|
| 节点延迟 | <span class="mchip">\(d = d_{\text{proc}} + d_{\text{queue}} + d_{\text{trans}} + d_{\text{prop}}\)</span> |
| 传输延迟 | <span class="mchip">\(L/R\)</span> |
| 传播延迟 | <span class="mchip">\(d/s\)</span> |
| 流量强度 | <span class="mchip">\(La/R\)</span> |
| 吞吐 | `min(R_s, R_c, ...)` |
| 非持久 HTTP | 每对象约 `2 RTT + L/R` |
| 持久 HTTP | 建连 1 RTT，之后每对象 `1 RTT + L/R` |
| C-S 分发时间 | `max{NF/u_s, F/d_min}` |
| P2P 分发时间 | `max{F/u_s, F/d_min, NF/(u_s+Σu_i)}` |
| stop-and-wait 利用率 | `(L/R)/(RTT + L/R)` |
| TCP RTT 估计 | <span class="mchip">\(\text{EstimatedRTT} = 0.875\cdot\text{EstimatedRTT} + 0.125\cdot\text{SampleRTT}\)</span> |
| TCP 超时 | <span class="mchip">\(\text{EstimatedRTT} + 4\cdot\text{DevRTT}\)</span> |
| TCP 吞吐（近似） | <span class="mchip">\(0.75\cdot\tfrac{W}{RTT}\)</span> |
| UDP 头部 | 8 字节 |
| TCP 头部 | 最小 20 字节 |
| 端口 | HTTP 80、DNS 53、SMTP 25、POP3 110、IMAP 143 |
| DNS 根 | 13 个逻辑集群，每个大量镜像 |
| BitTorrent chunk | 256 KB |
| GBN/SR 窗口 | GBN: N；SR: N ≤ 2^(k-1)（约为序号空间一半） |

---

## 7. 自测（先做，再看答案）

### 第 1 章

1. “nuts and bolts” 视角下，互联网由哪四类组件构成？
2. 协议的三要素是什么？用“问时间”类比说明。
3. 分组交换和电路交换的核心区别？各自优缺点？
4. 写出节点延迟的四个分量；哪些与包长有关？
5. <span class="mchip">\(La/R\)</span> 趋近 1 时会发生什么？为什么？
6. 传输延迟和传播延迟的区别？各自由什么决定？
7. 五层协议栈各层的 PDU 名称？封装过程？
8. 路由和转发的区别？

### 第 2 章

9. Client-Server 与 P2P 的区别？各自优缺点？
10. 套接字由什么标识？TCP 和 UDP 的解复用标识有何不同？
11. 非持久 HTTP 与持久 HTTP 的响应时间差异？RTT 如何定义？
12. Cookie 如何工作？它解决了 HTTP 的什么问题？有什么隐私风险？
13. Web 缓存的作用？条件 GET 如何工作？304 表示什么？
14. HTTP/2 解决了 HTTP/1.1 的什么问题？HTTP/3 又解决了什么？
15. SMTP 与 HTTP 的区别？为什么邮件用推、Web 用拉？
16. DNS 的层次结构？迭代查询与递归查询的区别？
17. DNS 常见 RR 类型及含义？DNS 缓存的作用与风险？
18. P2P 文件分发时间公式？为什么 P2P 可扩展？
19. CDN 如何降低延迟？DASH 如何适应带宽？
20. UDP 与 TCP socket 编程的主要区别？

### 第 3 章

21. 传输层与网络层的区别？多路复用/解复用的作用？
22. UDP 头部字段？校验和覆盖哪些内容？为什么说保护弱？
23. rdt2.0 的致命缺陷？rdt2.1/2.2 如何解决？
24. rdt3.0 如何应对丢包？stop-and-wait 的利用率公式？
25. GBN 与 SR 的窗口、ACK、重传、缓存差异？
26. TCP 段头部最小多少字节？序号和确认号的含义？
27. TCP 如何估计 RTT 和设置超时？α、β 的作用？
28. 快速重传的触发条件？为什么是 3 个重复 ACK？
29. 流量控制和拥塞控制的区别？rwnd 与 cwnd 分别是什么？
30. TCP 三次握手的过程？为什么需要三次？
31. AIMD、慢启动、快速恢复的过程？CUBIC 改进什么？
32. TCP 公平性是什么？哪些因素会破坏公平？
33. QUIC 相比 TCP 的优势？

### 答案（要点）

1. 主机/端系统、分组交换机（路由器/交换机）、通信链路、网络（网络的网络）。
2. 报文格式、顺序/时序、收到报文后的动作；人类问时间→回答，网络请求→响应。
3. 分组：统计复用、适合突发、可能排队/丢包；电路：预留资源、有保证、空闲浪费。
4. 处理、排队、传输 <span class="mchip">\(L/R\)</span>、传播 <span class="mchip">\(d/s\)</span>；传输与包长有关，传播与距离/介质有关。
5. 排队延迟急剧增加、缓冲区溢出丢包；到达速率持续超过输出速率。
6. 传输：把比特推上链路，<span class="mchip">\(L/R\)</span>；传播：信号在介质中跑，<span class="mchip">\(d/s\)</span>。
7. 应用 message、传输 segment、网络 datagram、链路 frame、物理 bit；逐层加头。
8. 路由：全局路径选择（路由协议）；转发：本地把包从输入端口送到输出端口。
9. C-S：always-on 服务器、易管理、服务器瓶颈；P2P：可扩展、难管理、激励问题。
10. IP + 端口；UDP 用目的 IP+目的端口，TCP 用四元组。
11. 非持久每对象 2 RTT；持久建连一次，之后 1 RTT/对象；RTT 是小分组往返时间。
12. Set-Cookie/Cookie 头 + 服务器数据库；弥补 HTTP 无状态；跨站追踪。
13. 减少响应时间/带宽/服务器负载；If-Modified-Since；304 未修改。
14. HTTP/2：二进制分帧、多路复用、头部压缩，缓解 HOL；HTTP/3：QUIC/UDP，流级多路复用，避免 TCP HOL。
15. SMTP 推、HTTP 拉；邮件要主动送达收件服务器，Web 是客户端主动取。
16. 根→TLD→权威→本地；迭代自己问，递归代查。
17. A/AAAA/NS/CNAME/MX；缓存降延迟/负载，但可能过期/投毒。
18. `max{F/u_s, F/d_min, NF/(u_s+Σu_i)}`；peer 上传带宽随 N 增加。
19. 边缘副本、就近服务、减少骨干流量；DASH 分片多码率，客户端按带宽选。
20. UDP 无连接、数据报边界、sendto/recvfrom；TCP 面向连接、字节流、listen/accept/connect。
21. 网络层主机到主机，传输层进程到进程；mux/demux 把段交给正确 socket。
22. 源/目的端口、长度、校验和；伪头部+UDP 段；16 位反码和，保护弱。
23. ACK/NAK 可能损坏；rdt2.1 加序号，rdt2.2 用 ACK+期望序号。
24. 定时器超时重传；<span class="mchip">\(U=\tfrac{L/R}{RTT+L/R}\)</span>。
25. GBN 累积 ACK、一个定时器、重传整个窗口、接收方不缓存；SR 单独 ACK、每包定时器、只重传丢失、缓存失序。
26. 20 字节；Seq 是段首字节编号，ACK 是期望的下一个字节。
27. 指数加权移动平均；α 平滑 SampleRTT，β 平滑偏差；Timeout=EstimatedRTT+4DevRTT。
28. 3 个重复 ACK；说明后续包到了但缺失包没到，网络可能只丢了那一个。
29. 流量控制防接收方溢出（rwnd），拥塞控制防网络过载（cwnd）。
30. SYN、SYN-ACK、ACK；同步序号、防止旧连接请求。
31. AI 每 RTT +1 MSS，MD 丢包减半；慢启动指数增长到 ssthresh；快速恢复在 3 个重复 ACK 后；CUBIC 用三次函数。
32. K 条流共享瓶颈各得约 R/K；不同 RTT、UDP、并行连接会破坏。
33. UDP 上实现、流级多路复用、0/1-RTT、内置加密、连接迁移。
