# CSIT5610 Computer Networks · Knowledge Outline

> **Scope**: Chapters 1–3 (Kurose & Ross, *Computer Networking: A Top-Down Approach*, 8th ed.)
> Chapter 1 Introduction, Chapter 2 Application Layer, Chapter 3 Transport Layer.
>
> **How to use**: first read §1 for the global map → go through the knowledge tree in §2–§4 chapter by chapter → use the side-by-side comparisons in §5 and the formula quick reference in §6 → finally do the self-test in §7.
>
> **Markers**: ★ core exam point; ⚔ attack / problem; 🔧 mechanism / solution; ⚠ easily confused.

---

## 0. Where the three chapters sit in the course

| Chapter | Topic | Core question | After studying you can answer |
|---|---|---|---|
| 1 | Introduction | What is the Internet made of? How does data travel? Why layering? | end-end paths, the four delays, packet vs. circuit, the five-layer model |
| 2 | Application Layer | How are network applications designed, how do protocols work? | HTTP/DNS/SMTP flows, caching, P2P, CDN, sockets |
| 3 | Transport Layer | How do processes transfer data reliably / efficiently? | UDP/TCP, rdt, GBN/SR, flow control, congestion control |

**The main thread in one sentence**:

1. **Layering**: each layer relies only on the services provided by the layer below, and offers an abstraction upward; understanding the header means understanding the contract between layers.
2. **Protocol = rules**: message format, field meaning, send/receive actions, timing; the vast majority of network problems can be reduced to "the state machine / fields of some layer went wrong".
3. **Performance = delay + loss + throughput**; reliability = acknowledgment + retransmission + sequence number; efficiency = pipelining + window + congestion control.

---

## 1. Global knowledge map

### 1.1 The five-layer protocol stack (the backbone of this course)

```
Application   HTTP, SMTP, DNS, ...           message
Transport     TCP, UDP                       segment
Network       IP, routing protocols          datagram
Link          Ethernet, 802.11, PPP          frame
Physical      copper / fiber / radio         bit
```

- Encapsulation: application data gets a header at each layer on the way down; routers process only up to the network layer, switches up to the link layer.
- Addressing: the application layer uses domain names / URLs; the transport layer uses **port numbers**; the network layer uses **IP**; the link layer uses **MAC**.
- End-to-end vs. hop-by-hop: the transport layer is end-to-end; the network and link layers are hop-by-hop.

### 1.2 The path of one Web access (tying the three chapters together)

```
browser --HTTP--> TCP connection (three-way handshake) --IP--> routers forward hop by hop --> server
   DNS resolves the domain name first (UDP 53)
   TCP provides reliability, in-order delivery, flow control, congestion control
   HTTP is a stateless application protocol; cookies add state
```

### 1.3 The three performance metrics

| Metric | Definition | Key formula / factor |
|---|---|---|
| **Delay** | time for data to travel from source to destination | `d = d_proc + d_queue + d_trans + d_prop` |
| **Loss** | packet loss caused by queue overflow / bit errors | finite queue + traffic intensity `La/R` |
| **Throughput** | bits actually transferred per unit time | bottleneck link `min(R_s, R_c)` |

### 1.4 The two "state machine" threads

- **Reliable transfer**: the sender waits for an ACK and retransmits on timeout; the receiver uses sequence numbers / ACKs to handle duplicates and out-of-order data.
- **Connection management**: TCP three-way handshake / four-way teardown; the state (LISTEN/SYN_SENT/ESTABLISHED/...) determines which packets can be accepted.

---

## 2. Chapter 1: Introduction

### 2.1 What is the Internet

**The "nuts and bolts" view**

- **Hosts / end systems**: PCs, phones, servers, IoT devices, running network applications.
- **Packet switches**: routers and switches, forwarding packets.
- **Communication links**: fiber, copper, radio, satellite; **bandwidth / transmission rate**.
- **Network**: a collection of devices, routers, links, managed by an organization.
- The Internet = a "network of networks".

**The "services" view**

- Infrastructure that provides **communication services** to applications.
- Provides an **API (socket API)** that lets applications hand data to the network.
- Protocols: the rules agreed on by the two communicating parties.

**Protocol ★**

> Protocol definition: ① message format (format); ② the order / timing of messages (order); ③ the actions taken when a message is sent or received (action).

- Human protocol analogy: asking "what's the time?" → the reply; network protocol analogy: TCP connection request → response.
- The three elements of a protocol: **syntax, semantics, timing** (the slides phrase them as format / order / actions).

### 2.2 The network edge

**Access networks**

