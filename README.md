# Gemini Apps Portfolio

Gemini生成アプリを並べるポートフォリオ基盤です。現在は `Tabata HIIT Bike` を収録しています。

## Development

```bash
npm install
npm run dev
```

## Routes

- `/` : ポートフォリオTOP
- `/apps/tabata-hiit-bike` : Tabata HIIT Bike

## Build

```bash
npm run build
npm run preview
```

## Cloudflare Pages

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

`public/_redirects` で SPA fallback を設定しています。
