# Chapter 2 · Application Layer · Review Notes

> **Matching slides**: `ch2-8.pdf` (Kurose & Ross, Chapter 2 Application Layer, 8th ed.)
>
> **Suggested time**: first pass 90 minutes + worked examples 40 minutes + self-test 30 minutes
>
> **Companion**: Outline §3
>
> **Weight of this chapter**: HTTP (RTT / caching / HTTP2), DNS (hierarchy / resolution / RR), the P2P distribution formula, and socket programming are high-frequency exam points.

---

## 0. Chapter thread (memorize these three sentences first)

1. **The application layer runs only on end systems**: a process hands data to the transport layer through its **socket**; an application protocol defines message types, syntax, semantics, and timing.
2. **HTTP is a stateless request/response protocol**; cookies add state and caches reduce delay; HTTP/2 solves multiplexing of multiple objects, and HTTP/3 uses QUIC to solve TCP head-of-line blocking.
3. **DNS is a distributed, hierarchical database**: root → TLD → authoritative → local resolver; UDP 53; caching improves performance but entries expire / get poisoned.

**Common question types in this chapter**

| Question type | Typical phrasing | What to prepare |
|---|---|---|
| Calculation | RTT of non-persistent / persistent HTTP; P2P vs C-S distribution time | Remember the formulas + draw the timing diagram |
| Procedure | From URL to page display; DNS iterated / recursive query | Chain it as “resolution → TCP → HTTP” |
| Comparison | HTTP/1.1 vs 2 vs 3; SMTP vs HTTP; C-S vs P2P | Make a table of the key differences |
| Mechanism | cookies, caches, conditional GET, DASH, CDN | Explain clearly “what problem it solves” |
| Socket | call order of the UDP/TCP client and server | Remember `socket/bind/listen/accept/connect` |

---

## 1. Application layer principles

### 1.1 Two architectures ★

| Architecture | Characteristics | Advantages | Disadvantages | Examples |
|---|---|---|---|---|
| **Client-Server** | server always-on, permanent IP address, client initiates requests | easy to manage, easy to scale (data centers) | server bandwidth / single point of bottleneck | Web, email, DNS |
| **P2P** | no always-on server; peers both request and provide service | scalable, low cost | complex management, churn, incentive problem | BitTorrent |

### 1.2 Processes, sockets, addressing ★

- **Process**: program running within a host.
- Same host: process ID; across hosts: **IP address + port number**.
- **Socket**: the interface between the application process and the transport layer (an API object).
- The application hands messages to the socket; the transport layer delivers them to the destination socket.

**An application-layer protocol defines**:

1. types of messages exchanged (request, response);
2. message syntax (fields, format);
3. field semantics;
4. rules for when and how messages are sent and responded to (timing).

### 1.3 What transport service does an app need? ★

| Requirement | Description | Typical applications |
|---|---|---|
| **Data integrity** | no loss / no errors | file transfer, Web, email |
| **Timing** | low delay | real-time audio/video, games |
| **Throughput** | minimum bandwidth | streaming video |
| **Security** | encryption / authentication | login, payment |

**Internet transport services**

- **TCP**: reliable, in-order, flow control, congestion control, connection-oriented; does not provide timing or minimum throughput guarantee.
- **UDP**: unreliable, connectionless, low overhead; does not guarantee order or integrity.
- **TLS**: provides encryption, authentication and data integrity on top of TCP; applications use it through TLS libraries (HTTPS).

### 1.4 Transport choices for common apps

| Application | Transport | Reason |
|---|---|---|
| Web/HTTP | TCP (or QUIC/UDP) | needs reliability and in-order delivery |
| File transfer | TCP | cannot lose data |
| Email/SMTP | TCP | reliable |
| DNS | UDP (TCP when needed) | short queries, low delay |
| Streaming media | TCP/UDP (DASH/QUIC) | adaptive / low delay |
| Real-time games / voice | UDP | better to lose packets than to wait |

---

## 2. Web and HTTP

### 2.1 HTTP basics ★

- **HTTP**: hypertext transfer protocol; **request/response** model; **stateless**.
- default port **80**; uses TCP (HTTP/3 uses QUIC/UDP).
- client: browser; server: Web server.

**Two types of connections**

