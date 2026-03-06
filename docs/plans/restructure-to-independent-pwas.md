# リポジトリ構造リファクタリング計画

## 目的

- 各アプリを独立PWA（独自サブドメイン）として運用できるようにする
- ディレクトリ命名の冗長性（`gemini-apps/apps/gemini-apps`）を解消する
- ポートフォリオTOPをリポジトリルート直下に配置しフラット化する

## 現状の構造

```
gemini-apps/
├── apps/
│   ├── gemini-apps/          # ポートフォリオ + tabata-hiit-bike（Cloudflare Pages デプロイ済み）
│   │   ├── src/
│   │   │   ├── apps/tabata-hiit-bike/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── content/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── wrangler.toml
│   └── MediaViewer/          # 独立Viteプロジェクト（未デプロイ）
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
└── docs/
```

## 目標の構造

```
gemini-apps/
├── src/                      # ポートフォリオTOP（arkatom.com にデプロイ）
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── components/
│   ├── content/
│   │   └── apps.ts
│   └── types/
│       └── app.ts
├── apps/
│   ├── tabata-hiit-bike/     # 独立PWA（tabata.arkatom.com 等）
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── wrangler.toml
│   │   └── tailwind.config.js
│   └── media-viewer/         # 独立PWA（media-viewer.arkatom.com 等）
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       ├── wrangler.toml
│       └── tailwind.config.js
├── public/
│   ├── _redirects
│   └── icons/
├── index.html
├── package.json
├── vite.config.ts
├── wrangler.toml
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
└── docs/
    └── plans/
```

## 作業手順

### Phase 1: ポートフォリオTOPをルート直下に移動

1. `apps/gemini-apps/` から以下をルート直下に移動:
   - `src/` (pages, components, content, types)
   - 設定ファイル群 (vite.config.ts, tsconfig.\*, tailwind.config.js, postcss.config.js, eslint.config.js)
   - `index.html`
   - `package.json` (内容はマージ)
   - `public/` (icons, \_redirects)
   - `wrangler.toml`
2. `src/apps/tabata-hiit-bike/` は Phase 2 で移動するため一旦除外
3. `AppDetailPage.tsx` を削除、ルーティングを簡素化

### Phase 2: tabata-hiit-bike を独立プロジェクトに切り出し

1. `apps/tabata-hiit-bike/` ディレクトリを作成
2. `TabataHiitBikeApp.tsx` を `apps/tabata-hiit-bike/src/App.tsx` として移動
3. `main.tsx`, `index.html`, `index.css` を新規作成
4. `package.json` を作成（依存: react, lucide-react, vite, tailwind, vite-plugin-pwa）
5. `vite.config.ts` を作成（PWAマニフェスト: tabata-hiit-bike 専用）
6. `wrangler.toml` を作成
7. 各設定ファイル (tsconfig, tailwind, postcss) を作成

### Phase 3: MediaViewer をリネーム・整理

1. `apps/MediaViewer/` を `apps/media-viewer/` にリネーム
2. `wrangler.toml` を追加
3. 不要ファイル (dist/, docs/) を削除

### Phase 4: ポートフォリオTOPを外部リンク方式に変更

1. `apps.ts` の型に `url` フィールドを追加、`pwaPrimary` を削除
2. `HomePage.tsx` のカードリンクを外部URL（サブドメイン）に変更
3. `App.tsx` のルーティングから `/apps/:slug` を削除
4. `AppDetailPage.tsx` を削除
5. `PwaInstallButton.tsx` を削除（各アプリ側で独自に持つため）
6. ポートフォリオ用 `vite.config.ts` の PWA 設定を調整

### Phase 5: 整理

1. `apps/gemini-apps/` ディレクトリを削除
2. 重複 `docs/` ディレクトリを削除
3. CLAUDE.md に docs ディレクトリ規約を追加
4. README.md を更新

## 設計判断

### PWAマニフェスト戦略
- 各アプリは独自サブドメインにデプロイ → 独立したPWAマニフェストを持てる
- ポートフォリオTOPはPWAとしてインストールする必要なし（マニフェスト削除 or 最小限）

### ポートフォリオからの遷移
- 各アプリカードは外部リンク（`<a href>` / `window.location`）
- react-router-dom の Link ではなく通常のアンカータグを使用

### Cloudflare Pages
- ポートフォリオ: 既存プロジェクトのビルドルートをルートに変更
- tabata-hiit-bike: 新規 Pages プロジェクト作成が必要
- media-viewer: 新規 Pages プロジェクト作成が必要
