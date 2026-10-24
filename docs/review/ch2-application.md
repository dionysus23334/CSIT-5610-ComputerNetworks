# 第 2 章 · 应用层 · 复习资料

> **对应课件**：`ch2-8.pdf`（Kurose & Ross, Chapter 2 Application Layer, 8th ed.）
>
> **建议用时**：第一遍 90 分钟 + 例题 40 分钟 + 自测 30 分钟
>
> **配套**：知识大纲 §3
>
> **本章权重**：HTTP（RTT/缓存/HTTP2）、DNS（层次/解析/RR）、P2P 分发公式、Socket 编程是高频考点。

---

## 0. 本章主线（先记住这三句）

1. **应用层只跑在端系统上**：进程通过 **socket** 把数据交给传输层；应用协议定义报文类型、语法、语义、时序。
2. **HTTP 是无状态的请求/响应协议**，用 Cookie 补状态、用缓存降延迟；HTTP/2 解决多对象复用，HTTP/3 用 QUIC 解决 TCP 队头阻塞。
3. **DNS 是分布式的层次数据库**：根 → TLD → 权威 → 本地解析器；UDP 53；缓存提高性能但会过期/被投毒。

**本章常见考法**

| 题型 | 典型问法 | 备考动作 |
|---|---|---|
| 计算 | 非持久/持久 HTTP 的 RTT；P2P vs C-S 分发时间 | 记公式 + 画时序 |
| 流程 | 从 URL 到页面显示；DNS 迭代/递归查询 | 按“解析→TCP→HTTP”串 |
| 比较 | HTTP/1.1 vs 2 vs 3；SMTP vs HTTP；C-S vs P2P | 列表格记关键差异 |
| 机制 | Cookie、缓存、条件 GET、DASH、CDN | 说清“解决什么问题” |
| Socket | UDP/TCP 客户端/服务器调用顺序 | 记 `socket/bind/listen/accept/connect` |

---

## 1. 应用层原理

### 1.1 两种架构 ★

| 架构 | 特点 | 优点 | 缺点 | 例子 |
|---|---|---|---|---|
| **Client-Server** | 服务器 always-on、固定 IP、客户端主动请求 | 易管理、易扩展（数据中心） | 服务器带宽/单点瓶颈 | Web、email、DNS |
| **P2P** | 无 always-on 服务器；peer 既请求又服务 | 可扩展、成本低 | 难管理、churn、激励问题 | BitTorrent |

### 1.2 进程、套接字、寻址 ★

- **进程（process）**：主机上运行的程序。
- 同一主机：进程 ID；跨主机：**IP 地址 + 端口号**。
- **Socket**：应用进程与传输层之间的接口（API 对象）。
- 应用把报文交给 socket；传输层负责送到目的 socket。

**应用层协议要定义**：

1. 报文类型（请求/响应）；
2. 报文语法（字段、格式）；
3. 字段语义；
4. 何时/如何发送、响应规则（时序）。

### 1.3 应用对传输层的需求 ★

| 需求 | 说明 | 典型应用 |
|---|---|---|
| **数据完整性** | 不能丢/错 | 文件传输、Web、email |
| **时延** | 低延迟 | 实时音视频、游戏 |
| **吞吐** | 最小带宽 | 视频流 |
| **安全** | 加密/认证 | 登录、支付 |

**Internet 传输服务**

- **TCP**：可靠、按序、流控、拥塞控制、面向连接；不保证时延/带宽。
- **UDP**：不可靠、无连接、开销小；不保证顺序/完整。
- **TLS**：在 TCP 之上提供加密、认证、完整性；应用通过 TLS 库使用（HTTPS）。

### 1.4 常见应用的传输选择

| 应用 | 传输层 | 原因 |
|---|---|---|
| Web/HTTP | TCP（或 QUIC/UDP） | 需要可靠、按序 |
| 文件传输 | TCP | 不能丢数据 |
| Email/SMTP | TCP | 可靠 |
| DNS | UDP（必要时 TCP） | 短查询、低延迟 |
| 流媒体 | TCP/UDP（DASH/QUIC） | 自适应/低延迟 |
| 实时游戏/语音 | UDP | 宁可丢包也不要等待 |

---

## 2. Web 与 HTTP