| Type | Behavior | Response time |
|---|---|---|
| **Non-persistent (HTTP/1.0)** | a new TCP connection per object, closed after use | **2 RTT + file transmission time** per object |
| **Persistent (HTTP/1.1)** | server leaves the connection open after sending; subsequent requests reuse it | 1 RTT to set up the connection; then 1 RTT per object; with pipelining, “as little as one RTT for all the referenced objects” |

**RTT (definition)**: time for a small packet to travel from client to server and back (excluding the time to transmit the large file).

**The RTT account of non-persistent HTTP**:

1. initiate TCP connection: one RTT;
2. send the HTTP request and receive the first few bytes of the HTTP response: one RTT;
3. object transmission time: <span class="mchip">\(L/R\)</span>.
→ per object `2 RTT + L/R`.

**Persistent HTTP**:

- server sends `Connection: keep-alive`;
- the client can send multiple requests back to back;
- without pipelining: one RTT per object; with pipelining: several requests are sent back to back, so all objects can arrive one after another after roughly **one RTT**.

### 2.2 HTTP messages ★

**Request**

```http
GET /index.html HTTP/1.1\r\n
Host: www.example.com\r\n
User-Agent: ...\r\n
Accept: text/html\r\n
Connection: keep-alive\r\n
\r\n
```

- request line: method, URL, version.
- methods: **GET, POST, HEAD, PUT, DELETE**.
- header lines: Host, User-Agent, Accept, Accept-Language, Connection, Cookie, etc.

**Response**

```http
HTTP/1.1 200 OK\r\n
Date: ...\r\n
Server: ...\r\n
Content-Length: 1234\r\n
Content-Type: text/html\r\n
\r\n
(entity body)
```

**Status codes**

| Code | Meaning |
|---|---|
| 200 | OK |
| 301 | Moved Permanently (permanent redirect) |
| 304 | Not Modified (cached copy is up to date) |
| 400 | Bad Request |
| 403 | Forbidden |
| 404 | Not Found |
| 505 | HTTP Version Not Supported |

### 2.3 Cookies ★★

**Question**: HTTP is stateless, so how does the server “remember” the user?

**Mechanism**:

1. the server's response carries `Set-Cookie: user=alice; ...`;
2. the browser stores the cookie (per domain / path);
3. subsequent requests carry `Cookie: user=alice`;
4. the server uses a back-end database to associate the user state.

**Uses**: shopping carts, sessions, personalization, tracking.

**Risks**: cross-site tracking, privacy; a cookie is “weak authentication” and cannot replace real authentication / authorization.

### 2.4 Web caches (proxy servers) ★★

- **Cache**: stores responses to recent requests; on a hit it returns the object directly without contacting the origin server.
- Effects: reduce response time, reduce traffic on the access link, reduce the load on the origin server.
- A cache acts as both client and server (proxy).

**Conditional GET**

1. the cache has the object, but it may be out of date;
2. it sends a request with `If-Modified-Since: <date>`;
3. the object has not been modified at the server → **304 Not Modified** (no entity body);
4. the cache returns its local copy to the client.

**Cache consistency**: `Cache-Control`, `Expires`, ETag/If-None-Match.

**Caching example (slides)**:

- access link 1.54 Mbps, RTT 2 s, object 100 Kbit, request rate 15/s.
- average data rate <span class="mchip">\(15\times100\text{K} = 1.5\ \text{Mbps}\)</span> → utilization <span class="mchip">\(\tfrac{1.5}{1.54}\approx0.97\)</span> → queueing delay of “minutes”.
- Option 1: upgrade to 154 Mbps → utilization 0.0097, delay ~2 s + ms, but expensive.
- Option 2: install a cache, hit rate 0.4 → only 60% of requests go over the access link → average 0.9 Mbps → utilization 0.58, delay ~2 s + ms, cheap.
- Conclusion: **caching is usually cheaper than upgrading bandwidth**.

### 2.5 HTTP/2 and HTTP/3 ★

**Problems with HTTP/1.1**

- one request/response at a time per connection (without pipelining);
- multiple objects require multiple connections;
- head-of-line (HOL) blocking: a large object blocks the small objects behind it;
- repeated headers and a redundant text format.

**HTTP/2**

- **binary framing**: messages are divided into frames;
- **multiplexing**: multiple streams concurrently over one TCP connection;
- **header compression (HPACK)**;
- still affected by **HOL blocking at the TCP layer** (lose one TCP segment and all streams wait).

