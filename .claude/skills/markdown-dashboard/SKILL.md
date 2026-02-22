---
name: markdown-dashboard
description: "複数のMarkdownファイルを美しく安全な単一HTMLダッシュボードに変換する"
---

## 目的

セキュリティレポート、技術ドキュメント、プロジェクトマニュアルなど、マークダウンファイル群をプロフェッショナルなWebダッシュボードとして統合し、検索・ナビゲーション・フィルタリング機能付きで提供する。

## 使用方法

### 単一リポジトリ

```bash
/markdown-dashboard <target_directory>

# 例
/markdown-dashboard docs/security_review
```

### 複数リポジトリ統合（タブ型ナビゲーション）

```bash
/markdown-dashboard <dir1> <dir2> [<dir3> ...]

# 例
/markdown-dashboard \
  ms/docs/security_review \
  knowledge/docs/security_review \
  shosha/docs/security_review
```

**リポジトリ名の自動判別**: パスから2階層上のディレクトリ名を使用

- 例: `ms/docs/security_review` → リポジトリ名: `ms`
- 例: `knowledge/reports/security` → リポジトリ名: `knowledge`

## 出力

- **単一リポジトリ**: `<target_directory>/index.html`
- **複数リポジトリ**: 最初の引数ディレクトリに `index.html`（例: `dir1/index.html`）

完全に自己完結した単一HTMLファイル

### 実装された機能

- ✅ 複数リポジトリ統合（タブ型ナビゲーション）
- ✅ 統計ダッシュボード（vulnerabilities.jsonから生成、リポジトリ別集計）
- ✅ 脆弱性一覧テーブル（フィルタリング・ソート）
- ✅ サイドバーナビゲーション（階層的、リポジトリ別フィルタ）
- ✅ ダークモード切替（LocalStorage保存）
- ✅ VULN-IDクロスリファレンス（自動リンク化）
- ✅ メタデータテーブル自動生成（YAMLフロントマターから）
- ✅ CVSSバッジ（色分け）
- ✅ マークダウン表の自動HTML変換
- ✅ 番号付き・箇条書きリストのサポート
- ✅ シンタックスハイライト（PHP, JavaScript, Python, SQL, Bash等）
- ✅ スムーズスクロール
- ✅ レスポンシブ（モバイル対応）
- ✅ XSS対策（完全サニタイズ）
- ✅ 外部依存ゼロ（オフライン動作）

### デザイン

- ビジネスプロフェッショナル（青系基調 `#2563eb`）
- WCAG AA準拠
- レスポンシブ（モバイル対応）

## Claude（エージェント）への実装手順

### 実装方法

以下のコマンドを**1回実行するだけ**：

**単一リポジトリ**：

```bash
python3 .claude/skills/markdown-dashboard/scripts/generate_dashboard.py <target_directory> > <target_directory>/index.html
```

**複数リポジトリ統合**：

```bash
python3 .claude/skills/markdown-dashboard/scripts/generate_dashboard.py <dir1> <dir2> <dir3> > <dir1>/index.html

# 具体例
python3 .claude/skills/markdown-dashboard/scripts/generate_dashboard.py \
  ms/docs/security_review \
  knowledge/docs/security_review \
  shosha/docs/security_review \
  > ms/docs/security_review/index.html
```

**これで完了**。

### 内部動作

1. [scripts/generate_dashboard.py](scripts/generate_dashboard.py) が：
   - 全ディレクトリから全.mdファイルを読み込み
   - 各ファイルにリポジトリ情報を付与（パスから2階層上のディレクトリ名）
   - 各ディレクトリの vulnerabilities.json を読み込み、統合
   - 統計情報を集計（全体 + リポジトリ別）
   - データをJSON化（ensure_ascii=False で自然な形式）
   - JSON を `<script type="application/json">` タグ内に埋め込み（HTMLパーサーとの混乱を回避）
   - [templates/dashboard_template.html](templates/dashboard_template.html) にデータを埋め込み
   - テンプレートの破損を自動検出・修正
   - 完成したHTMLを標準出力

2. 出力を `> <first_directory>/index.html` にリダイレクト

3. ブラウザ上で：
   - 複数リポジトリの場合、ヘッダーにタブが表示される
   - タブクリックでリポジトリを切り替え（統計、サイドバー、脆弱性一覧がフィルタされる）
   - 単一リポジトリの場合、タブは表示されない

### 技術的な改善点（2026-01-24）

**v1（初版）**:

- **JSON 埋め込み方式の変更**: 直接 JavaScript コード内に埋め込む方式から、`<script type="application/json">` タグに埋め込む方式に変更。これにより、HTML パーサーと JavaScript パーサーの間のエスケープ問題を完全に回避
- **自動修復機能**: テンプレートファイルが破損した場合、自動的に検出して修正する機能を追加
- **エスケープ処理の改善**: `</script>` タグのエスケープのみに簡素化（`<\/script>` に変換）

**v2（複数リポジトリ対応）**:

- **複数ディレクトリ対応**: `generate_dashboard.py` が複数引数を受け付け、自動的にマージ
- **リポジトリ自動判別**: パスから2階層上のディレクトリ名を自動抽出
- **タブ型UI**: 複数リポジトリ時のみヘッダーにタブを表示、クリックで切り替え
- **動的フィルタリング**: 統計、サイドバー、脆弱性一覧がリポジトリ別に動的フィルタされる
- **マークダウン表変換**: パイプ区切り表を完全なHTMLテーブルに変換
- **シンタックスハイライト**: highlight.js（約40KB）を埋め込み、PHP/JS/Python/SQL等に対応

## ファイル構造

```
.claude/skills/markdown-dashboard/
├── SKILL.md                           # このファイル（簡潔な説明）
├── scripts/
│   └── generate_dashboard.py          # データ準備スクリプト
└── templates/
    └── dashboard_template.html        # 完全なHTMLテンプレート
```

## セキュリティ対策

- `<script>` タグを `&lt;script&gt;` にエスケープ
- `javascript:` プロトコルを無効化
- すべてのHTML要素を適切にサニタイズ
- CSP準拠

## 制約

- ファイルサイズ: 500KB以下推奨
- ブラウザ: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- アクセシビリティ: WCAG AA準拠