### 2.1 HTTP 基础 ★

- **HTTP**：超文本传输协议；**请求/响应**模式；**无状态**。
- 默认端口 **80**；使用 TCP（HTTP/3 用 QUIC/UDP）。
- 客户端：浏览器；服务器：Web server。

**两种连接**

| 类型 | 行为 | 响应时间 |
|---|---|---|
| **非持久（HTTP/1.0）** | 每个对象新建 TCP 连接，用完关闭 | 每对象 **2 RTT + 传输时间** |
| **持久（HTTP/1.1）** | 服务器发送后保持连接；后续请求复用 | 建连 1 RTT；之后每对象 1 RTT；流水线可做到“所有对象约 1 RTT” |

**RTT 定义**：小分组从客户端到服务器再回来的时间（不含传输大文件的时间）。

**非持久 HTTP 的 RTT 账**：

1. 建立 TCP：1 RTT；
2. 发送 HTTP 请求 + 接收响应首字节：1 RTT；
3. 传输对象：`L/R`。
→ 每对象 `2 RTT + L/R`。

**持久 HTTP**：

- 服务器 `Connection: keep-alive`；
- 客户端可连续发送多个请求；
- 无流水线：每个对象 1 RTT；有流水线：多个请求连续发，所有对象可近似 **1 RTT** 后陆续到达。

### 2.2 HTTP 报文 ★

**请求**

```http
GET /index.html HTTP/1.1\r\n
Host: www.example.com\r\n
User-Agent: ...\r\n
Accept: text/html\r\n
Connection: keep-alive\r\n
\r\n
```

- 请求行：方法、URL、版本。
- 方法：**GET、POST、HEAD、PUT、DELETE**。
- 头部：Host、User-Agent、Accept、Accept-Language、Connection、Cookie 等。

**响应**

```http
HTTP/1.1 200 OK\r\n
Date: ...\r\n
Server: ...\r\n
Content-Length: 1234\r\n
Content-Type: text/html\r\n
\r\n
（实体）
```

**状态码**

| 码 | 含义 |
|---|---|
| 200 | OK |
| 301 | Moved Permanently（永久重定向） |
| 304 | Not Modified（缓存有效） |
| 400 | Bad Request |
| 403 | Forbidden |
| 404 | Not Found |
| 505 | HTTP Version Not Supported |

### 2.3 Cookie ★★

**问题**：HTTP 无状态，服务器如何“记住”用户？

**机制**：

1. 服务器响应带 `Set-Cookie: user=alice; ...`；
2. 浏览器保存 cookie（按域/路径）；
3. 后续请求带 `Cookie: user=alice`；
4. 服务器用后端数据库关联用户状态。

**用途**：购物车、会话、个性化、追踪。

**风险**：跨站追踪、隐私；Cookie 是“弱认证”，不能替代真正的认证/授权。

### 2.4 Web 缓存（代理服务器）★★

- **缓存**：保存最近请求的响应；命中则直接返回，不访问源服务器。
- 作用：降低响应时间、减少出口带宽、减轻源服务器负载。
- 缓存既可以是客户端，也可以是服务器（代理）。

**条件 GET（conditional GET）**

1. 缓存有对象，但可能过期；
2. 发请求带 `If-Modified-Since: <date>`；
3. 服务器未修改 → **304 Not Modified**（无实体）；
4. 缓存把本地副本返回给客户端。

**缓存一致性**：`Cache-Control`、`Expires`、ETag/If-None-Match。

**缓存计算例**（课件）：

- 接入链路 1.54 Mbps，RTT 2 s，对象 100 Kbit，请求率 15/s。
- 平均数据率 `15×100K = 1.5 Mbps` → 利用率 `1.5/1.54 ≈ 0.97` → 排队延迟“minutes”。
- 方案 1：升级到 154 Mbps → 利用率 0.0097，延迟 ~2 s + ms，但昂贵。
- 方案 2：加缓存，命中率 0.4 → 只有 60% 请求走接入链路 → 平均 0.9 Mbps → 利用率 0.58，延迟 ~2 s + ms，便宜。
- 结论：**缓存通常比升级带宽更划算**。

### 2.5 HTTP/2 与 HTTP/3 ★

**HTTP/1.1 的问题**