**HTTP/3**

- based on **QUIC (UDP)**;
- stream-level multiplexing: packet loss on one stream does not affect the other streams;
- 0/1-RTT connection setup;
- built-in TLS 1.3 encryption;
- connection migration (phone switching networks).

---

## 3. E-mail

### 3.1 Components

- **User agent (UA)**: Outlook, phone mail app.
- **Mail servers**: sender / receiver servers; maintain the user mailbox and the message queue.
- **SMTP**: sends / forwards e-mail messages.
- **Mail access protocols**: POP3, IMAP, HTTP (Webmail).

### 3.2 SMTP ★

- **Push**: sender UA → sender mail server → receiver mail server.
- uses **TCP port 25**; commands / responses are ASCII.
- procedure:
  1. client `HELO`;
  2. `MAIL FROM`;
  3. `RCPT TO`;
  4. `DATA` → message content → `.`;
  5. `QUIT`.
- SMTP is a “server-to-server” protocol; UA-to-server also uses SMTP (submission).

### 3.3 Mail access

| Protocol | Port | Characteristics |
|---|---|---|
| **POP3** | 110 | simple download; usually delete / keep after download |
| **IMAP** | 143 | server-side folders, read / unread state; multi-device synchronization |
| **HTTP** | 80/443 | Webmail |

### 3.4 Mail message format and MIME

- Header lines: From, To, Subject, Date, Cc, Bcc.
- A blank line separates the header from the body.
- **MIME**: supports non-ASCII text, attachments, multipart bodies; `Content-Type`, `Content-Transfer-Encoding`.

### 3.5 SMTP vs HTTP

| Dimension | SMTP | HTTP |
|---|---|---|
| Direction | push (sender initiates) | pull (client requests) |
| Purpose | e-mail transfer | Web content |
| Transport | TCP 25 | TCP 80 |
| Format | ASCII commands / responses | text requests / responses |

---

## 4. DNS

### 4.1 Services ★

- hostname-to-IP-address translation;
- host aliasing (CNAME);
- mail server aliasing (MX);
- load distribution (multiple A records).

**Why not centralize DNS**: single point of failure, traffic volume, distant centralized database, maintenance.

### 4.2 Hierarchical structure ★★

```
Root DNS servers (root)
  → Top-Level Domain TLD (.com, .org, .cn, .edu)
    → Authoritative DNS servers (authoritative)
Local DNS server (local resolver, provided by ISP / organization)
```

- **Root**: 13 logical clusters, replicated many times worldwide (~200 servers in the US); managed by ICANN.
- **TLD**: responsible for .com/.org/.cn, etc.; returns the address of the authoritative server.
- **Authoritative**: the organization's own DNS, holding authoritative hostname→IP records.
- **Local DNS**: forwards queries, caches; usually provided by the ISP / school.

### 4.3 Name resolution process ★★

**Iterated query**

1. the host asks its local DNS server;
2. the local DNS server asks the root → the root returns the .com TLD address;
3. the local DNS server asks the .com TLD → it returns the amazon.com authoritative address;
4. the local DNS server asks the authoritative server → it returns the IP address;
5. the local DNS server returns the result to the host and caches it.

**Recursive query**

- the host asks the local DNS server to “resolve it completely on my behalf”; the local DNS server is responsible for all subsequent queries.
- root / TLD servers usually do not do recursion (they only give the next hop).

**In practice**: host→local DNS is recursive; local DNS→root/TLD/authoritative is iterative.

### 4.4 Caching

- any name server can cache; TTL controls expiration.
- Advantages: lower delay, less load on the root / TLD servers.
- Disadvantage: cached entries may be out of date (“best-effort”).

### 4.5 Resource records (RR) ★

| Type | Meaning | Example |
|---|---|---|
| **A** | hostname → IPv4 | `www.example.com → 1.2.3.4` |
| **NS** | authoritative DNS server for the domain | `example.com → dns.example.com` |
| **CNAME** | alias name → canonical name | `www.ibm.com → servereast.backup2.ibm.com` |
| **MX** | mail server for the domain | `example.com → mail.example.com` |
| AAAA (supplementary) | hostname → IPv6 | — |

Format: `(name, value, type, ttl)`.