| Type | Medium / structure | Characteristics |
|---|---|---|
| **Cable (HFC)** | coax cable + fiber hybrid; shared up to the headend | high downstream rate; shared medium, needs allocation |
| **DSL** | telephone twisted pair to the DSLAM / CO | dedicated line; rate falls off with distance |
| **Wireless (WiFi/5G)** | shared wireless access | shared, subject to interference, mobility |
| **Enterprise network** | Ethernet + switches + routers | high bandwidth, hierarchical access |
| **Data center** | racks / switches / load balancing | high bandwidth, low latency, east-west traffic |

**Physical media**

- **Guided media**: twisted pair (UTP), coaxial cable, fiber (high speed, low error rate, immune to electromagnetic interference).
- **Unguided media**: radio (WiFi, cellular, satellite); affected by the environment, distance, interference.

**How a host sends packets**

- The host breaks data into **packets**; the link transmission rate is `R` (bps).
- To send one `L`-bit packet, **transmission time = L/R**.
- Packet switches use **store-and-forward**: receive the whole packet, check it, then forward.

### 2.3 The network core

**Two key network-core functions**

- **Forwarding**: move arriving packets from the router's input link to the appropriate output link (local action, fast).
- **Routing**: determine the source-to-destination paths taken by packets (global action, runs routing algorithms).

**Packet switching ★**

- Data is cut into packets that are transmitted independently; **statistical multiplexing**.
- **Store-and-forward**: `end-end delay ≈ 2L/R` (two links, no queueing).
- **Queueing**: when the arrival rate > the output rate, packets queue in the buffer; a full buffer → **packet loss**.
- Pros: great for bursty traffic, high bandwidth utilization; cons: queueing delay, packet loss, needs congestion control.

**Circuit switching ★**

- Setting up a call **reserves** end-end resources (bandwidth / time slots); the call has them exclusively while it lasts.
- **FDM**: frequency division multiplexing; **TDM**: time division multiplexing.
- Pros: bandwidth / delay guarantees; cons: wasted when idle, slow connection setup.

**Packet switching vs. circuit switching (the classic example)**

- A 1 Gb/s link; a user needs 100 Mb/s when active and is active 10% of the time.
- Circuit switching: at most **10** users (100 Mb/s reserved for each).
- Packet switching: with 35 users, the probability that more than 10 are active at the same time is tiny → more users are supported.
- Conclusion: **packet switching is more efficient for bursty traffic**; but packet switching provides no hard guarantees.

**Internet structure: a "network of networks"**

- Access ISP → regional ISP → Tier-1 ISP; IXPs interconnect them; content providers (Google/Netflix/Akamai) run their own networks, as close to users as possible.
- Business relationships such as multi-homing, peering, transit.

### 2.4 Performance: delay, loss, throughput

**Four sources of delay ★★**

\[
d_{\text{nodal}} = d_{\text{proc}} + d_{\text{queue}} + d_{\text{trans}} + d_{\text{prop}}
\]

| Component | Formula / meaning |
|---|---|
| Processing delay `d_proc` | check the header, determine the output link; typically very small |
| Queueing delay `d_queue` | depends on the traffic intensity; estimated by `La/R` |
| Transmission delay `d_trans` | `L/R` (the time to push the bits onto the link) |
| Propagation delay `d_prop` | `d/s` (physical distance / propagation speed) |

**Traffic intensity ★**

\[
\text{traffic intensity} = \frac{La}{R}
\]

- `a`: average arrival rate (packets/sec); `L`: packet length; `R`: link transmission rate.
- `La/R ≈ 0`: queueing delay is small; `→ 1`: delay grows sharply; `> 1`: the queue grows without bound (in practice packets are lost).
- ⚠ **Transmission delay vs. propagation delay**: the former is "pushing the packet out", the latter is "the signal running through the medium".

**Packet loss**

- The queue buffer is finite; if the arrival rate keeps exceeding the output rate → the buffer fills up → later packets are dropped.
- Loss may show up as "retransmission", "timeout", "throughput drop".

**Throughput ★**

- End-end throughput = the rate of the **bottleneck link** on the path: `min(R_s, R_c, ...)`; when 10 connections fairly share a backbone `R`, each gets about `min(R_s, R_c, R/10)`.
- When the link rates are similar, throughput ≈ link rate; a single narrow link becomes the bottleneck.

**traceroute**

- Uses an increasing TTL + ICMP time-exceeded to measure the RTT hop by hop; you can see the path and how the delay changes.

### 2.5 Layering and protocol stacks

**Why layering**

- Decomposition of a complex system; modules evolve independently; the upper layer relies only on the lower layer's interface.
- Drawbacks: per-layer header overhead, information may be hidden (e.g., cross-layer optimization is hard).

**Internet five layers vs. OSI seven layers**