- 每个连接一次一个请求/响应（无流水线时）；
- 多对象需要多个连接；
- 队头阻塞（HOL blocking）：一个大对象挡住后面的小对象；
- 头部重复、文本格式冗余。

**HTTP/2**

- **二进制分帧**：把报文分成 frame；
- **多路复用**：一个 TCP 连接上并发多个 stream；
- **头部压缩（HPACK）**；
- 仍受 **TCP 层 HOL** 影响（丢一个 TCP 段，所有 stream 都等）。

**HTTP/3**

- 基于 **QUIC（UDP）**；
- 流级多路复用：一个流丢包不影响其他流；
- 0/1-RTT 建连；
- 内置 TLS 1.3 加密；
- 连接迁移（手机切换网络）。

---

## 3. 电子邮件

### 3.1 组成

- **用户代理（UA）**：Outlook、手机邮件 App。
- **邮件服务器**：发送方/接收方服务器；维护邮箱、队列。
- **SMTP**：发送/转发邮件。
- **邮件访问协议**：POP3、IMAP、HTTP（Webmail）。

### 3.2 SMTP ★

- **推（push）**：发送方 UA → 发送方邮件服务器 → 接收方邮件服务器。
- 使用 **TCP 端口 25**；命令/响应为 ASCII。
- 流程：
  1. 客户端 `HELO`；
  2. `MAIL FROM`；
  3. `RCPT TO`；
  4. `DATA` → 邮件内容 → `.`；
  5. `QUIT`。
- SMTP 是“服务器到服务器”的协议；UA 到服务器也用 SMTP（提交）。

### 3.3 邮件访问

| 协议 | 端口 | 特点 |
|---|---|---|
| **POP3** | 110 | 简单下载；通常下载后删除/保留 |
| **IMAP** | 143 | 服务器端文件夹、已读/未读状态；多设备同步 |
| **HTTP** | 80/443 | Webmail |

### 3.4 邮件格式与 MIME

- 头部：From、To、Subject、Date、Cc、Bcc。
- 空行后是正文。
- **MIME**：支持非 ASCII 文本、附件、多部分（multipart）；`Content-Type`、`Content-Transfer-Encoding`。

### 3.5 SMTP vs HTTP

| 维度 | SMTP | HTTP |
|---|---|---|
| 方向 | 推（发送方主动） | 拉（客户端请求） |
| 用途 | 邮件传输 | Web 内容 |
| 传输 | TCP 25 | TCP 80 |
| 格式 | ASCII 命令/响应 | 文本请求/响应 |

---

## 4. DNS

### 4.1 作用 ★

- 域名 → IP 地址；
- 主机别名（CNAME）；
- 邮件服务器别名（MX）；
- 负载分配（多个 A 记录）。

**为什么不用集中式**：单点故障、流量集中、距离远、维护困难。

### 4.2 层次结构 ★★

```
根 DNS 服务器（root）
  → 顶级域 TLD（.com、.org、.cn、.edu）
    → 权威 DNS 服务器（authoritative）
本地 DNS 服务器（local resolver，ISP/组织提供）
```

- **根**：13 个逻辑集群，全球大量镜像（美国约 200 台）；ICANN 管理。
- **TLD**：管理 .com/.org/.cn 等；返回权威服务器地址。
- **权威**：组织自己的 DNS，保存主机名→IP 的权威记录。
- **本地 DNS**：代理查询、缓存；通常由 ISP/学校提供。

### 4.3 解析过程 ★★

**迭代查询（iterative）**

1. 主机问本地 DNS；
2. 本地 DNS 问根 → 根返回 .com TLD 地址；
3. 本地 DNS 问 .com TLD → 返回 amazon.com 权威地址；
4. 本地 DNS 问权威 → 返回 IP；
5. 本地 DNS 把结果给主机并缓存。

**递归查询（recursive）**

- 主机要求本地 DNS“替我查到底”；本地 DNS 负责所有后续查询。
- 根/TLD 通常不做递归（只给下一跳）。

**实际组合**：主机→本地 DNS 递归；本地 DNS→根/TLD/权威迭代。

### 4.4 缓存

- 任何一层都可缓存；TTL 控制过期。
- 优点：降低延迟、减少根/TLD 负载。
- 缺点：过期记录可能不一致（“best-effort”）。