### 4.6 DNS messages

- Header: 16-bit ID, flags, # questions, # answer RRs, # authority RRs, # additional RRs.
- Four sections: questions, answers, authority, additional.
- Query and reply messages have the same format; the ID is used to match request / response.

### 4.7 DNS security ⚔

| Attack | Description | Defense |
|---|---|---|
| **DDoS** | bombard the root / TLD / authoritative servers, or send a flood of queries | rate limiting, anycast, redundancy |
| **Cache poisoning** | forge a reply so that the cache stores a bogus record | DNSSEC, randomized ID / port, 0x20 |
| **Spoofed reply** | guess the ID / port and answer first | randomization, source port randomization |
| **DNS spoofing** | modify the local hosts / DNS configuration | encrypted DNS, DNSSEC |

- **DNSSEC**: signs DNS records, providing authentication and message integrity (not confidentiality).

---

## 5. P2P applications

### 5.1 File distribution time ★★

**Client-Server**

\[
D_{\text{cs}} = \max\left\{\frac{NF}{u_s},\ \frac{F}{d_{\min}}\right\}
\]

- the server must upload N copies: <span class="mchip">\(\tfrac{NF}{u_s}\)</span>;
- the slowest client's download: `F/d_min`.

**P2P**

\[
D_{\text{p2p}} = \max\left\{\frac{F}{u_s},\ \frac{F}{d_{\min}},\ \frac{NF}{u_s + \sum_i u_i}\right\}
\]

- the server must upload at least one copy: `F/u_s`;
- the slowest client: `F/d_min`;
- the total upload capacity of all peers: <span class="mchip">\(u_s + \sum u_i\)</span>, and <span class="mchip">\(NF\)</span> bits must be distributed.

**Conclusion**: C-S grows linearly in N; the denominator for P2P grows with N, so P2P is **scalable**.

### 5.2 BitTorrent ★

- the file is divided into chunks of **256 KB**.
- **tracker**: tracks the peers participating in the torrent.
- a peer joins: it asks the tracker for a list of peers and connects to a subset of neighbors.
- requesting: **rarest first** (ask for the rarest chunks first).
- sending: **tit-for-tat**:
  - re-evaluate every 10 seconds, preferring the 4 peers with the highest upload rate;
  - every 30 seconds “optimistically unchoke” one random peer, giving it a chance.
- **churn**: peers may come and go at any time; once the download is complete a peer may leave or remain.

---

## 6. Video streaming and CDNs

### 6.1 Video basics

- video = a sequence of images; compression exploits spatial / temporal redundancy.
- **CBR** (constant bit rate) vs **VBR** (variable bit rate).
- streaming challenges: the continuous playout constraint, network jitter, changing bandwidth.

### 6.2 Playout buffering

- the client pre-buffers a few seconds to absorb network jitter;
- cost: start-up delay; a buffer that is too small → stalling, too large → high delay.

### 6.3 DASH

- **Dynamic Adaptive Streaming over HTTP**:
  - the video is divided into short chunks, each offered at multiple rates;
  - the client measures the bandwidth and chooses the rate on demand;
  - chunks are pulled over HTTP, which passes through NAT / firewalls easily.

### 6.4 CDN ★

- **Content Distribution Network**: places copies of content at edge nodes.
- users are redirected by DNS / HTTP to the nearest / optimal node.
- Advantages: lower delay, less backbone traffic, higher availability.
- **OTT**: the content provider goes over the top of traditional operators and builds its own CDN / network (Netflix, YouTube).

---

## 7. Socket programming

### 7.1 UDP

**Server**

```python
sock = socket(AF_INET, SOCK_DGRAM)
sock.bind(('', port))
loop:
    data, addr = sock.recvfrom(2048)
    sock.sendto(reply, addr)
```

**Client**

```python
sock = socket(AF_INET, SOCK_DGRAM)
sock.sendto(msg, (server, port))
data, addr = sock.recvfrom(2048)
```

- connectionless; `sendto/recvfrom` preserve datagram boundaries; packets may be lost or arrive out of order.

### 7.2 TCP

**Server**

```python
sock = socket(AF_INET, SOCK_STREAM)
sock.bind(('', port))
sock.listen(5)
conn, addr = sock.accept()
conn.recv(1024)
conn.send(reply)
conn.close()
```