| Internet five layers | OSI seven layers | Function |
|---|---|---|
| Application | Application / Presentation / Session | application semantics, representation, sessions |
| Transport | Transport | process-to-process |
| Network | Network | host-to-host, routing |
| Link | Data Link | neighboring nodes, framing |
| Physical | Physical | bit transmission |

- In the Internet stack, OSI's Presentation/Session are handled by the application layer itself.

**Encapsulation ★**

```
application:  message
transport:    [H_t | message]              segment
network:      [H_n | H_t | message]        datagram
link:         [H_l | H_n | H_t | message]  frame
```

- Each layer reads / writes only its own header; the receiver decapsulates layer by layer.
- Routers decapsulate up to the network layer; link-layer switches up to the link layer.

### 2.6 Network security and history (awareness only)

- **Malware**: viruses, worms, Trojans, botnets.
- **DoS/DDoS**: exhaust resources with a flood of traffic / requests.
- **Sniffing**: capture packets on a shared medium / over wireless.
- **Spoofing**: forge the source IP / MAC.
- Historical phases: 1961–1972 packet switching; 1972–1980 internetworking; 1980–1990 protocol standardization; 1990s commercialization / Web; 2005– mobility / cloud / SDN.

---

## 3. Chapter 2: Application Layer

### 3.1 Principles of network applications

**Two architectures**

| Architecture | Characteristics | Example |
|---|---|---|
| **Client-Server** | always-on server, permanent address, scaled with data centers; clients initiate requests | Web, email, DNS |
| **P2P** | no always-on server; peers both request and provide service; self scalability | BitTorrent, blockchain |

**Processes and sockets**

- **Process**: a program running within a host; within the same host a process ID is used, across hosts **IP + port number** identifies it.
- **Socket**: the door between the application process and the transport layer; the application hands the message to the socket, and the transport layer sends it.
- An application-layer protocol must define: **types of messages, syntax, semantics, timing**.

**What transport service does an app need?**

| Requirement | Description | Typical application |
|---|---|---|
| Data integrity | no loss / no errors | file transfer, Web, email |
| Timing | low delay | real-time audio/video, games |
| Throughput | minimum bandwidth | streaming video |
| Security | encryption / authentication | login, payment |

**Internet transport services**

- **TCP**: reliable, in-order, flow control, congestion control, connection-oriented; provides no timing or bandwidth guarantee.
- **UDP**: unreliable, connectionless, low overhead; does not guarantee order / integrity.
- **TLS**: provides encryption, authentication, integrity on top of TCP; applications use it through TLS libraries (HTTPS).

### 3.2 Web and HTTP

**HTTP basics**

- Hypertext transfer protocol; **request / response** model; **stateless** (no history kept).
- Default port **80**; uses TCP.
- Two connection types:
  - **Non-persistent (HTTP/1.0)**: one TCP connection per object;
  - **Persistent (HTTP/1.1)**: one connection carries multiple objects.

**Response time (RTT) ★**

- **RTT**: the time for a small packet to travel from client to server and back.
- Non-persistent HTTP: about **2 RTT + transmission time** per object (1 RTT to set up the connection + 1 RTT for request/response).
- Persistent HTTP: the connection is set up once; without pipelining about **1 RTT + transmission time** per object, with pipelining all objects can arrive one after another after roughly **1 RTT**.

**HTTP messages**

- Request line: `GET /index.html HTTP/1.1`; header lines: Host, User-Agent, Accept, Connection, Cookie, etc.; blank line; entity body.
- Methods: GET, POST, HEAD, PUT, DELETE.
- Response: status line + header lines + entity body; status codes:
  - 200 OK; 301 Moved Permanently; 304 Not Modified;
  - 400 Bad Request; 403 Forbidden; 404 Not Found; 505 HTTP Version Not Supported.

**Cookie ★**

- HTTP is stateless → cookies are used to maintain state.
- The server responds with `Set-Cookie`; the browser stores it and sends `Cookie` in later requests; the server uses a back-end database to associate the user.
- Uses: shopping carts, sessions, personalization, tracking.
- Privacy issue: cross-site tracking; cookies are not an authentication mechanism.

**Web cache / proxy ★**

- Cache hit: return the object directly, reducing response time, lowering access-link bandwidth use, and relieving the origin server.
- **Conditional GET**: `If-Modified-Since`; if the object is not modified the server returns **304 Not Modified** (no entity body).
- Cache consistency: `Cache-Control`, expiration time, validation.

**HTTP/2 and HTTP/3**

