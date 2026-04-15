# 日志与网站统计
+ [x] 实践: 使用 `logrotate` + `crontab` + `GoAccess` 每30分钟生成一次报表，并用 `apache2-utils` 增加公网访问认证。
  + `5,35 * * * * zcat -f /var/log/nginx/ai-basecamp.access.log* | /usr/bin/goaccess - --log-format=COMBINED -o build/admin/report_goaccess.html`

# CI/CD
  + [x] 每30分钟 git pull & build
    + `0,30 * * * * cd /home/dukai/WorkSpace/ai-basecamp && /usr/bin/git pull && /usr/bin/npm run build >> /tmp/ai-basecamp-build.log 2>&1`

# 资讯自动化
  + [x] 确定信息源
  + [x] 模板
  + [x] 示例
  + [ ] 自动化：资讯采集、汇总、生成
  
# 知识库内容补充
+ [x] vllm
+ [ ] CoPaw
+ [ ] 模型部署
+ [x] GPU/加速卡
+ [ ] ...

# 脱敏
+ [ ] 有些笔记有敏感信息，如何脱敏