### 4.5 资源记录（RR）★

| 类型 | 含义 | 例子 |
|---|---|---|
| **A** | 主机名 → IPv4 | `www.example.com → 1.2.3.4` |
| **NS** | 域的权威 DNS 服务器 | `example.com → dns.example.com` |
| **CNAME** | 别名 → 规范名 | `www.ibm.com → servereast.backup2.ibm.com` |
| **MX** | 域的邮件服务器 | `example.com → mail.example.com` |
| AAAA（补充） | 主机名 → IPv6 | — |

格式：`(name, value, type, ttl)`。

### 4.6 DNS 报文

- 头部：16-bit ID、flags、问题数、回答数、权威数、附加数。
- 四段：questions、answers、authority、additional。
- 查询与响应格式相同；ID 用于匹配请求/响应。

### 4.7 DNS 安全 ⚔

| 攻击 | 说明 | 防御 |
|---|---|---|
| **DDoS** | 攻击根/TLD/权威，或大量查询 | 限流、anycast、冗余 |
| **缓存投毒** | 伪造响应，让缓存保存假记录 | DNSSEC、随机化 ID/端口、0x20 |
| **伪造响应** | 猜 ID/端口，抢先回复 | 随机化、源端口随机 |
| **DNS 欺骗** | 修改本地 hosts/DNS 配置 | 加密 DNS、DNSSEC |

- **DNSSEC**：对 DNS 记录签名，提供认证和完整性（不提供机密性）。

---

## 5. P2P 应用

### 5.1 文件分发时间 ★★

**Client-Server**

```
D_cs = max{ N·F / u_s , F / d_min }
```

- 服务器必须上传 N 份：`N·F/u_s`；
- 最慢客户端下载：`F/d_min`。

**P2P**

```
D_p2p = max{ F/u_s , F/d_min , N·F / (u_s + Σ u_i) }
```

- 服务器至少上传一份：`F/u_s`；
- 最慢客户端：`F/d_min`；
- 所有 peer 总上传能力：`u_s + Σu_i`，要分发 `N·F` 比特。

**结论**：C-S 随 N 线性增长；P2P 的分母随 N 增长，因此**可扩展**。

### 5.2 BitTorrent ★

- 文件切成 **256 KB** 的 chunk。
- **tracker**：记录参与 torrent 的 peer。
- peer 加入：向 tracker 要 peer 列表，连接部分邻居。
- 请求：**rarest first**（先要最稀有的块）。
- 上传：**tit-for-tat**：
  - 每 10 秒重新评估，优先给上传速率最高的 4 个 peer；
  - 每 30 秒“乐观 unchoke”一个随机 peer，给它机会。
- **churn**：peer 随时加入/离开；下载完可留下或离开。

---

## 6. 视频流与 CDN

### 6.1 视频基础

- 视频 = 图像序列；压缩利用空间/时间冗余。
- **CBR**（恒定比特率）vs **VBR**（可变比特率）。
- 流式播放挑战：连续播放约束、网络抖动、带宽变化。

### 6.2 播放缓冲

- 客户端预缓冲若干秒，吸收网络抖动；
- 代价：启动延迟；缓冲太小 → 卡顿，太大 → 延迟高。

### 6.3 DASH

- **Dynamic Adaptive Streaming over HTTP**：
  - 视频切成短片段，每个片段提供多个码率；
  - 客户端测量带宽，按需选择码率；
  - 用 HTTP 拉取，穿过 NAT/防火墙方便。

### 6.4 CDN ★

- **Content Distribution Network**：把内容副本放到边缘节点。
- 用户被 DNS/HTTP 重定向到最近/最优节点。
- 优点：降低延迟、减少骨干流量、提高可用性。
- **OTT**：内容提供商越过传统运营商，自建 CDN/网络（Netflix、YouTube）。

---

## 7. Socket 编程

### 7.1 UDP

**服务器**

```python
sock = socket(AF_INET, SOCK_DGRAM)
sock.bind(('', port))
loop:
    data, addr = sock.recvfrom(2048)
    sock.sendto(reply, addr)
```

**客户端**

```python
sock = socket(AF_INET, SOCK_DGRAM)
sock.sendto(msg, (server, port))
data, addr = sock.recvfrom(2048)
```