- HTTP/1.1: HOL blocking, header redundancy.
- **HTTP/2**: binary framing, multiplexing (multiple concurrent streams over one TCP connection), header compression (HPACK); still affected by TCP-layer HOL blocking.
- **HTTP/3**: built on **QUIC (UDP)**, stream-level multiplexing that avoids TCP HOL blocking; 0/1-RTT connection setup; encryption built in.

### 3.3 E-mail

- Components: user agent (UA), mail servers, SMTP, mail access protocols.
- **SMTP**: push, from the sender's UA → sender's mail server → receiver's mail server; TCP port **25**; commands / responses are ASCII.
- **Mail access**: POP3 (110), IMAP (143), HTTP webmail; pull.
- Message format: header lines (From/To/Subject/Date) + blank line + body; MIME supports attachments / non-ASCII.
- SMTP vs. HTTP: SMTP pushes, HTTP pulls; both use ASCII command / response interaction, but SMTP requires the message to be 7-bit ASCII.

### 3.4 DNS

**Services**

- Hostname → IP address; host aliasing; mail server aliasing; load distribution.
- A distributed, hierarchical database; UDP port **53** (TCP also possible).
- Why not centralize: single point of failure, traffic volume, distance, maintenance.

**Hierarchy ★**

```
root DNS servers (root)
  → top-level domain TLD (.com, .org, .cn)
    → authoritative DNS servers (authoritative)
local DNS server (local/resolver, usually provided by the ISP / organization)
```

- Root servers: 13 logical clusters worldwide, each replicated many times (~200 servers in the US).
- TLD: responsible for .com/.org etc.
- Authoritative: holds the records for the specific domain names.
- Local DNS: proxies queries, caches.

**Name resolution ★**

- **Iterative query**: the local DNS asks the root, the TLD, then the authoritative server in turn, driving the process itself.
- **Recursive query**: the local DNS completes the whole query on behalf of the host (the root usually does not recurse).
- In practice: host → local DNS is recursive; local DNS → root/TLD/authoritative is usually iterative.

**Caching**

- Any level can cache; TTL controls expiration.
- Pros: lower delay, less load on the root/TLD servers; cons: expired records may be inconsistent.

**Resource records (RR)**

| Type | Meaning |
|---|---|
| A | hostname → IPv4 address |
| AAAA | hostname → IPv6 address |
| NS | the authoritative DNS server of the domain |
| CNAME | alias name → canonical name |
| MX | mail server |

**DNS messages**

- Header: ID, flags, # questions, # answer RRs, # authority RRs, # additional RRs; the four sections questions / answers / authority / additional.
- Query and reply have the same format.

**DNS security**

- DDoS (against the root/TLD/authoritative servers); cache poisoning; forged replies.
- Defenses: DNSSEC (signatures / chain of trust), randomized ID/port, 0x20 encoding, rate limiting.

### 3.5 P2P applications

**File distribution time ★**

- Client-server: `D_cs = max{N F / u_s, F / d_min}`
- P2P: `D_p2p = max{F / u_s, F / d_min, N F / (u_s + Σ u_i)}`
- where `F` is the file size, `N` the number of peers, `u_s` the server upload capacity, `u_i` peer i's upload capacity, `d_min` the slowest download rate.
- Conclusion: P2P scales as N grows; C-S is limited by the server's bandwidth.

**BitTorrent**

- The file is divided into chunks (usually 256 KB); the tracker provides a list of peers; peers exchange chunks.
- **tit-for-tat**: prefer peers with a high upload rate; periodically "optimistically unchoke" a new peer to give it a chance.
- Incentive: the free-riding problem.

### 3.6 Video streaming and CDNs

- Video: a sequence of frames; CBR/VBR; compression (spatial / temporal redundancy).
- Streaming challenges: the continuous playout constraint, network jitter, changing bandwidth.
- **Playout buffer**: buffer ahead, absorbing jitter; the cost is startup delay.
- **DASH**: cut the video into chunks at different coding rates; the client adapts its choice to the bandwidth.
- **CDN**: deploy copies of content at edge nodes; DNS / HTTP redirects the client to the nearest node; lower delay, less backbone traffic.
- **OTT**: the content provider bypasses traditional operators and builds its own CDN / network.

### 3.7 Socket programming

- **UDP**: `socket(AF_INET, SOCK_DGRAM)`; `sendto/recvfrom`; connectionless; datagram boundaries preserved.
- **TCP**: `socket(AF_INET, SOCK_STREAM)`; `listen/accept`; `connect`; `send/recv`; byte stream, no boundaries.
- Server: create the welcoming socket → accept a new connection → handle it; client: create the socket → connect → send/receive.
- Ports: a fixed port on the server; an ephemeral port on the client.

---

## 4. Chapter 3: Transport Layer

