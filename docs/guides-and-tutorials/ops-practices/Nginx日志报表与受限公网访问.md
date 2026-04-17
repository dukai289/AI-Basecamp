---
title: Nginx 日志报表与受限公网访问
tags: [GoAccess, Nginx, 日志分析, 网站分析]
description: 使用 GoAccess 生成 Nginx 访问日志报表，并通过 Basic Auth 限制报表页面的公网访问。
last_update:
  date: 2026-04-15
---

# Nginx 日志报表与受限公网访问

:::important 工程目标
为使用 Nginx 托管的网站生成访问日志报表，并为公网可访问的报表页面增加基础访问认证。
:::

---

## 1. 前提

+ [x] 站点由 `Nginx` 托管
+ [x] `Nginx` 已配置 `access_log`
+ [x] 服务器可以安装 `GoAccess` 和 `apache2-utils`

---

## 2. 功能单元

+ `Nginx`: 负责记录访问日志并对外提供报表页面。
+ `GoAccess`: 用于解析 Web 服务访问日志，快速查看访问量、热门页面、来源、状态码和异常请求。
+ `apache2-utils`: 提供 `htpasswd` 等工具，用于为 Nginx 静态页面配置 Basic Auth。
+ `logrotate`: 负责按周期切割和压缩日志，避免单个日志文件过大。
+ `crontab`: 负责定时生成静态报表。

---

## 3. 推荐实践

使用 `logrotate` + `crontab` + `GoAccess` 定时生成静态报表，并用 Basic Auth 限制报表页面访问。

+ `logrotate`: 按天切割访问日志和错误日志，保留固定天数。
+ `crontab` + `GoAccess`: 定时读取当前和历史访问日志，生成 HTML 报表。
+ `apache2-utils`: 生成认证文件，避免报表页面直接暴露在公网。

### 3.1 安装依赖

```bash
sudo apt update
sudo apt install goaccess apache2-utils
```

### 3.2 `logrotate` 配置日志切割

先检查 `/etc/logrotate.d/nginx` 是否已经管理了目标日志文件。如果默认规则已经覆盖你的日志，不要再为同一批日志新增重复规则。

示例：为某个站点单独配置日志切割。

```bash
sudo vim /etc/logrotate.d/example-site
```

写入以下内容，并按实际日志文件名调整路径：

```conf
/var/log/nginx/example-site.access.log /var/log/nginx/example-site.error.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    dateext
    sharedscripts
    postrotate
        if [ -d /run/systemd/system ]; then
            systemctl kill -s USR1 nginx.service
        elif [ -s /run/nginx.pid ]; then
            kill -USR1 `cat /run/nginx.pid`
        fi
    endscript
}
```

可先用以下命令检查配置是否可解析：

```bash
sudo logrotate -d /etc/logrotate.d/example-site
```

### 3.3 `crontab` + `GoAccess` 配置定时报表

使用 `crontab` 定时调用 `GoAccess`，将 Nginx 访问日志转换为静态 HTML 报表。

```bash
sudo crontab -e
```

示例：每天 09:30 生成一次报表。

```bash
30 9 * * * zcat -f /var/log/nginx/example-site.access.log* | /usr/bin/goaccess - --log-format=COMBINED -o /var/www/example-site/admin/report_goaccess.html
```

路径说明：

+ `/var/log/nginx/example-site.access.log*`: 当前和历史访问日志。
+ `/var/www/example-site/admin/report_goaccess.html`: 报表输出文件，需要位于 Nginx 可访问的静态目录中。
+ `--log-format=COMBINED`: 适用于 Nginx 常见的 combined 日志格式。

### 3.4 `apache2-utils` 配置访问认证

使用 `apache2-utils` 生成 Basic Auth 密码文件：

```bash
sudo htpasswd -c /etc/nginx/.htpasswd-goaccess report_user
```

在对应的 Nginx `server` 配置中增加报表页面访问限制：

```nginx
location = /admin/report_goaccess.html {
    auth_basic "GoAccess Report";
    auth_basic_user_file /etc/nginx/.htpasswd-goaccess;

    try_files /admin/report_goaccess.html =404;
}
```

检查并重新加载 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 3.5 访问报表

通过站点域名访问报表页面：

```text
https://example.com/admin/report_goaccess.html
```

浏览器应弹出 Basic Auth 登录框。认证通过后即可查看报表。