- 无连接；`sendto/recvfrom` 保留数据报边界；可能丢包/乱序。

### 7.2 TCP

**服务器**

```python
sock = socket(AF_INET, SOCK_STREAM)
sock.bind(('', port))
sock.listen(5)
conn, addr = sock.accept()
conn.recv(1024)
conn.send(reply)
conn.close()
```

**客户端**

```python
sock = socket(AF_INET, SOCK_STREAM)
sock.connect((server, port))
sock.send(msg)
sock.recv(1024)
```

- 面向连接；字节流，无消息边界；需要自己定界（长度前缀/换行）。

### 7.3 UDP vs TCP Socket

| 维度 | UDP | TCP |
|---|---|---|
| 连接 | 无 | 三次握手 |
| 边界 | 保留 | 字节流 |
| 可靠性 | 不保证 | 可靠/按序 |
| 调用 | sendto/recvfrom | connect/listen/accept/send/recv |

---

## 8. 例题精讲

### 例 1：HTTP RTT（10 分）

**题**：RTT=100 ms，10 个对象，每个对象传输时间 1 ms。分别求非持久 HTTP、持久 HTTP（无流水线）、持久 HTTP（流水线）的总时间（忽略 DNS）。

**解**：
- 非持久：`10 × (2×100 + 1) = 2010 ms`。
- 持久无流水线：建连 100 ms + 10 × (100 + 1) = **1110 ms**。
- 持久流水线：建连 100 ms + 请求/首字节 100 ms + 10×1 ms ≈ **210 ms**。
- 结论：持久 + 流水线大幅减少 RTT 开销。

### 例 2：缓存收益（10 分）

**题**：接入链路 1.54 Mbps，对象 100 Kbit，请求率 15/s，RTT 2 s。求无缓存利用率；若缓存命中率 0.4，求利用率。

**解**：
- 平均数据率 `15×100 Kbit = 1.5 Mbps`；利用率 `1.5/1.54 ≈ 0.97` → 高排队延迟。
- 缓存命中 0.4 → 只有 60% 走链路 → `0.6×1.5 = 0.9 Mbps`；利用率 `0.9/1.54 ≈ 0.58` → 延迟显著下降。
- 结论：缓存比升级带宽更经济。

### 例 3：DNS 查询（10 分）

**题**：`www.example.com` 不在任何缓存中，描述迭代查询过程。

**解**：
1. 主机 → 本地 DNS（递归请求）；
2. 本地 DNS → 根：返回 `.com` TLD 地址；
3. 本地 DNS → `.com` TLD：返回 `example.com` 权威地址；
4. 本地 DNS → 权威：返回 `www.example.com` 的 A 记录；
5. 本地 DNS 缓存并返回给主机。

### 例 4：P2P 分发（10 分）

**题**：F=1 GB，u_s=10 Mbps，N=10，每个 peer u_i=1 Mbps，d_min=10 Mbps。求 C-S 与 P2P 的分发时间。

**解**：
- `F = 8 Gbit = 8000 Mbit`。
- C-S：`max{10×8000/10, 8000/10} = max{8000, 800} = 8000 s`。
- P2P：`max{8000/10=800, 800, 10×8000/(10+10)=4000} = 4000 s`。
- P2P 约为 C-S 的一半；N 越大优势越明显。

### 例 5：Socket 顺序（8 分）

**题**：写出 TCP 服务器和客户端建立连接、收发数据的调用顺序。

**解**：
- 服务器：`socket → bind → listen → accept → recv → send → close`。
- 客户端：`socket → connect → send → recv → close`。

---

## 9. 易错点（考场最易丢分）

