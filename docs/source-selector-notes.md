# 数据来源与选择器记录

第一阶段优先使用阿里资产公开搜索页：

```text
https://zc-paimai.taobao.com/wow/pm/default/pc/zichansearch?disableNav=YES&locationCodes=%5B%22310000%22%5D&page=1&keyword=%E6%B5%A6%E4%B8%9C%20%E4%BD%8F%E5%AE%85
```

选择原因：

- 淘宝司法拍卖旧入口 `sf.taobao.com` 在命令行访问时容易返回验证码/风控页。
- 阿里资产搜索页可用系统 Chrome + Playwright 正常只读访问。
- 搜索页卡片已包含标题、价格、评估价、开拍/结束时间、围观人数、报名人数、状态和详情链接。

当前实现策略：

- 从搜索结果页的 `<a>` 标签读取卡片文本和详情页链接。
- 仅保留链接指向 `item.taobao.com` 且文本包含“浦东”的卡片。
- 详情页只作为补充读取法院/处置单位和风险关键词；如果详情页触发验证码或读取失败，只记录日志，不中断本次抓取。

后续如页面结构变化，优先调整：

```text
src/sources/aliAuctionSource.js
```
