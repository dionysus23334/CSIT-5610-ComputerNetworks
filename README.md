# CSIT5610 · Computer Networks 复习笔记

> 个人整理的 HKUST CSIT5610 Computer Networks 复习资料，覆盖第 1–3 章。
>
> 基于 Kurose & Ross, *Computer Networking: A Top-Down Approach*, 8th ed. 的课件整理；非官方资料，课件版权归授课教师与原作者所有。

**在线阅读**：<https://dionysus23334.github.io/CSIT-5610-ComputerNetworks/>

## 内容

- [知识大纲](docs/outline.md)：三章知识地图、协议栈主线、公式速记、30+ 道自测
- [复习资料总目录](docs/review/index.md)：3 章复习材料、三遍复习法、高频计算题索引

### 三章复习资料

| 章 | 主题 | 文件 |
|---|---|---|
| 1 | 计算机网络导论 | [第1章](docs/review/ch1-intro.md) |
| 2 | 应用层 | [第2章](docs/review/ch2-application.md) |
| 3 | 传输层 | [第3章](docs/review/ch3-transport.md) |

## 使用建议

1. 先读知识大纲 §1 建立“分层 + 封装”的全局框架；
2. 按章读复习资料的“主线 → 精讲 → 例题”；
3. 遮住答案做每章“自测”，错题回到精讲；
4. 考前只看每章“速记卡”和易错点。

## 本地预览

```bash
python3 -m venv .venv-docs
.venv-docs/bin/pip install -r requirements.txt
.venv-docs/bin/mkdocs serve
```

打开 <http://127.0.0.1:8000>。推送到 `main` 后，GitHub Actions 会自动构建并发布到 `gh-pages`。

## 说明

- 资料为个人总结，可能存在遗漏或错误；以课件、课堂与教师通知为准。
- 本仓库不包含原始课件 PDF（版权归授课教师/作者所有）。
- 第 1–3 章对应 Kurose & Ross 8th edition 的 Introduction、Application Layer、Transport Layer。
