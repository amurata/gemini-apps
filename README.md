# Gemini Apps

Gemini生成アプリのポートフォリオ。各アプリは独立したPWAとしてサブドメインにデプロイされます。

## 構造

```
gemini-apps/
├── src/                         # ポートフォリオTOP（arkatom.com）
├── apps/
│   ├── tabata-hiit-bike/        # Tabata HIIT Bike PWA
│   └── media-viewer/            # Media Viewer PWA
├── package.json                 # ポートフォリオ用
├── vite.config.ts
└── wrangler.toml
```

## 開発

### ポートフォリオTOP

```bash
npm install
npm run dev
```

### 個別アプリ

```bash
cd apps/tabata-hiit-bike  # or apps/media-viewer
npm install
npm run dev
```

## デプロイ（Cloudflare Pages）

| サイト | ビルドルート | ビルドコマンド | 出力 |
| --- | --- | --- | --- |
| ポートフォリオ | `/` | `npm run build` | `dist` |
| Tabata HIIT Bike | `apps/tabata-hiit-bike` | `npm run build` | `dist` |
| Media Viewer | `apps/media-viewer` | `npm run build` | `dist` |