**Client**

```python
sock = socket(AF_INET, SOCK_STREAM)
sock.connect((server, port))
sock.send(msg)
sock.recv(1024)
```

- connection-oriented; byte stream with no message boundaries; you must delimit messages yourself (length prefix / newline).

### 7.3 UDP vs TCP sockets

| Dimension | UDP | TCP |
|---|---|---|
| Connection | none | three-way handshake |
| Boundaries | preserved | byte stream |
| Reliability | not guaranteed | reliable / in-order |
| Calls | sendto/recvfrom | connect/listen/accept/send/recv |

---

## 8. Worked examples

### Example 1: HTTP RTT (10 points)

**Question**: RTT=100 ms, 10 objects, transmission time 1 ms per object. Find the total time for non-persistent HTTP, persistent HTTP (without pipelining) and persistent HTTP (with pipelining) (ignore DNS).

**Solution**:
- Non-persistent: <span class="mchip">\(10\times(2\times100+1) = 2010\ \text{ms}\)</span>.
- Persistent without pipelining: 100 ms to set up the connection + 10 × (100 + 1) = **1110 ms**.
- Persistent with pipelining: 100 ms to set up the connection + 100 ms for request / first bytes + 10×1 ms ≈ **210 ms**.
- Conclusion: persistent + pipelining greatly reduces RTT overhead.

### Example 2: Benefit of caching (10 points)

**Question**: access link 1.54 Mbps, object 100 Kbit, request rate 15/s, RTT 2 s. Find the utilization without a cache; if the cache hit rate is 0.4, find the utilization.

**Solution**:
- average data rate <span class="mchip">\(15\times100\ \text{Kbit} = 1.5\ \text{Mbps}\)</span>; utilization <span class="mchip">\(\tfrac{1.5}{1.54}\approx0.97\)</span> → high queueing delay.
- cache hit 0.4 → only 60% go over the link → <span class="mchip">\(0.6\times1.5 = 0.9\ \text{Mbps}\)</span>; utilization <span class="mchip">\(\tfrac{0.9}{1.54}\approx0.58\)</span> → delay drops significantly.
- Conclusion: caching is more economical than upgrading bandwidth.

### Example 3: DNS query (10 points)

**Question**: `www.example.com` is not in any cache; describe the iterated query process.

**Solution**:
1. host → local DNS (recursive request);
2. local DNS → root: returns the `.com` TLD address;
3. local DNS → `.com` TLD: returns the `example.com` authoritative address;
4. local DNS → authoritative: returns the A record for `www.example.com`;
5. the local DNS caches it and returns it to the host.

### Example 4: P2P distribution (10 points)

**Question**: F=1 GB, u_s=10 Mbps, N=10, u_i=1 Mbps for each peer, d_min=10 Mbps. Find the distribution time for C-S and for P2P.

**Solution**:
- <span class="mchip">\(F = 8\ \text{Gbit} = 8000\ \text{Mbit}\)</span>.
- C-S: <span class="mchip">\(\max\{10\times8000/10,\ 8000/10\} = \max\{8000,800\} = 8000\ \text{s}\)</span>.
- P2P: <span class="mchip">\(\max\{8000/10=800,\ 800,\ 10\times8000/(10+10)=4000\} = 4000\ \text{s}\)</span>.
- P2P takes about half of C-S; the advantage grows with N.

### Example 5: Socket call order (8 points)

**Question**: write out the call order for a TCP server and client to set up a connection and exchange data.

**Solution**:
- Server: `socket → bind → listen → accept → recv → send → close`.
- Client: `socket → connect → send → recv → close`.

---

## 9. Common mistakes (where marks are most easily lost)

| Wrong | Correct |
|---|---|
| HTTP is a stateful protocol | HTTP is **stateless**; cookies add state |
| non-persistent HTTP costs 1 RTT per object | **2 RTT** + transmission time |
| persistent HTTP has no RTT overhead at all | 1 RTT to set up the connection; without pipelining 1 RTT per object; with pipelining about 1 RTT in total |
| cookies are an authentication mechanism | only state management, with very weak authentication power |
| a cache always guarantees the latest version | it may be out of date; conditional GET / 304 is needed |
| DNS has only 13 physical servers | 13 **logical clusters**, each replicated many times |
| DNS queries are always recursive | host→local is usually recursive; local→root/TLD is usually iterative |
| SMTP is a pull protocol | SMTP is **push**; POP3/IMAP are pull |
| P2P is always faster than C-S | it depends on the peers' upload bandwidth / number; the formula takes the max |
| UDP has no checksum | UDP has a 16-bit checksum (optional but usually enabled) |
| TCP is a message-boundary protocol | TCP is a **byte stream**, with no message boundaries |
| HTTP/2 completely solves HOL blocking | it only solves it at the HTTP layer; TCP-layer HOL blocking remains, and only HTTP/3 solves that |

