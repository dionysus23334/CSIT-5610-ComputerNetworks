# Chapter 1 · Introduction · Review Notes

> **Matching slides**: `ch1-8.pdf` (Kurose & Ross, Chapter 1 Introduction, 8th ed.)
>
> **Suggested time**: first pass 70 minutes + worked examples 30 minutes + self-test 30 minutes
>
> **Companion**: Outline §2
>
> **Weight of this chapter**: concept questions, delay/throughput calculations, layering and encapsulation are high-frequency exam points; packet switching vs circuit switching is a classic short-answer question.

---

## 0. Chapter thread (memorize these three sentences first)

1. **The Internet can be viewed from two perspectives**: nuts and bolts (hosts, switches, links, networks) and services (the infrastructure that provides communication services to applications).
2. **Data crossing the network = packet switching + layered encapsulation**; each layer adds its own header, and routers process only up to the network layer.
3. **Performance is determined by delay, loss, and throughput**; the four delay components, `La/R`, and the bottleneck link are the core of the calculation questions.

**Common question types in this chapter**

| Question type | Typical phrasing | What to prepare |
|---|---|---|
| Concept | Three elements of a protocol? Four categories of nuts-and-bolts components? | Memorize definitions + give examples |
| Comparison | Packet switching vs circuit switching | Start from “whether resources are reserved / whether statistical multiplexing is used” |
| Calculation | The four delays, `La/R`, throughput, store-and-forward | Remember formulas + unit conversion |
| Layering | Five layers / OSI seven layers, encapsulation, PDU | Draw the diagram + explain what each layer does |
| Short answer | Why layering? Routing vs forwarding? | Answer with “decomposing a complex system / local vs global” |

---

## 1. What is the Internet

### 1.1 The “nuts and bolts” view ★

| Component | Role | Example |
|---|---|---|
| **Host / end system** | Runs network applications | PC, phone, server, IoT |
| **Packet switch** | Forwards packets | router, switch |
| **Communication link** | Transmits bits | fiber, copper, radio, satellite |
| **Network** | Collection of devices, routers, links | home network, campus network, ISP network |

- The Internet = **network of networks**.
- Link rate = **bandwidth / transmission rate** (bps).
- Packet = chunk of data; switches use **store-and-forward**.

### 1.2 The “services” view

- The Internet is the infrastructure that **provides communication services to applications**.
- It provides a **Socket API**: applications hand their data to the network.
- Services include: reliable transfer, best-effort delivery, secure transmission, and so on (provided by combinations of different protocols).

### 1.3 Protocol ★

> **Protocol definition**: ① message format; ② the order of messages sent and received; ③ the actions taken when a message is sent or received.

- Human protocol: ask “what's the time?” → the other person answers; network protocol: TCP connection request → SYN-ACK.
- The three elements can be summarized as: **syntax, semantics, timing**.

**Why protocols are needed**: both sides must agree on “how things are represented, who speaks first, and what to do on receipt”, otherwise they cannot communicate.

---

## 2. Network edge

### 2.1 Access networks ★

| Type | Structure / medium | Rate / characteristics |
|---|---|---|
| **Cable (HFC)** | coaxial cable + fiber to the cable headend; shared | up to 40 Mbps–1.2 Gbps downstream; 30–100 Mbps upstream |
| **DSL** | telephone twisted pair to the DSLAM / central office; dedicated | 24–52 Mbps downstream; 3.5–16 Mbps upstream |
| **Home network** | cable/DSL modem + WiFi AP + router | WiFi 54/450 Mbps; wired 1 Gbps |
| **Wireless WLAN** | 802.11b/g/n, base station / access point | 11/54/450 Mbps; shared, subject to interference |
| **Cellular** | 4G/5G base station | 10’s of Mbps (higher with 5G); wide coverage |
| **Enterprise** | Ethernet switch + router | 100 Mbps / 1 / 10 Gbps; WiFi AP |
| **Data center** | high-bandwidth switches connect large numbers of servers | 10s–100s Gbps |

> The slides do not cover FTTH; as a supplement: fiber to the home, high rate and low loss, but high deployment cost.