| 错误 | 正确 |
|---|---|
| HTTP 是有状态协议 | HTTP **无状态**；Cookie 补状态 |
| 非持久 HTTP 每对象 1 RTT | **2 RTT** + 传输时间 |
| 持久 HTTP 一定没有 RTT 开销 | 建连 1 RTT；无流水线每对象 1 RTT；流水线可近似 1 RTT 总计 |
| Cookie 是认证机制 | 只是状态管理，认证能力很弱 |
| 缓存一定能保证最新 | 可能过期；需条件 GET/304 |
| DNS 只有 13 台物理服务器 | 是 13 个**逻辑集群**，每个大量镜像 |
| DNS 查询总是递归 | 主机→本地通常递归；本地→根/TLD 通常迭代 |
| SMTP 是拉协议 | SMTP **推**；POP3/IMAP 是拉 |
| P2P 一定比 C-S 快 | 取决于 peer 上传带宽/数量；公式取 max |
| UDP 没有校验和 | UDP 有 16-bit 校验和（可选但通常启用） |
| TCP 是消息边界协议 | TCP 是**字节流**，无消息边界 |
| HTTP/2 完全解决 HOL | 只解决 HTTP 层；TCP 层 HOL 仍在，HTTP/3 才解决 |

---

## 10. 自测（先做，再看答案）

1. Client-Server 与 P2P 的区别？各自优缺点？
2. 套接字由什么标识？TCP 和 UDP 的解复用标识有何不同？
3. 非持久 HTTP 与持久 HTTP 的响应时间差异？RTT 如何定义？
4. Cookie 如何工作？它解决了 HTTP 的什么问题？有什么隐私风险？
5. Web 缓存的作用？条件 GET 如何工作？304 表示什么？
6. HTTP/2 解决了 HTTP/1.1 的什么问题？HTTP/3 又解决了什么？
7. SMTP 与 HTTP 的区别？为什么邮件用推、Web 用拉？
8. DNS 的层次结构？迭代查询与递归查询的区别？
9. DNS 常见 RR 类型及含义？DNS 缓存的作用与风险？
10. P2P 文件分发时间公式？为什么 P2P 可扩展？
11. CDN 如何降低延迟？DASH 如何适应带宽？
12. UDP 与 TCP socket 编程的主要区别？

### 答案

1. C-S：always-on 服务器、易管理、服务器瓶颈；P2P：可扩展、难管理、激励问题。
2. IP + 端口；UDP 用目的 IP+目的端口，TCP 用四元组。
3. 非持久每对象 2 RTT；持久建连一次，之后 1 RTT/对象（流水线可 1 RTT 总计）；RTT 是小分组往返时间。
4. Set-Cookie/Cookie 头 + 服务器数据库；弥补 HTTP 无状态；跨站追踪。
5. 减少响应时间/带宽/服务器负载；If-Modified-Since；304 未修改。
6. HTTP/2：二进制分帧、多路复用、头部压缩，缓解 HTTP 层 HOL；HTTP/3：QUIC/UDP，流级多路复用，避免 TCP HOL。
7. SMTP 推、HTTP 拉；邮件要主动送达收件服务器，Web 是客户端主动取。
8. 根→TLD→权威→本地；迭代自己问，递归代查。
9. A/NS/CNAME/MX（+AAAA）；缓存降延迟/负载，但可能过期/投毒。
10. `max{F/u_s, F/d_min, NF/(u_s+Σu_i)}`；peer 上传带宽随 N 增加。
11. 边缘副本、就近服务、减少骨干流量；DASH 分片多码率，客户端按带宽选。
12. UDP 无连接、数据报边界、sendto/recvfrom；TCP 面向连接、字节流、listen/accept/connect。

---

## 11. 考前速记卡

| 项目 | 内容 |
|---|---|
| 架构 | C-S（always-on）/ P2P（对等） |
| 标识 | IP + 端口；TCP 四元组 |
| HTTP | 无状态；TCP 80；请求/响应 |
| 非持久 | 2 RTT + 传输/对象 |
| 持久 | 建连 1 RTT；复用连接；流水线 |
| Cookie | Set-Cookie/Cookie + 后端 DB |
| 缓存 | 命中降延迟；条件 GET/304 |
| HTTP/2 | 二进制分帧、多路复用、HPACK |
| HTTP/3 | QUIC/UDP、流级多路复用 |
| SMTP | 推；TCP 25 |
| 邮件访问 | POP3 110 / IMAP 143 |
| DNS | 根→TLD→权威→本地；UDP 53 |
| RR | A/NS/CNAME/MX |
| P2P | `max{F/us,F/dmin,NF/(us+Σui)}` |
| BitTorrent | 256 KB chunk；rarest first；tit-for-tat |
| CDN | 边缘副本；DASH 自适应 |
| Socket | UDP sendto/recvfrom；TCP listen/accept/connect |