### 4.1 Transport-layer services

- Provides logical communication between **processes** running on different hosts; the network layer is host-to-host, the transport layer is process-to-process.
- Sender: breaks application data into segments, adds a header, passes them to the network layer; receiver: reassembles them, passes them up to the socket.
- **Multiplexing/demultiplexing (mux/demux) ★**:
  - The sender handles data from multiple sockets and adds the transport-layer header;
  - The receiver uses header info to deliver received segments to the correct socket.
  - **UDP**: identifies a socket by `<dest IP, dest port>`;
  - **TCP**: identifies a connection by the 4-tuple `<source IP, source port, dest IP, dest port>`.

### 4.2 UDP

**Characteristics**

- Connectionless, unreliable, no flow control/congestion control; small overhead, low delay.
- Suited to: DNS, DHCP, SNMP, streaming multimedia, games, and as the substrate for QUIC.

**Header (8 bytes)**

```
source port (16) | dest port (16)
length (16)      | checksum (16)
```

**Checksum**

- Covers the UDP header + data + pseudo-header (source/dest IP, protocol number, UDP length).
- 16-bit one's complement sum, then complement it; the receiver verifies.
- Weak protection (16 bits), but it can detect some errors.

### 4.3 Reliable data transfer (rdt) ★★

**Interfaces and assumptions**

- `rdt_send(data)`: called from above; `udt_send(packet)`: hands the packet to the unreliable channel; `rdt_rcv(packet)`: a packet arrives; `deliver_data(data)`: delivers data to the upper layer.
- Incrementally strengthen the channel assumptions: reliable → bit errors → packet loss.

**rdt1.0: reliable channel**

- Sender: receive data → make packet → send; receiver: receive packet → extract → deliver. No ACK/sequence number needed.

**rdt2.0: channel with bit errors**

- Needs: error detection (checksum), ACK/NAK, retransmission.
- The sender sends one packet, then waits for ACK/NAK; NAK or corruption → retransmit.
- **Fatal flaw**: the ACK/NAK itself may be corrupted → the sender doesn't know what happened at the receiver.

**rdt2.1: handling garbled ACK/NAKs**

- Add a **sequence number 0/1** to each data packet; the sender retransmits the current packet; the receiver uses the sequence number to detect duplicates.
- Twice as many states (wait for ACK0/ACK1).

**rdt2.2: a NAK-free protocol**

- ACKs only; the receiver sends an ACK for the last packet received OK, carrying the **next expected sequence number**; a duplicate ACK triggers retransmission.

**rdt3.0: channels with errors and loss**

- Add a **timer**: retransmit on timeout; sequence numbers 0/1; handles ACK loss, data loss, and delay.
- **stop-and-wait**: send one packet, then wait for the receiver response; simple but inefficient.

**stop-and-wait performance ★**

\[
U_{\text{sender}} = \frac{L/R}{RTT + L/R}
\]

- Example: 1 Gbps link, 15 ms RTT, 1 KB packet → U ≈ 0.00027, extremely low utilization.
- Fix: **pipelining**: allow multiple not-yet-acknowledged packets to be in flight at the same time.

### 4.4 Pipelined protocols: GBN and SR ★★

**Go-Back-N (GBN)**

- Sender: window of N; sends consecutively; a single timer for the oldest in-flight packet; timeout → retransmit the **entire window**.
- Receiver: accepts only in-order packets; discards out-of-order packets; sends an ACK for the last correctly received packet (cumulative ACK).
- Pro: simple receiver, no need to buffer out-of-order packets; con: one lost packet causes many retransmissions.

**Selective Repeat (SR)**

- Sender: window of N; a timer for each unACKed packet; retransmits only the lost packet.
- Receiver: buffers out-of-order packets; individually acknowledges each correctly received packet; delivers in order.
- Window size: **N ≤ 2^(k-1)** (k is the number of sequence number bits), otherwise old and new packets cannot be distinguished.
- Pro: few retransmissions; con: complex receiver, requires buffering.

**GBN vs SR**

| Dimension | GBN | SR |
|---|---|---|
| Receiver buffering | Not needed | Needed |
| ACK | Cumulative ACK | Individual ACK |
| Retransmission | Entire window | Only the lost packet |
| Timer | One | One per packet |
| Window | N | N ≤ 2^(k-1) (about half the sequence number space) |

### 4.5 TCP

**Overview**

- Point-to-point, reliable, in-order, full duplex, connection-oriented, flow controlled, congestion controlled.
- The connection is logical; both sides maintain state.

**Segment structure (minimum 20 bytes)**

```
source port #    | dest port #
sequence number  | acknowledgement number
head len|not used|flags|receive window
checksum         | urgent data pointer
options          | data
```

