# Chapter 3 · Transport Layer · Review Notes

> **Matching slides**: `ch3-8.pdf` (Kurose & Ross, Chapter 3 Transport Layer, 8th ed.)
>
> **Suggested time**: first pass 120 minutes + worked examples 50 minutes + self-test 40 minutes
>
> **Companion**: Outline §4
>
> **Weight of this chapter**: the most calculation/mechanism-dense chapter in the course: rdt, GBN/SR, TCP sequence numbers/ACK/RTT, flow control, congestion control.

---

## 0. Chapter thread (memorize these three sentences first)

1. **The transport layer provides process-to-process logical communication**; multiplexing/demultiplexing rely on ports (TCP also needs the 4-tuple).
2. **Reliable transfer = ACKs + sequence numbers + timers + retransmission**; pipelining (GBN/SR) uses windows to raise utilization.
3. **TCP adds flow control (rwnd) and congestion control (cwnd) on top of reliable transfer**; AIMD + slow start is the classic form, CUBIC/QUIC are the modern evolution.

**Common question types in this chapter**

| Question type | Typical phrasing | What to prepare |
|---|---|---|
| Calculation | stop-and-wait utilization, TCP throughput, RTT estimation | Remember formulas + units |
| Mechanism | rdt2.0 flaw, GBN/SR windows, three-way handshake | Draw the timing/state diagram |
| Analysis | Given a loss/delay scenario, ask about retransmission/ACK | Reason from “sequence number + timer” |
| Comparison | TCP vs UDP, GBN vs SR, flow control vs congestion | Make a table |
| Short answer | Why the three-way handshake? Why is AIMD fair? | Grasp the key reasons |

---

## 1. Transport-layer services

### 1.1 Position and responsibilities ★

- Network layer: **host-to-host**; transport layer: **process-to-process**.
- Sender: breaks application data into segments, adds the transport-layer header, passes it to the network layer.
- Receiver: reassembles segments and delivers them to the correct socket by port.
- The transport layer is implemented only in end systems; routers do not process the transport layer.

### 1.2 Multiplexing/demultiplexing (mux/demux) ★★

**Multiplexing (sender)**: gather data from multiple sockets, add the header (source/dest port, etc.), pass it to the network layer.

**Demultiplexing (receiver)**: use header fields to deliver the segment to the correct socket.

| Protocol | Demultiplexing identifier |
|---|---|
| **UDP** | `<dest IP, dest port>` |
| **TCP** | `<source IP, source port, dest IP, dest port>` 4-tuple |

- UDP: same dest port but different source → delivered to the same socket.
- TCP: the 4-tuple uniquely identifies a connection; the same port can have multiple connections.

---

## 2. UDP

### 2.1 Characteristics ★

- **Connectionless**: no handshaking; each datagram is independent.
- **Unreliable**: no guarantee of arrival, order, or non-duplication.
- **No flow control/congestion control**: the sender sends at the application's pace.
- Small overhead, low delay, header is only 8 bytes.
- Suitable for: DNS, DHCP, SNMP, streaming media, games, the QUIC substrate.

**Why use UDP**:

- the application implements reliability/real-time delivery itself;
- it does not want to be slowed down by TCP's congestion control/retransmission;
- for short request/response (DNS), the connection-setup cost is not worth it.

### 2.2 UDP header ★★

```
0               16              31
+----------------+----------------+
| source port(16)| dest port(16)  |
+----------------+----------------+
| length(16)     | checksum(16)   |
+----------------+----------------+
| data ...                        |
+---------------------------------+
```

- Length: header + data (bytes), minimum 8.
- Checksum: covers the **pseudo-header + UDP header + data**; the pseudo-header contains the source/dest IP, protocol number, and UDP length.
- Computation: 16-bit one's complement sum, then complement it; the receiver verifies (all 1s means no checksum, optional in IPv4).

**The checksum is very weak**: 16 bits, errors may slip through; but better than nothing.

---

## 3. Principles of reliable data transfer (rdt) ★★

### 3.1 Interfaces and assumptions

```
rdt_send(data)        // called from above
udt_send(packet)      // pass to unreliable channel
rdt_rcv(packet)       // receive packet from channel
deliver_data(data)    // deliver to upper layer
```

Add channel assumptions step by step: **reliable → bit errors → packet loss**.