**Shared vs dedicated**:

- Cable and WiFi are **shared** media; multiple users compete for them;
- DSL is a **dedicated** line to the central office;
- Enterprise networks usually have wired access to the desktop and WiFi coverage.

### 2.2 Physical media ★

| Type | Description |
|---|---|
| **Twisted pair (UTP)** | cheap, easy to install; rate varies with category / distance |
| **Coaxial cable** | cable TV / broadband; shared |
| **Fiber optic cable** | high speed, low error rate, immune to electromagnetic noise, long distance |
| **Wireless radio** | wireless, mobile; affected by environment / interference / distance |

- **Guided media**: signals propagate in solid media.
- **Unguided media**: signals propagate freely, e.g., radio.

### 2.3 How a host sends packets

- The application message is broken into **packets** of length `L` bits.
- Link transmission rate `R` bps.
- **Transmission delay**: `L/R`.
- Switches **store and forward**: the entire packet must arrive (and be checked) before it can be transmitted on the next link.

**Example**: L=10 Kbit, R=100 Mbps → `L/R = 10^4 / 10^8 = 0.1 ms` (the slide example).

---

## 3. Network core

### 3.1 Forwarding vs routing ★

| Concept | Scope | What it does |
|---|---|---|
| **Forwarding** | local, per packet | move arriving packets from the router's input link to the appropriate output link, based on the local forwarding table |
| **Routing** | global, paths | run routing algorithms to determine the source-destination paths taken by packets |

> Analogy: forwarding is “reading the sign at an intersection to pick a direction”; routing is “planning the whole route in advance”.

### 3.2 Packet switching ★★

- Data is split into packets that travel independently; **statistical multiplexing** (sharing bandwidth on demand).
- **Store-and-forward**: receive the entire packet before forwarding.
- **Queueing**: arrival rate (in bps) > output rate → packets queue in the buffer; buffer full → **packet loss**.
- Advantages: great for **bursty** data, high bandwidth utilization, no call setup.
- Disadvantages: queueing delay, packet loss, and the need for reliable data transfer / congestion control.

**Store-and-forward delay over two links** (no queueing or processing):

```
d = 2L/R
```

### 3.3 Circuit switching ★★

- **End-end resources (bandwidth / slots) are reserved** when the call is set up, and dedicated for the duration of the call.
- **FDM**: frequency division multiplexing, different frequency bands;
- **TDM**: time division multiplexing, periodic time slots.
- Advantages: bandwidth / delay guarantees, good for real-time voice.
- Disadvantages: wasted when idle, slow call setup, low resource utilization.

### 3.4 Packet switching vs circuit switching: the classic example ★★

**Scenario**: 1 Gb/s link; each user sends 100 Mb/s when “active”; active 10% of the time.

- **Circuit switching**: 100 Mb/s reserved per call → at most **10** users.
- **Packet switching**: with 35 users, the probability that more than 10 are active at the same time is **< 0.0004** → no congestion most of the time.
- Conclusion: **packet switching is more efficient for bursty data**; but packet switching gives no hard guarantees, and delay / loss rise under congestion.

> How this is calculated: binomial distribution, `P(X > 10)` with `X ~ B(35, 0.1)`; the slides only ask you to understand the conclusion.

### 3.5 Internet structure: a “network of networks”

- Access ISP → regional ISP → **tier-1 ISP**;
- **IXP** (Internet Exchange Point) lets ISPs interconnect;
- **Content provider networks** (Google, Netflix, Akamai) run their own CDN / backbone to bring content close to end users;
- Business relationships: transit (paid transmission), peering (peering link), multi-homing.

---

## 4. Performance: delay, loss, throughput

### 4.1 The four sources of delay ★★

```
d_nodal = d_proc + d_queue + d_trans + d_prop
```

| Component | Formula / determining factor | Magnitude |
|---|---|---|
| **Processing delay** `d_proc` | check bit errors, look up the forwarding table | typically < µs |
| **Queueing delay** `d_queue` | depends on the congestion level, `La/R` | from 0 up to very large |
| **Transmission delay** `d_trans` | `L/R` (packet length / link rate) | determined by packet length and bandwidth |
| **Propagation delay** `d_prop` | `d/s` (distance / propagation speed) | determined by physical distance |

