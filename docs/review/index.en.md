# Review Notes · All Chapters

> **3 chapters** in total, corresponding to decks `ch1-8.pdf`–`ch3-8.pdf`.
> Every chapter follows the same structure: **Chapter thread → Key concepts → Worked examples → Common mistakes → Self-test (with answers) → Pre-exam quick-reference card**.
> Companion overview: [knowledge outline](../outline.md)

---

## Chapter contents

| Chapter | Topic | Matching decks | Suggested time | File |
|---|---|---|---|---|
| 1 | Introduction to Computer Networks | Chapter 1 Introduction | 130 min | [Chapter 1](ch1-intro.md) |
| 2 | Application Layer | Chapter 2 Application Layer | 160 min | [Chapter 2](ch2-application.md) |
| 3 | Transport Layer | Chapter 3 Transport Layer | 210 min | [Chapter 3](ch3-transport.md) |

---

## How to use (the three-pass method)

**Pass 1: build the framework (10–15 minutes per chapter)**
1. Read the three sentences of the “Chapter thread”;
2. Go straight to the “Pre-exam quick-reference card” at the end;
3. Close the file and draw the chapter's structure on a blank sheet of paper (protocol stack / timing / state machine).

**Pass 2: nail down the mechanisms (60–90 minutes per chapter)**
1. Read the “Key concepts” closely and derive each formula yourself;
2. Cover the worked-example solutions, do them yourself first, then compare;
3. Write the points you got wrong next to “Common mistakes”.

**Pass 3: self-test (30 minutes per chapter)**
1. Cover the answers and do the “Self-test”;
2. For wrong answers, go back to the corresponding subsection of the key concepts;
3. The next day, review only the quick-reference card + the questions you got wrong.

**30 minutes before the exam**: review only each chapter's “quick-reference card” + “Common mistakes”, plus the formula table in §6 of the knowledge outline.

---

## High-frequency calculation questions

| Type | Chapter | Key formula |
|---|---|---|
| The four sources of delay | 1 | <span class="mchip">\(d = d_{\text{proc}} + d_{\text{queue}} + L/R + d/s\)</span> |
| Traffic intensity / queueing | 1 | <span class="mchip">\(La/R\)</span> |
| Throughput / bottleneck | 1 | `min(R_s,R_c,...)` |
| Non-persistent HTTP | 2 | `2 RTT + L/R` |
| Persistent HTTP | 2 | 1 RTT to initiate the TCP connection; with pipelining, as little as 1 RTT in total |
| P2P file distribution | 2 | `max{F/u_s, F/d_min, NF/(u_s+Σu_i)}` |
| stop-and-wait | 3 | <span class="mchip">\(U=(L/R)/(RTT+L/R)\)</span> |
| TCP RTT / timeout | 3 | <span class="mchip">\(\text{Est}=0.875\text{Est}+0.125\text{Sample}\)</span>; <span class="mchip">\(\text{Timeout}=\text{Est}+4\text{Dev}\)</span> |
| TCP throughput | 3 | <span class="mchip">\(0.75\cdot W/RTT\)</span> |

---

## One-sentence review per chapter

1. **Chapter 1**: the Internet = hosts + switches + links + networks; data travels by “packet switching + layered encapsulation”; performance is about the four sources of delay, <span class="mchip">\(La/R\)</span>, and bottleneck throughput.
2. **Chapter 2**: application-layer protocols define message format and ordering; HTTP is stateless and relies on cookies/caches to make up for it; DNS is a hierarchical database; P2P scales through peer upload bandwidth.
3. **Chapter 3**: the transport layer is process-to-process; reliable transfer = ACKs + sequence numbers + timers; TCP adds flow control/congestion control on top of reliability; AIMD/slow start are the core.

---

## Notes

- The decks correspond to Chapters 1–3 of Kurose & Ross *Computer Networking: A Top-Down Approach* (8th ed.).
- For “Additional slides” in the decks (such as the GBN extended FSM and the TCP throughput derivation), these notes keep only the conclusions and do not expand them page by page.
- If you want to expand a chapter into “30 practice questions + detailed solutions”, you can keep building on top of this table of contents.
