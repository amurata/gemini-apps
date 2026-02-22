# セキュリティレビュー Skills

## 概要

セキュリティレビューとHTML化を効率化する2つの再利用可能なスキル。

## Skills

### 1. security-audit

コードベースの脆弱性を徹底調査し、実用的なセキュリティレポートを生成。

**用途**:

- 既存システムのセキュリティレビュー
- 新規開発前のリスク評価
- 定期的なセキュリティ監査

**出力**: `docs/security_review/*.md`

---

### 2. markdown-dashboard

Markdownファイルを美しく安全なHTMLダッシュボードに変換。

**用途**:

- セキュリティレポートの可視化
- 技術ドキュメントのWeb化
- プロジェクトマニュアルの統合

**出力**: `index.html`（単一ファイル）

---

## 使い方

### パターンA: 順次実行

```bash
# 1. セキュリティレビュー実施
Claudeに依頼: 「security-audit スキルを使って、このコードベースのセキュリティレビューを実施してください」

# 2. HTML化
Claudeに依頼: 「markdown-dashboard スキルを使って、docs/security_review/ をHTML化してください」
```

### パターンB: 一括実行

```bash
Claudeに依頼: 「security-audit と markdown-dashboard スキルを使って、セキュリティレビューとHTML化を実施してください」
```

### パターンC: HTML化のみ

```bash
# 既存のMarkdownファイルがある場合
Claudeに依頼: 「markdown-dashboard スキルを使って、docs/ 配下のMarkdownをHTML化してください」
```

---

## 複数プロジェクト統合

```bash
Claudeに依頼: 「markdown-dashboard スキルを使って、以下の3つのプロジェクトのセキュリティレポートを統合したHTMLダッシュボードを作成してください：
- project_a/docs/security_review/
- project_b/docs/security_review/
- project_c/docs/security_review/
」
```

---

## カスタマイズ

各スキルは汎用的に設計されているため、以下のカスタマイズが可能：

### security-audit

- レポートファイル名の変更
- 調査対象の追加・除外
- リスクレベルの基準調整

### markdown-dashboard

- カラーテーマのカスタマイズ
- アイコンの変更
- サイドバーの配置変更

---

## ファイル構成

```
.claude/
└── skills/
    ├── README.md                 (このファイル)
    ├── security-audit.md         (セキュリティ監査スキル)
    └── markdown-dashboard.md     (HTML化スキル)
```

---

## 今後の拡張

- [ ] 自動実行コマンドの作成
- [ ] GitHub Actions統合
- [ ] Slack通知機能
- [ ] PDF出力対応

---

**作成日**: 2026年1月14日
**バージョン**: 1.0
