const GLOSSARY = {
  "ISP": [
    "Internet Service Provider",
    "互联网服务提供商"
  ],
  "DSL": [
    "Digital Subscriber Line",
    "数字用户线路"
  ],
  "DSLAM": [
    "Digital Subscriber Line Access Multiplexer",
    "DSL 接入复用器"
  ],
  "HFC": [
    "Hybrid Fiber Coax",
    "光纤同轴混合网络"
  ],
  "MAC": [
    "Media Access Control",
    "介质访问控制（网卡地址）"
  ],
  "IP": [
    "Internet Protocol",
    "网际协议"
  ],
  "TCP": [
    "Transmission Control Protocol",
    "传输控制协议"
  ],
  "UDP": [
    "User Datagram Protocol",
    "用户数据报协议"
  ],
  "HTTP": [
    "HyperText Transfer Protocol",
    "超文本传输协议"
  ],
  "HTTPS": [
    "HyperText Transfer Protocol Secure",
    "安全超文本传输协议"
  ],
  "DNS": [
    "Domain Name System",
    "域名系统"
  ],
  "TLD": [
    "Top-Level Domain",
    "顶级域"
  ],
  "RR": [
    "Resource Record",
    "资源记录"
  ],
  "NS": [
    "Name Server record",
    "域名服务器记录"
  ],
  "CNAME": [
    "Canonical Name record",
    "规范名/别名记录"
  ],
  "MX": [
    "Mail Exchanger record",
    "邮件交换记录"
  ],
  "DNSSEC": [
    "DNS Security Extensions",
    "DNS 安全扩展"
  ],
  "SMTP": [
    "Simple Mail Transfer Protocol",
    "简单邮件传输协议"
  ],
  "IMAP": [
    "Internet Message Access Protocol",
    "互联网消息访问协议"
  ],
  "POP3": [
    "Post Office Protocol version 3",
    "邮局协议第 3 版"
  ],
  "MIME": [
    "Multipurpose Internet Mail Extensions",
    "多用途互联网邮件扩展"
  ],
  "UA": [
    "User Agent",
    "用户代理"
  ],
  "P2P": [
    "Peer-to-Peer",
    "对等网络"
  ],
  "CDN": [
    "Content Distribution Network",
    "内容分发网络"
  ],
  "DASH": [
    "Dynamic Adaptive Streaming over HTTP",
    "基于 HTTP 的动态自适应流"
  ],
  "OTT": [
    "Over-The-Top",
    "越过传统运营商的互联网内容服务"
  ],
  "CBR": [
    "Constant Bit Rate",
    "恒定比特率"
  ],
  "VBR": [
    "Variable Bit Rate",
    "可变比特率"
  ],
  "RTT": [
    "Round-Trip Time",
    "往返时间"
  ],
  "MSS": [
    "Maximum Segment Size",
    "最大报文段长度"
  ],
  "GBN": [
    "Go-Back-N",
    "回退 N 步协议"
  ],
  "SR": [
    "Selective Repeat",
    "选择重传协议"
  ],
  "NAK": [
    "Negative Acknowledgement",
    "否定确认"
  ],
  "ACK": [
    "Acknowledgement",
    "确认"
  ],
  "SYN": [
    "Synchronize",
    "同步标志"
  ],
  "FIN": [
    "Finish",
    "结束标志"
  ],
  "RST": [
    "Reset",
    "重置标志"
  ],
  "PSH": [
    "Push",
    "推送标志"
  ],
  "URG": [
    "Urgent",
    "紧急标志"
  ],
  "AIMD": [
    "Additive Increase Multiplicative Decrease",
    "加性增、乘性减"
  ],
  "ECN": [
    "Explicit Congestion Notification",
    "显式拥塞通知"
  ],
  "QUIC": [
    "Quick UDP Internet Connections",
    "基于 UDP 的快速传输协议"
  ],
  "HOL": [
    "Head-of-Line",
    "队头阻塞"
  ],
  "OSI": [
    "Open Systems Interconnection",
    "开放系统互连参考模型"
  ],
  "PDU": [
    "Protocol Data Unit",
    "协议数据单元"
  ],
  "API": [
    "Application Programming Interface",
    "应用编程接口"
  ],
  "NAT": [
    "Network Address Translation",
    "网络地址转换"
  ],
  "ICMP": [
    "Internet Control Message Protocol",
    "互联网控制消息协议"
  ],
  "DHCP": [
    "Dynamic Host Configuration Protocol",
    "动态主机配置协议"
  ],
  "SNMP": [
    "Simple Network Management Protocol",
    "简单网络管理协议"
  ],
  "URL": [
    "Uniform Resource Locator",
    "统一资源定位符"
  ],
  "IXP": [
    "Internet Exchange Point",
    "互联网交换点"
  ],
  "TTL": [
    "Time To Live",
    "生存时间"
  ],
  "TLS": [
    "Transport Layer Security",
    "传输层安全协议"
  ],
  "ASCII": [
    "American Standard Code for Information Interchange",
    "美国信息交换标准代码"
  ],
  "FTTH": [
    "Fiber To The Home",
    "光纤到户"
  ],
  "cwnd": [
    "Congestion Window",
    "拥塞窗口"
  ],
  "rwnd": [
    "Receive Window",
    "接收窗口"
  ]
};
(function () {
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function expand() {
    if (!(document.documentElement.lang || '').toLowerCase().startsWith('zh')) return;
    if (location.pathname.indexOf('/glossary/') !== -1) return;
    if (location.pathname.indexOf('/review/') === -1 && location.pathname.indexOf('/hw/') === -1) return;
    var root = document.querySelector('.md-typeset');
    if (!root || root.dataset.glossaryDone) return;
    root.dataset.glossaryDone = '1';

    var skip = {CODE:1, PRE:1, H1:1, H2:1, H3:1, H4:1, H5:1, H6:1, A:1, TD:1, TH:1, SCRIPT:1, STYLE:1};
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentElement;
        while (p && p !== root) {
          if (skip[p.tagName]) return NodeFilter.FILTER_REJECT;
          p = p.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    var terms = Object.keys(GLOSSARY).sort(function (a, b) { return b.length - a.length; });
    var rx = new RegExp('(?<![A-Za-z0-9])(' + terms.map(esc).join('|') + ')(?![A-Za-z0-9])', 'g');
    var done = Object.create(null);

    nodes.forEach(function (node) {
      var text = node.nodeValue;
      if (!text || text.length < 2) return;
      var out = '', last = 0, m;
      rx.lastIndex = 0;
      while ((m = rx.exec(text)) !== null) {
        var term = m[1];
        if (done[term]) continue;
        var start = m.index, end = start + term.length;
        var before = text.slice(0, start);
        var after = text.slice(end);
        if (/^[（(]/.test(after)) continue;
        if (/[（(]$/.test(before)) continue;
        if (after.charAt(0) === '-') continue;
        var info = GLOSSARY[term];
        out += text.slice(last, start) + term + '（' + info[0] + '，' + info[1] + '）';
        last = end;
        done[term] = true;
      }
      if (last) {
        out += text.slice(last);
        node.nodeValue = out;
      }
    });
  }
  if (typeof document$ !== 'undefined') document$.subscribe(expand);
  else document.addEventListener('DOMContentLoaded', expand);
})();
