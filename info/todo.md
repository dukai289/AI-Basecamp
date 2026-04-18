# 网站基础建设
+ [x] nginx 配置
+ [x] Tagline
+ [x] OG Image
+ [x] robots.txt
+ [x] Sitemap
+ [x] Favicon
+ [x] SEO Meta
+ [x] 安全响应头
+ [x] 日志与网站统计: 使用 `logrotate` + `crontab` + `GoAccess` 定时生成网站报表，并用 `apache2-utils` 增加公网访问认证。

# CI/CD
  + [x] 每30分钟 git pull & build
    + 通过 crontab 执行 `D:\WorkSpace_dukai\AI-Basecamp\ops\cron\cron_ai-basecamp.sh`，每半小时 fetch 判断和执行一次

# 脱敏
+ [x] 有些笔记有敏感信息，如何脱敏: `docs-private/ -> docs/`  
  
# 资讯自动化 **高优先级**
  + [x] 确定信息源
  + [x] 模板
  + [x] 示例
  + [ ] 自动化：不紧急，现在可以使用 codex + content-ops\prompts\newsletter_gen.md 来完成
    + [ ] 采集：从固定来源抓标题、链接、摘要
    + [ ] 筛选：按主题、重要性、可信度打分
    + [ ] 生成：套用 newsletter 模板生成 blog/YYYY-MM-DD-ai-news.md
  
# 知识库内容补充
+ [ ] 知识体系 / LLM基础
  + [x] 占位
  + [ ] 内容生产
  + [ ] 内容整理
+ [ ] 知识体系 / 工程化知识
  + [x] 占位
  + [ ] 内容生产
  + [ ] 内容整理
+ [ ] 硬件
  + [x] 占位
  + [ ] 内容生产
  + [ ] 内容整理