---

## 10. Self-test (do it first, then check the answers)

1. What is the difference between Client-Server and P2P? What are the pros and cons of each?
2. What identifies a socket? How do the demultiplexing identifiers of TCP and UDP differ?
3. How does the response time of non-persistent HTTP differ from persistent HTTP? How is RTT defined?
4. How do cookies work? What HTTP problem do they solve? What privacy risks do they carry?
5. What is the role of a Web cache? How does conditional GET work? What does 304 mean?
6. What HTTP/1.1 problems does HTTP/2 solve? What does HTTP/3 solve in turn?
7. How do SMTP and HTTP differ? Why does e-mail use push and the Web use pull?
8. What is the hierarchical structure of DNS? What is the difference between iterated and recursive queries?
9. What are the common DNS RR types and their meanings? What are the benefits and risks of DNS caching?
10. What is the P2P file distribution time formula? Why is P2P scalable?
11. How does a CDN reduce delay? How does DASH adapt to bandwidth?
12. What are the main differences between UDP and TCP socket programming?

### Answers

1. C-S: always-on server, easy to manage, server bottleneck; P2P: scalable, complex management, incentive problem.
2. IP + port; UDP uses destination IP + destination port, TCP uses the four-tuple.
3. Non-persistent: 2 RTT per object; persistent sets up once, then 1 RTT per object (with pipelining about 1 RTT in total); RTT is the round-trip time of a small packet.
4. Set-Cookie / Cookie header + a server database; makes up for HTTP being stateless; cross-site tracking.
5. Reduces response time / bandwidth / server load; If-Modified-Since; 304 means not modified.
6. HTTP/2: binary framing, multiplexing, header compression, mitigating HTTP-layer HOL blocking; HTTP/3: QUIC/UDP, stream-level multiplexing, avoiding TCP HOL blocking.
7. SMTP pushes, HTTP pulls; e-mail must be delivered to the receiver's mail server, while the Web client fetches actively.
8. root→TLD→authoritative→local; with iteration you ask each server yourself, with recursion the contacted server resolves on your behalf.
9. A/NS/CNAME/MX (+AAAA); caching lowers delay / load, but entries may be out of date / poisoned.
10. `max{F/u_s, F/d_min, NF/(u_s+Σu_i)}`; peer upload bandwidth grows with N.
11. edge copies, serving from a nearby node, less backbone traffic; DASH divides the video into chunks at multiple rates and the client chooses by bandwidth.
12. UDP: connectionless, datagram boundaries, sendto/recvfrom; TCP: connection-oriented, byte stream, listen/accept/connect.

---

## 11. Pre-exam quick-reference card

| Item | Content |
|---|---|
| Architecture | C-S (always-on) / P2P (peer-to-peer) |
| Identifier | IP + port; TCP four-tuple |
| HTTP | stateless; TCP 80; request / response |
| Non-persistent | 2 RTT + transmission per object |
| Persistent | 1 RTT to set up; connection reuse; pipelining |
| Cookie | Set-Cookie / Cookie + back-end DB |
| Cache | hits lower delay; conditional GET / 304 |
| HTTP/2 | binary framing, multiplexing, HPACK |
| HTTP/3 | QUIC/UDP, stream-level multiplexing |
| SMTP | push; TCP 25 |
| Mail access | POP3 110 / IMAP 143 |
| DNS | root→TLD→authoritative→local; UDP 53 |
| RR | A/NS/CNAME/MX |
| P2P | `max{F/us,F/dmin,NF/(us+Σui)}` |
| BitTorrent | 256 KB chunk; rarest first; tit-for-tat |
| CDN | edge copies; DASH adaptation |
| Socket | UDP sendto/recvfrom; TCP listen/accept/connect |