- Propagation speed `s ≈ 2×10⁸ m/s` (about 2/3 the speed of light in fiber / copper).
- ⚠ **Transmission delay ≠ propagation delay**: the former is “pushing the bits onto the link”, the latter is “the signal traveling through the medium”.

**Example**: L=1000 bytes=8000 bits, R=100 Mbps, d=2000 km, s=2×10⁸ m/s.
- `d_trans = 8000 / 10⁸ = 80 µs`
- `d_prop = 2×10⁶ / 2×10⁸ = 10 ms`
- total delay ≈ **10.08 ms** (propagation dominates).

### 4.2 Traffic intensity and queueing ★★

```
traffic intensity = La/R
```

- `a`: average packet arrival rate (packets/sec); `L`: packet length (bits); `R`: link bandwidth (bit transmission rate).
- `La/R ≈ 0`: average queueing delay is small;
- `La/R → 1`: average queueing delay grows sharply;
- `La/R > 1`: more “work” arriving than can be serviced, so the queue grows without bound (in practice, packets are lost).

**Example**: L=1000 bytes=8000 bits, a=100 packets/sec, R=1 Mbps:
`La/R = 8000×100 / 10⁶ = 0.8` → close to 1, queueing delay will be noticeable.

### 4.3 Packet loss

- Router buffers are finite; if the arrival rate to the link keeps exceeding the output rate → the buffer fills up → later packets are dropped.
- A lost packet may be retransmitted, which makes congestion even worse.
- Symptoms: application timeouts, lower throughput, delay jitter.

### 4.4 Throughput ★★

- End-end throughput = the rate of the **bottleneck link**:

```
throughput = min(R_s, R_c, ...)
```

- If 10 connections (fairly) share backbone `R`, each connection's throughput ≈ `min(R_s, R_c, R/10)`.
- The bottleneck is usually the access link (`R_s` or `R_c`), not the core backbone.

**Example**: server upstream 2 Mbps, client downstream 10 Mbps, backbone 100 Mbps → throughput = **2 Mbps**.

### 4.5 traceroute

- Send probes with TTL=1, 2, 3, ...; each router returns an ICMP time-exceeded message; measure the RTT hop by hop.
- You can see the path, the delay of each hop, and loss / routing changes.

---

## 5. Layering and the protocol stack

### 5.1 Why layering ★

- Decompose a complex system into manageable modules;
- Each layer relies only on the services provided by the layer below, so a layer's implementation can evolve independently;
- Easier standardization, interoperability, and teaching.

**Cost**: header overhead, information hiding between layers, and difficulty of cross-layer optimization.

### 5.2 The five-layer model vs the seven-layer OSI model ★★

| Internet five layers | OSI seven layers | Function | PDU |
|---|---|---|---|
| Application | Application / Presentation / Session | application semantics, representation, sessions | message |
| Transport | Transport | process-to-process | segment |
| Network | Network | host-to-host, routing | datagram |
| Link | Data Link | neighboring nodes, framing | frame |
| Physical | Physical | bit transmission | bit |

- OSI's Presentation / Session are handled by the application layer itself in the Internet.
- The five layers are the model commonly used in teaching and engineering; OSI is the reference model.

### 5.3 Encapsulation ★★

```
Application:  M
Transport:    [H_t | M]                 segment
Network:      [H_n | H_t | M]           datagram
Link:         [H_l | H_n | H_t | M]     frame
Physical:     bit stream
```

- Each layer adds its own header; the receiver decapsulates layer by layer.
- Routers process up to the network layer; link-layer switches process up to the link layer.
- Headers are “contracts between layers”: addresses, protocol numbers, length, checksums, and so on.

### 5.4 End-end vs hop-by-hop

- Transport layer: **end-end** (process-to-process), implemented only at the two ends.
- Network layer: hop-by-hop routing; every router takes part.
- Link layer: hop-by-hop (neighboring nodes).