- Flags: SYN, ACK, FIN, RST, PSH, URG.
- Sequence number: byte stream "number" (not a packet number); acknowledgement number: the next byte expected.

**Sequence numbers and ACKs**

- The sender numbers every byte; `Seq` is the byte stream number of the first byte in the segment's data.
- Receiver `ACK = sequence number of the next byte expected`; cumulative ACK.
- Example: on receiving 0–999, reply ACK 1000.

**RTT estimation and timeout ★**

\[
\begin{aligned}
\text{EstimatedRTT} &= (1-\alpha)\cdot\text{EstimatedRTT} + \alpha\cdot\text{SampleRTT}, & \alpha &= 0.125\\
\text{DevRTT} &= (1-\beta)\cdot\text{DevRTT} + \beta\cdot|\text{SampleRTT} - \text{EstimatedRTT}|, & \beta &= 0.25\\
\text{TimeoutInterval} &= \text{EstimatedRTT} + 4\cdot\text{DevRTT}
\end{aligned}
\]

- Timeout too long → slow reaction to segment loss; too short → unnecessary retransmissions.

**TCP sender (simplified)**

- Data received from application → create segment → start timer → send.
- Timeout → retransmit the not-yet-acked segment with the smallest sequence number, restart the timer.
- ACK received → update the window; if there are still unACKed segments, restart the timer.

**Fast retransmit**

- Receipt of **3 duplicate ACKs** → the segment is probably lost, so retransmit immediately instead of waiting for the timeout.

**TCP receiver: ACK generation**

- In-order segment received, all data up to it already ACKed → delayed ACK (wait up to 500 ms).
- Out-of-order segment received → immediately send a duplicate ACK, indicating the sequence number expected.
- Segment that fills the gap received → immediate ACK.

**Flow control ★**

- Goal: keep the sender from overwhelming the receiver's buffer.
- The receiver advertises free buffer space in the **rwnd (receive window)** field in the header; the sender limits unACKed data to ≤ rwnd.
- Different from congestion control: flow control is a **receiver** limit, congestion control is a **network** limit.

**Connection management ★**

- **3-way handshake**:
  1. Client → server: `SYN, seq=x`
  2. Server → client: `SYN-ACK, seq=y, ack=x+1`
  3. Client → server: `ACK, ack=y+1`
- Why three: prevents an old duplicate connection request from creating a wrong connection; synchronizes both sides' sequence numbers.
- **Closing**: FIN/ACK four-way close; TIME_WAIT waits 2MSL.

### 4.6 Congestion control

**Costs of congestion**

- Queueing delay increases; packet loss (buffer overflow); retransmissions waste bandwidth; congestion collapse.
- Three scenarios: one router/finite buffers, multiple routers/retransmission, four senders/multi-hop competition.

**Two approaches**

- **End-end**: end systems infer congestion from observed loss/delay (TCP).
- **Network-assisted**: routers provide explicit feedback (ECN, ATM ABR).

**TCP AIMD ★**

- **Additive increase (AI)**: increase the congestion window by 1 MSS every RTT, `cwnd += 1 MSS`.
- **Multiplicative decrease (MD)**: on loss `cwnd = cwnd/2` (Tahoe cuts to 1 MSS).
- Sawtooth behavior: probe for bandwidth → loss → cut in half → increase again.

**Slow start**

- Initially `cwnd = 1 MSS`; for every ACK received, `cwnd += 1 MSS` → double cwnd every RTT (exponential increase).
- On reaching `ssthresh`, switch to congestion avoidance (linear increase).
- Timeout: `ssthresh = cwnd/2`, `cwnd = 1`, re-enter slow start.
- 3 duplicate ACKs: fast retransmit/fast recovery (`ssthresh = cwnd/2`, `cwnd = ssthresh`, then linear increase).

**TCP CUBIC**

- Grows the window as a cubic function (with time as the independent variable), better suited to high-bandwidth, long-delay networks; the Linux default.
- Recovers faster and is more stable than AIMD.

**Delay-based congestion control**

- Measures changes in RTT and keeps the pipe "just full," not fuller, without inducing loss (e.g., the Vegas/BBR idea).

**ECN**

- Routers mark congestion (instead of dropping); the destination echoes the indication; the sender reduces its rate.

**Fairness**

- Goal: K TCP flows share a bottleneck, each gets about `R/K`.
- AIMD converges to fairness; but different RTTs, UDP, and parallel connections break fairness.
- Fairness is not the only goal: real-time applications may require different treatment.

### 4.7 QUIC (for awareness)

