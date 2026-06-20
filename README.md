# 司法拍卖信息自动抓取

本项目用于定期抓取上海市浦东新区住宅司法拍卖公开信息，生成 Markdown 日报，并保存 JSON/CSV 历史数据。

第一阶段只抓公开信息，不登录账号，不报名，不缴纳保证金，不出价，不绕过验证码。

## 常用命令

```bash
npm install
npm run fetch:test
npm run fetch
npm test
```

## 运行方式

- Mac 本地先开发和测试。
- Linux 正式部署后使用 cron 每天 11:00 和 23:00 运行。
- 第一阶段使用 `config/rules.json` 调整规则，不做图形界面。

## 输出目录

```text
data/      JSON 和 CSV 数据
outputs/   Markdown 日报
logs/      运行日志
```