---

## 6. Network security and history (for awareness)

### 6.1 Common threats

| Threat | Description |
|---|---|
| **Malware** | viruses, worms, Trojan horses, botnets |
| **DoS/DDoS** | a flood of traffic / requests exhausts resources |
| **Sniffing** | packet capture on shared media / wireless |
| **Spoofing** | forge the source IP / MAC |

### 6.2 Historical phases

- 1961–1972: early packet-switching principles, ARPANET;
- 1972–1980: internetworking, the beginnings of TCP/IP;
- 1980–1990: protocol standardization, DNS, NSFNET;
- 1990s: commercialization, the Web, browsers;
- 2005–: mobility, cloud, SDN, CDN, IoT.

---

## 7. Worked examples

### Example 1: The four sources of delay (10 points)

**Question**: L=1500 bytes, R=1 Gbps, link length 3000 km, s=2×10⁸ m/s, processing delay 10 µs, queueing delay negligible. Find the nodal delay.

**Solution**:
- `L = 1500×8 = 12000 bit`
- `d_trans = 12000 / 10⁹ = 12 µs`
- `d_prop = 3×10⁶ / 2×10⁸ = 15 ms`
- `d_proc = 10 µs`
- `d ≈ 10 µs + 12 µs + 15 ms = 15.022 ms`

**Marking points**: unit conversion (bytes→bits, km→m, ms/µs); propagation delay dominates.

### Example 2: Store-and-forward (8 points)

**Question**: packet length 10 Kbit, link rate 100 Mbps, 2 links (1 router), processing / queueing ignored. Find the end-end transmission delay.

**Solution**:
- Per link `L/R = 10⁴ / 10⁸ = 0.1 ms`
- Store-and-forward over two links: `2L/R = 0.2 ms`

**Marking points**: the router must receive the entire packet before forwarding; with three links it would be `3L/R`.

### Example 3: Packet switching vs circuit switching (10 points)

**Question**: 1 Gb/s link, 100 Mb/s when a user is active, active 10% of the time. How many users can circuit switching support at most? Why can packet switching support 35?

**Solution**:
- Circuit: `1 Gb/s / 100 Mb/s = 10` users (reserved per user).
- Packet: with 35 users, the number active at the same time is `X~B(35,0.1)`; `P(X>10) < 0.0004`, i.e., the link capacity is not exceeded the vast majority of the time.
- Conclusion: statistical multiplexing improves utilization, but under congestion there is queueing / loss.

### Example 4: Throughput (6 points)

**Question**: server upstream 10 Mbps, client downstream 100 Mbps, backbone 1 Gbps, 10 connections fairly sharing the backbone. Find the throughput of a single connection.

**Solution**:
- Bottleneck = `min(10 Mbps, 100 Mbps, 1 Gbps/10 = 100 Mbps)` = **10 Mbps**.
- If the backbone were only 50 Mbps, then `min(10, 100, 5) = 5 Mbps`.

### Example 5: Encapsulation (8 points)

**Question**: describe the encapsulation / decapsulation process for an application message going from host A to host B across one router.

**Solution**:
1. The application on A generates message M;
2. The transport layer adds `H_t` → segment;
3. The network layer adds `H_n` → datagram;
4. The link layer adds `H_l` → frame; the physical layer sends it;
5. The router receives the frame, decapsulates it up to the network layer, looks up the forwarding table, and re-encapsulates it into a frame for the next link;
6. B decapsulates layer by layer and finally hands M to the application.

**Marking points**: the header added by each layer, the router going only up to the network layer, B decapsulating layer by layer.

### Example 6: Traffic intensity (6 points)

**Question**: packet length 1000 bytes, arrival rate 200 packets/sec, link 10 Mbps. Find the traffic intensity and judge the queueing situation.

**Solution**:
- `L = 8000 bit`; `La/R = 8000×200 / 10⁷ = 1.6`.
- `> 1`: the arrival rate exceeds the service rate, so the queue keeps growing → severe queueing / loss.

---

## 8. Common mistakes (where marks are most easily lost)