### 3.2 rdt1.0: reliable channel

- Sender: receive data → make packet → send.
- Receiver: receive packet → extract → deliver.
- No ACK, sequence number, or timer needed.

### 3.3 rdt2.0: channel with bit errors ★

- Needs: **error detection (checksum)**, **ACK/NAK**, **retransmission**.
- The sender sends and then waits for ACK/NAK; on NAK or corruption → retransmit.
- **Fatal flaw**: the ACK/NAK itself may be corrupted → the sender does not know whether it was “success” or “failure”, so it may send a duplicate.

### 3.4 rdt2.1: handling garbled ACK/NAK ★

- Add **sequence number 0/1** to the data packet.
- Sender: send the current packet, wait for the corresponding ACK; timeout/corruption → retransmit.
- Receiver: use the sequence number to detect duplicates; discard duplicates but still send ACK.
- Twice as many states (wait for ACK0 / ACK1).

### 3.5 rdt2.2: NAK-free ★

- Uses **ACK only**; the ACK carries “the next sequence number expected”.
- Receiver on a correct packet → send ACK (expected seq #); on duplicate/out-of-order → resend the previous ACK.
- Sender on a **duplicate ACK** → retransmit the current packet.
- Same functionality as rdt2.1, but one fewer message type.

### 3.6 rdt3.0: channels with loss ★★

- Add a **timer**: start it after sending; if no ACK arrives before the timeout → retransmit.
- Sequence numbers 0/1; handling:
  - data lost → timeout retransmission;
  - ACK lost → timeout retransmission (receiver discards the duplicate);
  - delayed ACK → possible duplicate, but sequence numbers can handle it.
- **stop-and-wait**: send only one packet at a time, then wait for the ACK; simple but extremely low utilization.

### 3.7 stop-and-wait performance ★★

\[
U_{\text{sender}} = \frac{L/R}{RTT + L/R}
\]

**Example** (slides): 1 Gbps link, 15 ms one-way propagation (RTT=30 ms), 8000-bit packet.
- `L/R = 8000/10⁹ = 8 µs = 0.008 ms`
- `U = 0.008 / (30 + 0.008) ≈ 0.00027`
- That is, the sender is sending data only **0.027%** of the time.

**Fix**: pipelining — allow multiple unacknowledged packets to be in flight at once; utilization increases by a factor of N.

---

## 4. Pipelined protocols: GBN and SR

### 4.1 Go-Back-N (GBN) ★★

**Sender**

- Window N: at most N consecutive unacknowledged packets.
- k-bit sequence numbers; the window slides.
- **Cumulative ACK**: `ACK(n)` means n and all packets before it have been received.
- **One timer**: only for the oldest unacknowledged packet; on timeout → retransmit that packet and all subsequent packets in the window.

**Receiver**

- Accepts only in order; expects `rcv_base`.
- Correct sequence number → deliver, send ACK, `rcv_base++`.
- Out-of-order packet → **discard** (do not buffer), re-ACK the last correctly received packet (may generate duplicate ACKs).

**Characteristics**: the receiver is simple; losing one packet retransmits the whole window, wasting bandwidth.

### 4.2 Selective Repeat (SR) ★★

**Sender**

- Window N; **a separate timer for each packet**.
- Retransmits only the packet that timed out.
- ACK received → mark that packet as ACKed; the window slides.

**Receiver**

- Buffers out-of-order packets; **individually ACKs** each correctly received packet.
- Delivers in order; once the missing packet arrives, delivers the buffered consecutive packets together.

**Window constraint**:

\[
N \le 2^{k-1}
\]

- k is the number of sequence-number bits; the sequence-number space is 2^k, and the window cannot exceed half of it, otherwise “new packet” and “retransmission of an old packet” cannot be distinguished.
- Example: k=2 (sequence numbers 0..3), N at most 2; with N=3 the receiver will mistake an old packet for a new one.

### 4.3 GBN vs SR ★★

| Dimension | GBN | SR |
|---|---|---|
| Receiver buffering | does not buffer out-of-order packets | buffers out-of-order packets |
| ACK | cumulative ACK | individual ACK |
| Retransmission | whole window | only the lost packet |
| Timer | one (oldest packet) | one per packet |
| Window | N | N ≤ 2^(k-1) |
| Complexity | simple | complex |
| Applicable | few errors / small window | many errors / high bandwidth |

---

## 5. TCP

### 5.1 Overview ★

- **Point-to-point**: one sender, one receiver.
- **Reliable, in-order**: byte stream.
- **Full duplex**: bidirectional data.
- **Connection-oriented**: a handshake establishes state.
- **Flow control**: rwnd.
- **Congestion control**: cwnd.

### 5.2 TCP segment structure ★★

```
0               16              31
+----------------+----------------+
| source port(16)| dest port(16)  |
+----------------+----------------+
| sequence number (32)            |
+---------------------------------+
| acknowledgement number (32)     |
+---------------------------------+
|head| not | flag| receive window |
+----+-----+-----+----------------+
| checksum(16)   | urg data ptr   |
+----------------+----------------+
| options (variable length)       |
+---------------------------------+
| data ...                        |
```

- Minimum header **20 bytes** (no options).
- Flags: SYN, ACK, FIN, RST, PSH, URG.
- Sequence number: **byte-stream number**, not a packet number.
- Acknowledgement number: the sequence number of the next byte expected (cumulative ACK).

### 5.3 Sequence numbers and ACKs ★★

- The sender numbers every byte; the sequence number of the segment's first byte goes in `Seq`.
- Receiver `ACK = next byte expected`.
- Example: send 1000 bytes, `Seq=1000`; the receiver receives them correctly → `ACK=2000`.
- Loss/out-of-order: the receiver re-ACKs the current expected value; the sender sees 3 duplicate ACKs → fast retransmit.

### 5.4 RTT estimation and timeout ★★

\[
\begin{aligned}
\text{EstimatedRTT} &= (1-\alpha)\cdot\text{EstimatedRTT} + \alpha\cdot\text{SampleRTT}, & \alpha &= 0.125\\
\text{DevRTT} &= (1-\beta)\cdot\text{DevRTT} + \beta\cdot|\text{SampleRTT} - \text{EstimatedRTT}|, & \beta &= 0.25\\
\text{TimeoutInterval} &= \text{EstimatedRTT} + 4\cdot\text{DevRTT}
\end{aligned}
\]

- `EstimatedRTT`: the smoothed RTT estimate.
- `DevRTT`: RTT deviation (jitter).
- Timeout = estimate + safety margin; large deviation → longer timeout.
- Timeout too long → slow reaction; too short → unnecessary retransmissions.

**Example**: EstimatedRTT=120 ms, DevRTT=10 ms, SampleRTT=100 ms.
- new Estimated = 0.875×120 + 0.125×100 = **117.5 ms**
- new Dev = 0.75×10 + 0.25×|100−120| = **12.5 ms**
- Timeout = 117.5 + 4×12.5 = **167.5 ms**

### 5.5 TCP sender (simplified) ★

Events:

1. Application passes data → create segment → start timer → send.
2. Timeout → retransmit the oldest unACKed segment → restart timer.
3. ACK received → update window; if there is still unACKed data → restart timer; otherwise stop.

### 5.6 Fast retransmit ★

- Receiving **3 duplicate ACKs** (same acknowledgement number) → treat the segment as lost and retransmit immediately, without waiting for the timeout.
- Why 3: a small amount of reordering also produces duplicate ACKs; 3 is a compromise that reduces false judgments.

### 5.7 TCP receiver ACK generation

| Event | Action |
|---|---|
| in-order segment received, all earlier data already ACKed | delayed ACK (up to 500 ms) |
| out-of-order segment received | immediately send a duplicate ACK (expected seq #) |
| segment that fills the gap received | immediate ACK |

### 5.8 Flow control ★★

- Goal: prevent the sender from overflowing the receiver's buffer.
- The receiver advertises free space in the **rwnd (receive window)** field of the header.
- The sender guarantees: `unACKed data ≤ rwnd`.
- **Difference from congestion control**:
  - Flow control: receiver-imposed limit (end-to-end).
  - Congestion control: network-imposed limit (global).

### 5.9 Connection management ★★

**Three-way handshake**

```
client → server: SYN, seq=x
server → client: SYN-ACK, seq=y, ack=x+1
client → server: ACK, ack=y+1
```

- Goal: synchronize both sides' sequence numbers and confirm both sides' send/receive capability.
- Why three: to prevent an **old duplicate SYN** from reaching the server and causing a wrong connection to be established; two is not enough, four is wasteful.

**Closing a connection**

- The active closer sends FIN; the peer ACKs; the peer also sends FIN; final ACK.
- The active closer enters **TIME_WAIT** and waits 2×MSL, to ensure the final ACK can arrive and old packets disappear.

### 5.10 Retransmission scenarios

- ACK lost: the sender times out and retransmits; the receiver receives a duplicate → ACKs again.
- Data lost: timeout / 3 duplicate ACKs → retransmit.
- Delayed ACK: may cause a “premature timeout”, but sequence numbers/ACKs can recover.

---

## 6. Congestion control

### 6.1 Costs of congestion ★

- queueing delay increases;
- buffer overflow → packet loss;
- retransmissions waste bandwidth;
- congestion collapse (throughput drops sharply).

**Three scenarios**:

1. One router, finite buffers: arrival rate approaches capacity → queueing/loss.
2. Multiple routers, retransmissions: loss causes retransmissions, which make congestion worse.
3. Four senders, multi-hop: competing for bandwidth, throughput drops.

### 6.2 Two approaches

| Approach | Who does it | Example |
|---|---|---|
| **End-end** | end systems infer from observed loss/delay | TCP |
| **Network-assisted** | routers provide explicit feedback | ECN, ATM ABR |

### 6.3 TCP AIMD ★★

- **Additive increase (AI)**: `cwnd += 1 MSS` per RTT.
- **Multiplicative decrease (MD)**: on loss, `cwnd = cwnd/2`.
- Sawtooth: probe for available bandwidth → loss → halve → increase again.
- Fairness: when multiple flows compete, AIMD converges to roughly fair.

### 6.4 Slow start ★★

- Initially `cwnd = 1 MSS`.
- For every ACK received, `cwnd += 1 MSS` → **doubles** every RTT (exponential growth).
- After reaching `ssthresh`, enter **congestion avoidance** (linear growth).
- Timeout: `ssthresh = cwnd/2`, `cwnd = 1`, restart slow start.
- 3 duplicate ACKs: fast retransmit + fast recovery:
  - `ssthresh = cwnd/2`
  - `cwnd = ssthresh` (or ssthresh+3)
  - then grow linearly.

**Example**: initial cwnd=1, ssthresh=8.
- Slow start: 1→2→4→8 (3 RTTs).
- Congestion avoidance: 9→10→11...
- Loss at cwnd=12 (3 dup ACKs): ssthresh=6, cwnd=6, then 7,8,...

### 6.5 TCP CUBIC ★

- Grows the window with a **cubic function** (with time as the independent variable):
  - grows slowly near the previous congestion point, fast when far from it;
  - better suited to high-bandwidth, long-delay networks.
- Linux default; more stable and faster to recover than AIMD.

### 6.6 Delay-based congestion control

- Measure RTT changes and keep the pipe “just full” without causing loss.
- Representatives: TCP Vegas; BBR uses bandwidth/RTT estimates.
- Pros: few losses; cons: may be unfair to loss-based flows.

### 6.7 ECN (explicit congestion notification)

- Routers mark congestion in the IP header (instead of dropping).
- The receiver echoes it back in the TCP ACK; the sender slows down.
- Requires end-to-end support.

### 6.8 Fairness ★

- Goal: K TCP flows share a bottleneck, each gets about `R/K`.
- AIMD tends toward fairness.
- Factors that break fairness:
  - different RTTs (short RTTs grab more);
  - UDP does not slow down;
  - multiple parallel connections;
  - application-layer unfairness.

### 6.9 TCP throughput (supplement)

\[
\text{avg throughput} \approx \frac{0.75W}{RTT}
\]

- W is the window size at loss; the average window is about `3/4 W`.
- With loss rate L (Mathis): `throughput ≈ 1.22·MSS / (RTT·√L)`.
- High-bandwidth long-delay networks need a large window; the loss rate must be extremely low.

---

## 7. QUIC (for awareness)

- An application-layer protocol on top of **UDP**; the transport layer of HTTP/3.
- **Stream-level multiplexing**: loss on one stream does not affect the others (avoids TCP HOL blocking).
- **0/1-RTT connection establishment**: reduces handshake delay.
- **Built-in encryption** (TLS 1.3).
- **Connection migration**: keeps the connection alive when a phone switches between WiFi/cellular.
- User-space implementation, easy to iterate quickly.

---

## 8. Worked examples

### Example 1: stop-and-wait utilization (8 points)

**Question**: 1 Gbps link, 15 ms one-way propagation, 8000-bit packet. Find the sender utilization of stop-and-wait.

**Solution**:
- `L/R = 8000/10⁹ = 8 µs = 0.008 ms`
- `RTT = 30 ms`
- `U = 0.008 / (30 + 0.008) ≈ 0.00027` (0.027%)
- Conclusion: pipelining is needed to improve utilization.

### Example 2: GBN retransmission (10 points)

**Question**: GBN, N=4, sequence numbers 0..7. Send 0,1,2,3; ACK0 and ACK1 arrive; then send 4,5; packet 2 is lost. What happens when the receiver gets 3,4,5? When does the sender retransmit, and which packets?

**Solution**:
- The receiver expects 2; 3,4,5 all arrive out of order → discard (or buffer, depending on the implementation), duplicate ACK1.
- The sender receives duplicate ACK1, but fewer than 3; packet 2's timer times out → retransmit **2,3,4,5** (the whole window).
- After receiving 2, the receiver delivers 2,3,4,5 in order and sends ACK5.

### Example 3: TCP sequence numbers/ACK (8 points)

**Question**: TCP sends 2000 bytes with Seq=5000; the receiver correctly receives the first 1000 bytes, and the last 1000 bytes are lost. What ACK does the receiver send back? How does the sender react?

**Solution**:
- The receiver receives 5000–5999, expects 6000 → `ACK=6000`.
- Later segments outside 6000–6999 (if any) → duplicate ACK 6000.
- The sender receives 3 duplicate ACK 6000 → fast retransmit the segment starting at 6000.

### Example 4: RTT estimation (8 points)

**Question**: EstimatedRTT=200 ms, DevRTT=20 ms, SampleRTT=160 ms. Find the new EstimatedRTT, DevRTT, and Timeout.

**Solution**:
- Estimated = 0.875×200 + 0.125×160 = 175 + 20 = **195 ms**
- Dev = 0.75×20 + 0.25×|160−195| = 15 + 8.75 = **23.75 ms**
- Timeout = 195 + 4×23.75 = **290 ms**

### Example 5: AIMD (10 points)

**Question**: cwnd=1, ssthresh=16. Describe slow start up to cwnd=16, then what happens when 3 duplicate ACKs occur at cwnd=20.

**Solution**:
- Slow start: 1→2→4→8→16 (4 RTTs, exponential).
- Congestion avoidance: 17,18,19,20 (+1 per RTT).
- 3 dup ACKs: ssthresh = 20/2 = 10; cwnd = 10 (fast recovery), then 11,12,... linear growth.
- If it were a timeout: ssthresh=10, cwnd=1, restart slow start.

### Example 6: TCP throughput (6 points)

**Question**: W=64 KB, RTT=100 ms. Estimate the average throughput.

**Solution**:
- `0.75×64 KB / 0.1 s = 480 KB/s ≈ 3.84 Mbps`.
- If the loss rate is high, the actual value is lower; high bandwidth and long delay need a larger W.

---

## 9. Common mistakes (where marks are most often lost)

| Mistake | Correct |
|---|---|
| transport layer = host-to-host | the transport layer is **process-to-process**; the network layer is host-to-host |
| UDP has no checksum | UDP has a 16-bit checksum (optional in IPv4, usually enabled) |
| rdt2.0 is already reliable | ACK/NAK may be corrupted → it has a fatal flaw |
| the GBN receiver buffers out-of-order packets | GBN usually **discards** out-of-order packets; only SR buffers them |
| the SR window may equal the sequence-number space | **N ≤ 2^(k-1)**, otherwise there is ambiguity |
| TCP sequence numbers are packet numbers | they are **byte-stream numbers** |
| ACK means “this sequence number has been received” | ACK means “the next byte expected” |
| timeout = 2×RTT | use EstimatedRTT + 4×DevRTT |
| 3 duplicate ACKs always mean loss | they may also be reordering; 3 is a compromise |
| flow control = congestion control | rwnd prevents receiver overflow; cwnd prevents network overload |
| the three-way handshake is for encryption | it is for synchronizing sequence numbers and preventing old connections |
| slow start keeps growing exponentially | after ssthresh it turns linear |
| AIMD halves the window on loss | multiplicative decrease; a timeout may drop it to 1 |
| TCP is always fair | RTT/UDP/parallel connections break fairness |

---

## 10. Self-test (do it first, then check the answers)

1. Difference between the transport layer and the network layer? What do multiplexing/demultiplexing do?
2. UDP header fields? What does the checksum cover? Why is the protection said to be weak?
3. Fatal flaw of rdt2.0? How do rdt2.1/2.2 solve it?
4. How does rdt3.0 handle packet loss? What is the utilization formula for stop-and-wait?
5. Differences between GBN and SR in window, ACK, retransmission, and buffering?
6. What is the minimum TCP segment header size? What do the sequence number and acknowledgement number mean?
7. How does TCP estimate RTT and set the timeout? What do α and β do?
8. What triggers fast retransmit? Why 3 duplicate ACKs?
9. Difference between flow control and congestion control? What are rwnd and cwnd?
10. What is the procedure of the TCP three-way handshake? Why three times?
11. What are the procedures of AIMD, slow start, and fast recovery? What does CUBIC improve?
12. What is TCP fairness? Which factors break fairness?
13. What are the advantages of QUIC over TCP?

### Answers

1. The network layer is host-to-host, the transport layer is process-to-process; mux/demux delivers segments to the correct socket.
2. Source/dest port, length, checksum; pseudo-header + UDP segment; 16-bit one's complement sum, weak protection.
3. ACK/NAK may be corrupted; rdt2.1 adds sequence numbers, rdt2.2 uses ACK + expected seq #.
4. Retransmit on timer timeout; `U=(L/R)/(RTT+L/R)`.
5. GBN: cumulative ACK, one timer, retransmits the whole window, the receiver does not buffer; SR: individual ACK, per-packet timer, retransmits only the lost packet, buffers out-of-order packets.
6. 20 bytes; Seq is the number of the segment's first byte, ACK is the next byte expected.
7. Exponential weighted moving average; α smooths SampleRTT, β smooths the deviation; Timeout=EstimatedRTT+4DevRTT.
8. 3 duplicate ACKs; they show that later packets arrived but the missing packet did not, so the network probably dropped only that one.
9. Flow control prevents receiver overflow (rwnd), congestion control prevents network overload (cwnd).
10. SYN, SYN-ACK, ACK; synchronize sequence numbers and prevent old connection requests.
11. AI adds 1 MSS per RTT, MD halves on loss; slow start grows exponentially to ssthresh; fast recovery follows 3 duplicate ACKs; CUBIC uses a cubic function.
12. K flows sharing a bottleneck each get about R/K; different RTTs, UDP, and parallel connections break it.
13. Implemented on top of UDP, stream-level multiplexing, 0/1-RTT, built-in encryption, connection migration.

---

## 11. Pre-exam quick-reference card

| Item | Content |
|---|---|
| Transport layer | process-to-process; TCP/UDP |
| Demultiplexing | UDP dest IP + port; TCP 4-tuple |
| UDP header | 8 bytes; source/dest port, length, checksum |
| rdt2.0 | ACK/NAK may be corrupted |
| rdt2.1/2.2 | sequence numbers; ACK + expected seq # |
| rdt3.0 | timer; stop-and-wait |
| Utilization | `(L/R)/(RTT+L/R)`; 1Gbps/30ms/8Kbit ≈ 0.00027 |
| GBN | cumulative ACK; one timer; retransmit window |
| SR | individual ACK; per-packet timer; buffering; N≤2^(k-1) |
| TCP header | 20 bytes; Seq/ACK/window/flags |
| RTT | `0.875·Est + 0.125·Sample`; `Timeout=Est+4Dev` |
| Fast retransmit | 3 duplicate ACKs |
| Flow control | rwnd; receiver buffer |
| Congestion control | cwnd; AIMD; slow start; CUBIC |
| Three-way handshake | SYN / SYN-ACK / ACK |
| Throughput | `0.75·W/RTT` |
| QUIC | UDP; stream-level multiplexing; 0/1-RTT |