- An application-layer protocol on top of UDP; the transport layer for HTTP/3.
- Stream-level multiplexing (no TCP-layer HOL blocking), 0/1-RTT connection establishment, built-in encryption, connection migration.
- Implemented in user space, which makes rapid iteration easy.

---

## 5. Side-by-side comparisons (high-frequency short answers)

| A | B | Key difference |
|---|---|---|
| Packet switching | Circuit switching | Statistical multiplexing/no guarantees vs reserved resources/guarantees |
| Transmission delay `L/R` | Propagation delay `d/s` | Push bits onto the link vs signal travels through the medium |
| Routing | Forwarding | Global path decision vs local input-port-to-output-port forwarding |
| TCP | UDP | Reliable/ordered/flow control/congestion control vs lightweight/connectionless |
| Flow control | Congestion control | Receiver buffer vs network capacity |
| GBN | SR | Cumulative ACK/retransmit the entire window vs individual ACK/retransmit only the lost packet |
| Non-persistent HTTP | Persistent HTTP | 2 RTT per object vs 1 RTT per object with connection reuse |
| Iterative DNS | Recursive DNS | Local DNS server asks itself vs does the lookup all the way for you |
| HTTP/1.1 | HTTP/2 | Text-based/HOL blocking vs binary framing/multiplexing |
| HTTP/2 | HTTP/3 | TCP HOL blocking vs stream-level multiplexing over QUIC/UDP |
| C-S | P2P | Server bandwidth bottleneck vs scalable |

---

## 6. Formulas and numbers to memorize

| Item | Formula/value |
|---|---|
| Nodal delay | `d = d_proc + d_queue + d_trans + d_prop` |
| Transmission delay | `L/R` |
| Propagation delay | `d/s` |
| Traffic intensity | `La/R` |
| Throughput | `min(R_s, R_c, ...)` |
| Non-persistent HTTP | about `2 RTT + L/R` per object |
| Persistent HTTP | 1 RTT for connection setup, then `1 RTT + L/R` per object |
| C-S distribution time | `max{NF/u_s, F/d_min}` |
| P2P distribution time | `max{F/u_s, F/d_min, NF/(u_s+Σu_i)}` |
| stop-and-wait utilization | `(L/R)/(RTT + L/R)` |
| TCP RTT estimation | `EstimatedRTT = 0.875·EstimatedRTT + 0.125·SampleRTT` |
| TCP timeout | `EstimatedRTT + 4·DevRTT` |
| TCP throughput (approximate) | `0.75·W/RTT` |
| UDP header | 8 bytes |
| TCP header | minimum 20 bytes |
| Ports | HTTP 80, DNS 53, SMTP 25, POP3 110, IMAP 143 |
| DNS root | 13 logical root name servers, each with many replicas |
| BitTorrent chunk | 256 KB |
| GBN/SR window | GBN: N; SR: N ≤ 2^(k-1) (about half the sequence number space) |

---

## 7. Self-test (do it first, then check the answers)

### Chapter 1

1. From the "nuts and bolts" view, what four types of components make up the Internet?
2. What are the three elements of a protocol? Illustrate them with the "asking the time" analogy.
3. What is the core difference between packet switching and circuit switching? Their pros and cons?
4. Write down the four components of nodal delay; which ones depend on packet length?
5. What happens as `La/R` approaches 1? Why?
6. What is the difference between transmission delay and propagation delay? What determines each?
7. What are the PDU names at each layer of the five-layer protocol stack? How does encapsulation work?
8. What is the difference between routing and forwarding?

### Chapter 2

9. What is the difference between client-server and P2P? Their pros and cons?
10. What identifies a socket? How does demultiplexing identification differ between TCP and UDP?
11. How do response times differ between non-persistent HTTP and persistent HTTP? How is RTT defined?
12. How do cookies work? What HTTP problem do they solve? What privacy risks do they bring?
13. What is the role of a Web cache? How does conditional GET work? What does 304 mean?
14. What HTTP/1.1 problems does HTTP/2 solve? What does HTTP/3 solve?
15. How does SMTP differ from HTTP? Why does e-mail use push and the Web use pull?
16. What is the hierarchy of DNS? What is the difference between iterative and recursive queries?
17. What are the common DNS RR types and their meanings? What are the benefits and risks of DNS caching?
18. What is the P2P file distribution time formula? Why is P2P scalable?
19. How do CDNs reduce delay? How does DASH adapt to bandwidth?
20. What are the main differences between UDP and TCP socket programming?

### Chapter 3