| Wrong statement | Correct understanding |
|---|---|
| Transmission delay = propagation delay | transmission is `L/R` (pushing the bits), propagation is `d/s` (the signal traveling) |
| Larger bandwidth means smaller propagation delay | propagation delay depends only on distance / medium, not on bandwidth |
| Throughput = link bandwidth | throughput = rate of the bottleneck link, which may be far less than the bandwidth |
| Packet switching is always better than circuit switching | it is more efficient for bursty traffic; circuit switching is more suitable for real-time / guaranteed services |
| Circuit switching “has no delay” | it has propagation / transmission delay; it just has no queueing / congestion |
| Routers process up to the application layer | routers go only up to the network layer; switches up to the link layer |
| Five layers = OSI seven layers | the five layers are the Internet model; OSI has a presentation layer / session layer |
| More layers is always better | layering costs header / performance overhead; it is a tradeoff |
| Delay is stable when `La/R=1` | as `→1` queueing delay grows sharply; at `>1` the queue grows without bound |
| A protocol only defines the message format | it also defines the order / timing and the actions taken on receipt |

---

## 9. Self-test (do it first, then check the answers)

1. From the “nuts and bolts” view, what four categories of components make up the Internet?
2. What are the three elements of a protocol? Explain with the “asking the time” analogy.
3. What is the core difference between packet switching and circuit switching? What are the pros and cons of each?
4. Write out the four components of nodal delay; which of them depend on packet length?
5. What happens as `La/R` approaches 1? Why?
6. What is the difference between transmission delay and propagation delay? What determines each?
7. What are the PDU names at each layer of the five-layer protocol stack? How does encapsulation work?
8. What is the difference between routing and forwarding?
9. Why layering? What does it cost?
10. What is the difference between FDM and TDM in circuit switching?
11. What determines end-end throughput? How do you compute it when 10 connections share the backbone?
12. How does traceroute work?

### Answers

1. Hosts / end systems, packet switches (routers / switches), communication links, networks (a network of networks).
2. Message format, order / timing, and the actions taken after receiving a message; a human asks the time → an answer, a network request → a response.
3. Packet: statistical multiplexing, good for bursty traffic, possible queueing / loss; circuit: reserved resources, guarantees, wasted when idle.
4. Processing, queueing, transmission `L/R`, propagation `d/s`; transmission depends on packet length, propagation depends on distance / medium.
5. Queueing delay grows sharply and buffer overflow causes packet loss; the arrival rate keeps exceeding the output rate.
6. Transmission: pushing the bits onto the link, `L/R`; propagation: the signal traveling through the medium, `d/s`.
7. Application message, transport segment, network datagram, link frame, physical bit; each layer adds its header.
8. Routing: global path selection (routing algorithms); forwarding: locally moving packets from the input link to the output link.
9. Decomposing a complex system, independent evolution of modules, standardization; the cost is header overhead and information hiding between layers.
10. FDM divides frequency into bands; TDM divides time into slots; both reserve resources.
11. The bottleneck link `min(R_s,R_c,...)`; with 10 connections fairly sharing backbone R, each gets `min(R_s,R_c,R/10)`.
12. Send probes with increasing TTL, each router returns an ICMP time-exceeded message, and measure the RTT hop by hop.

---

## 10. Pre-exam quick-reference card

| Point | Content |
|---|---|
| Four categories of components | hosts, packet switches, links, networks |
| Three elements of a protocol | format, order, action |
| Circuit switching | reserved resources; FDM/TDM; the 10-user example |
| Packet switching | statistical multiplexing; store-and-forward; queueing / loss; the 35-user example |
| Delay | `d_proc + d_queue + d_trans + d_prop` |
| Transmission / propagation | `L/R`; `d/s` |
| Traffic intensity | `La/R`; →1 means large delay, >1 means loss |
| Throughput | `min(R_s,R_c,...)`; 10 connections `R/10` |
| Five layers | application / transport / network / link / physical |
| PDU | message/segment/datagram/frame/bit |
| Encapsulation | each layer adds a header; routers up to the network layer |
| Routing vs forwarding | global path vs local port |
