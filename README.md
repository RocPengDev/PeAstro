# 🚀 PeAstro
使用Astro框架，自动化部署到Cloudflare的静态博客项目，不需要本地部署，不需要额外购买服务器。

### 特色
- 使用GitHub Issues 作为博客内容编辑工具
- 将issues转换为博客内容
- 自动化内容同步和部署
- 针对Cloudflare部署优化
- 静态站点生成，实现最优性能

### 快速开始
- 注册登录Github账号
- 复刻本项目，也可直接点击链接 https://github.com/RocPengDev/PeAstro/fork
- 申请Github私人Tokens
  >   点击链接https://github.com/settings/personal-access-tokens/new
  >   身份验证后生成Tokens
  >   复制生成的Token
- 设置Actions Secrets
  >   进入该项目仓库，点击最右侧Settings-> Secrets and variables->Actions->点击New repository secret按钮
  >   在name栏输入PERSONAL_TOKEN，Secret里粘贴刚刚复制的Token
- 修改wrangler.json
  >   编辑wrangler.json，修改name对应的值，默认为peastro
  >   修改为你准备在Cloudflare Worders中使用的项目名称
- 在Cloudflare创建Workers
  >   进入Cloudflare账户主页 https://dash.cloudflare.com/
  >   左侧点击 计算(Workers)->Workers和Pages
  >   点击“创建”按钮，选择第二项“导入存储库”，需要登录授权
  >   选择PeAstro的项目仓库，项目名称填写刚刚在wrangler.json修改的，如果未修改，则项目名称为peastro
  >   构建命令填写 npm run build
  >   点击创建和部署，你的博客就构建完成了
- 在Github项目仓库中，新增Issue即为增加博客文章，会自动部署到Cloudflare
- 自建Issue标签about，此标签为“关于”页面专属



---
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Astro](https://img.shields.io/badge/Built%20with-Astro-ff5d01.svg)](https://astro.build/)

*如果你觉得这个项目有帮助，请给个Star ⭐！*