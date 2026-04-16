# Ops

这里记录 AI-Basecamp 的部署、自动构建、Nginx 配置和访问统计维护方式。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `ops/cron/cron_ai-basecamp.sh` | 定时拉取代码、构建站点、生成 GoAccess 访问报表 |
| `ops/cron/crontab.template` | cron 配置模板 |
| `ops/nginx/ai-basecamp.sparkhub.space.conf` | 线上 Nginx 配置 |
| `ops/nginx/ai-basecamp.local.conf` | 本地或测试 Nginx 配置 |

## 自动部署流程

线上 cron 每 30 分钟执行一次：

```bash
/home/dukai/WorkSpace/ai-basecamp/ops/cron/cron_ai-basecamp.sh
```

脚本流程：

1. 进入项目目录 `/home/dukai/WorkSpace/ai-basecamp`。
2. 执行 `git fetch --quiet origin`。
3. 比较本地 `HEAD` 和远端跟踪分支。
4. 如果没有新 commit，跳过 `git pull` 和 `npm run build`。
5. 如果有新 commit，执行 `git pull --ff-only`，然后执行 `npm run build`。
6. 无论代码是否更新，都重新生成 GoAccess 访问报表。

脚本使用 `git pull --ff-only`，避免服务器工作区和远端分叉时自动产生 merge commit。遇到分叉或本地脏文件时，脚本会失败并写入日志。

## GoAccess 报表

访问统计由 GoAccess 生成：

| 项目 | 路径 |
| --- | --- |
| Nginx access log | `/var/log/nginx/ai-basecamp.access.log*` |
| 报表输出 | `/home/dukai/WorkSpace/ai-basecamp/build/admin/report_goaccess.html` |
| 站点访问路径 | `/admin/report_goaccess.html` |
| 运行日志 | `/tmp/ai-basecamp-cron.log` |

报表生成顺序是：

1. Docusaurus 构建完成后，确保 `build/admin/` 存在。
2. 使用 `zcat -f` 读取当前和轮转后的 Nginx access log。
3. GoAccess 先写入临时文件 `build/admin/report_goaccess.tmp.html`。
4. 生成成功后再替换正式文件 `build/admin/report_goaccess.html`。

报表必须在构建之后生成，因为 `npm run build` 会重写整个 `build/` 目录。

线上 Nginx 对 `/admin/report_goaccess.html` 启用了 Basic Auth：

```nginx
auth_basic "GoAccess Report";
auth_basic_user_file /etc/nginx/.htpasswd-goaccess;
```

## Nginx

线上站点配置：

- 域名：`ai-basecamp.sparkhub.space`
- 站点根目录：`/home/dukai/WorkSpace/ai-basecamp/build`
- access log：`/var/log/nginx/ai-basecamp.access.log`
- error log：`/var/log/nginx/ai-basecamp.error.log`
- HTTPS 证书路径：`/etc/letsencrypt/live/ai-basecamp.sparkhub.space/`

配置包含几类保护：

- HTTP 自动跳转 HTTPS。
- 拦截 `.git`、`.env`、`.aws`、`phpmyadmin`、`server-status` 等常见探测路径。
- 拦截 `.php`、`.bak`、`.old`、`.sql`、`.env` 等敏感扩展。
- 静态资源启用长期缓存。
- GoAccess 报表单独启用 Basic Auth。

## 手动部署

服务器上可手动执行：

```bash
cd /home/dukai/WorkSpace/ai-basecamp
git pull --ff-only
npm install
npm run build
```

如需手动刷新访问统计，执行：

```bash
/home/dukai/WorkSpace/ai-basecamp/ops/cron/cron_ai-basecamp.sh
```

## 常用排查

查看 cron 日志：

```bash
tail -f /tmp/ai-basecamp-cron.log
```

查看 cron 配置：

```bash
crontab -l
```

检查 Nginx 配置：

```bash
nginx -t
```

重载 Nginx：

```bash
systemctl reload nginx
```

查看线上日志：

```bash
tail -f /var/log/nginx/ai-basecamp.access.log
tail -f /var/log/nginx/ai-basecamp.error.log
```

## 注意事项

- 服务器工作区不要直接改文件，避免 `git pull --ff-only` 失败。
- `build/` 是 Docusaurus 生成物，不要手动维护。
- GoAccess 报表位于 `build/admin/`，构建后必须重新生成。
- Nginx 配置变更后先执行 `nginx -t`，再 reload。
- 不要把真实密码、token、`.htpasswd` 内容或服务器私有日志提交到仓库。
