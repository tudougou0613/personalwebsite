# personalwebsite

韦雨佳 / PotatoDog 的个人网站，包含主页、学术与生活档案、作品集。

使用 HTML、CSS 和 JavaScript 构建，无需安装依赖或构建。支持中英文切换、作品展开，以及跨站内页面连续播放音乐。

## 本地预览

```bash
python3 -m http.server 5173
```

打开 http://127.0.0.1:5173/ 。语言切换和页面导航需要通过 HTTP 服务访问。

## 文件

- `index.html`：主页
- `about.html`、`academic.html`、`personal.html`：关于与个人档案
- `works.html`、`locked-room.html`、`portfolio.html`：作品和详情
- `styles.css`、`script.js`：样式与交互
- `translations.json`：英文译文
- `assets/`：图片、音乐和其他公开资源

部署时上传以上文件，保留目录结构即可。