---

## 4. GoAccess 知识

### 4.1 常用命令
查看终端报表：

```bash
sudo goaccess /var/log/nginx/example-site.access.log \
  --log-format=COMBINED
```

生成静态 HTML 报表：

```bash
sudo goaccess /var/log/nginx/example-site.access.log \
  --log-format=COMBINED \
  -o /var/www/example-site/admin/report_goaccess.html
```

生成实时 HTML 报表：

```bash
sudo goaccess /var/log/nginx/example-site.access.log \
  --log-format=COMBINED \
  -o /var/www/example-site/admin/report_goaccess.html \
  --real-time-html
```

实时模式需要额外配置 WebSocket 端口和 Nginx 反向代理。多数只需要定期查看访问趋势的场景，静态报表更简单、稳定。

---

### 4.2 面板说明

先区分几个最容易混淆的统计口径：

| 指标 | 含义 | 阅读方式 |
| --- | --- | --- |
| Hits | HTTP 请求总数。HTML、JS、CSS、图片、字体、favicon 等每个资源请求都会计入 | 更适合看服务器请求压力和资源加载量，不等于访问人数 |
| Visitors | 独立访客数。通常按 IP 统计唯一访问来源 | 更接近“多少个访问来源”，但会受代理、NAT、爬虫和真实 IP 配置影响 |
| Pages | 页面浏览量。通常指 HTML 页面请求，排除静态资源 | 更适合看内容被浏览的次数 |
| Files | 成功返回的文件请求数 | 更适合看静态文件传输和缓存效果 |

例如，一个用户打开一个页面，同时加载多个 JS、CSS 和图片，可能只产生 `1` 个 visitor、`1` 个 page，但会产生十几次 hits。

| 面板 | 主要内容 | 用途 |
| --- | --- | --- |
| Unique visitors | 独立访客数、访问时间分布 | 查看站点整体访问趋势 |
| Requested files | 被请求最多的页面和文件 | 判断哪些页面最受关注 |
| Static requests | JS、CSS、图片、字体等静态资源请求 | 排查静态资源加载和缓存情况 |
| Not found URLs | 404 请求路径 | 修复坏链、旧链接和异常扫描路径 |
| Visitor hostnames and IPs | 访问来源 IP 或 Host | 粗略识别访客、爬虫和异常访问 |
| Operating systems | 访客操作系统 | 了解访问设备环境 |
| Browsers | 浏览器类型和版本 | 判断兼容性重点 |
| Time distribution | 按小时统计访问量 | 查看访问高峰时段 |
| Referring sites | 外部来源站点 | 查看用户从哪里进入站点 |
| Referring URLs | 具体来源 URL | 分析外链、社交平台和搜索入口 |
| Keyphrases | 搜索关键词 | 了解搜索意图，取决于来源是否提供关键词 |
| Geo location | 国家或地区来源 | 观察访问地域分布，需要 GeoIP 支持 |
| HTTP status codes | 200、301、404、500 等状态码 | 快速发现错误、重定向和服务异常 |
| Remote user | HTTP 认证用户名 | 启用 Basic Auth 后可查看认证用户 |
| User agents | 浏览器、爬虫、脚本客户端 | 识别搜索引擎、AI 爬虫和异常请求 |
| MIME types | 返回内容类型 | 查看 HTML、图片、脚本等资源分布 |
| TLS type | TLS 协议版本 | 分析 HTTPS 连接情况，需要日志格式记录 TLS 字段 |

说明：

+ `Geo location` 需要 GeoIP 数据库支持。
+ `TLS type` 不包含在标准 combined 日志中，需要在 Nginx 日志格式里额外记录 TLS 字段。
+ `Keyphrases` 可能为空，因为搜索引擎通常不再把完整关键词放在 referrer 中。

---

## 5. 安全建议

+ 报表页面不要裸露在公网，至少应启用 Basic Auth。
+ 密码文件应放在 Web 根目录之外，例如 `/etc/nginx/.htpasswd-goaccess`。
+ 不要把真实域名、用户名、服务器目录、内网地址或业务标识写入公开文档。
+ 报表文件只保留必要访问权限，避免被非预期用户修改。
+ 如果报表包含敏感 URL、查询参数或来源信息，应评估是否需要进一步脱敏或仅在内网发布。