21. What is the difference between the transport layer and the network layer? What is the role of multiplexing/demultiplexing?
22. What are the UDP header fields? What does the checksum cover? Why is the protection weak?
23. What is the fatal flaw of rdt2.0? How do rdt2.1/2.2 solve it?
24. How does rdt3.0 handle packet loss? What is the stop-and-wait utilization formula?
25. How do GBN and SR differ in window, ACK, retransmission, and buffering?
26. What is the minimum TCP segment header size? What do the sequence number and acknowledgement number mean?
27. How does TCP estimate RTT and set the timeout? What roles do α and β play?
28. What triggers fast retransmit? Why 3 duplicate ACKs?
29. What is the difference between flow control and congestion control? What are rwnd and cwnd?
30. What is the process of the TCP 3-way handshake? Why three?
31. How do AIMD, slow start, and fast recovery work? What does CUBIC improve?
32. What is TCP fairness? What factors break fairness?
33. What are QUIC's advantages over TCP?

### Answers (key points)

1. Hosts/end systems, packet switches (routers/switches), communication links, networks (network of networks).
2. Message format, order/timing, actions taken after receiving a message; a human asks the time → answer, a network request → response.
3. Packet: statistical multiplexing, good for bursts, may queue/lose packets; circuit: reserved resources, guarantees, wasted when idle.
4. Processing, queueing, transmission `L/R`, propagation `d/s`; transmission depends on packet length, propagation on distance/medium.
5. Queueing delay grows sharply, buffer overflow loses packets; the arrival rate keeps exceeding the output rate.
6. Transmission: push bits onto the link, `L/R`; propagation: the signal travels through the medium, `d/s`.
7. Application message, transport segment, network datagram, link frame, physical bit; add a header at each layer.
8. Routing: global path selection (routing protocols); forwarding: local action that moves packets from the input port to the output port.
9. C-S: always-on server, easy to manage, server bottleneck; P2P: scalable, hard to manage, incentive problem.
10. IP + port; UDP uses dest IP + dest port, TCP uses the 4-tuple.
11. Non-persistent: 2 RTT per object; persistent: set up the connection once, then 1 RTT per object; RTT is the time for a small packet to travel from client to server and back.
12. Set-Cookie/Cookie header + a server-side database; compensates for HTTP being stateless; cross-site tracking.
13. Reduces response time/bandwidth/server load; If-Modified-Since; 304 Not Modified.
14. HTTP/2: binary framing, multiplexing, header compression, mitigates HOL blocking; HTTP/3: QUIC/UDP, stream-level multiplexing, avoids TCP HOL blocking.
15. SMTP pushes, HTTP pulls; e-mail must be delivered to the recipient's mail server, while on the Web the client fetches actively.
16. Root → TLD → authoritative → local; iterative means asking yourself, recursive means doing the lookup for you.
17. A/AAAA/NS/CNAME/MX; caching reduces delay/load, but entries may go stale or be poisoned.
18. `max{F/u_s, F/d_min, NF/(u_s+Σu_i)}`; peer upload bandwidth grows with N.
19. Edge replicas, serve from nearby, less backbone traffic; DASH splits content into chunks at multiple rates, and the client picks by bandwidth.
20. UDP: connectionless, datagram boundaries, sendto/recvfrom; TCP: connection-oriented, byte stream, listen/accept/connect.
21. Network layer: host-to-host, transport layer: process-to-process; mux/demux delivers segments to the correct socket.
22. Source/dest port, length, checksum; pseudo-header + UDP segment; 16-bit one's complement sum, weak protection.
23. The ACK/NAK may be corrupted; rdt2.1 adds sequence numbers, rdt2.2 uses ACK + expected sequence number.
24. A timer retransmits on timeout; `U=(L/R)/(RTT+L/R)`.
25. GBN: cumulative ACK, one timer, retransmits the entire window, no receiver buffering; SR: individual ACK, a timer per packet, retransmits only the lost packet, buffers out-of-order packets.
26. 20 bytes; Seq is the byte stream number of the first byte in the segment, ACK is the next byte expected.
27. Exponential weighted moving average; α smooths SampleRTT, β smooths the deviation; Timeout=EstimatedRTT+4DevRTT.
28. 3 duplicate ACKs; they show that later packets arrived but the missing packet did not, so the network probably lost only that one.
29. Flow control prevents receiver overflow (rwnd), congestion control prevents network overload (cwnd).
30. SYN, SYN-ACK, ACK; synchronizes sequence numbers and prevents old connection requests.
31. AI adds 1 MSS per RTT, MD cuts in half on loss; slow start grows exponentially to ssthresh; fast recovery runs after 3 duplicate ACKs; CUBIC uses a cubic function.
32. K flows sharing a bottleneck each get about R/K; different RTTs, UDP, and parallel connections break it.
33. Implemented over UDP, stream-level multiplexing, 0/1-RTT, built-in encryption, connection migration.
