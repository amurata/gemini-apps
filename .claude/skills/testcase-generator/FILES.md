# testcase-generator Skill - ファイル一覧

**作成日**: 2026年1月10日
**総ファイル数**: 14ファイル

## 構造

```
.claude/skills/testcase-generator/
├── SKILL.md (532行) - Skill定義
├── README.md (244行) - 使用方法
├── FILES.md - このファイル
├── scripts/ (5ファイル)
│   ├── extract_routes.sh (実行可) - エンドポイント抽出
│   ├── extract_validations.sh (実行可) - バリデーション抽出
│   ├── calculate_risk.py (実行可) - リスクスコア計算
│   ├── generate_csv.py (実行可) - CSV生成
│   └── count_coverage.sh (実行可) - カバレッジ検証
├── assets/ (3ファイル)
│   ├── testcase.md.template - Markdownテンプレート
│   ├── testcase.csv.template - CSVテンプレート
│   └── testcase.json.template - JSONテンプレート
└── references/ (4ファイル)
    ├── testcase-best-practices.md - ベストプラクティス
    ├── gherkin-guide.md - Gherkin形式ガイド
    ├── risk-assessment-matrix.md - リスク評価マトリックス
    └── qa-terminology.md - QA用語集
```

## 実装完了チェックリスト

### 必須ファイル

- [x] SKILL.md - YAML frontmatter + 指示
- [x] README.md - 使用方法

### スクリプト

- [x] extract_routes.sh - エンドポイント抽出
- [x] extract_validations.sh - バリデーション抽出
- [x] calculate_risk.py - リスクスコア計算
- [x] generate_csv.py - CSV生成
- [x] count_coverage.sh - カバレッジ検証

### テンプレート

- [x] testcase.md.template - Markdown形式
- [x] testcase.csv.template - CSV形式
- [x] testcase.json.template - JSON形式

### 参照ドキュメント

- [x] testcase-best-practices.md - ベストプラクティス
- [x] gherkin-guide.md - Gherkin形式ガイド
- [x] risk-assessment-matrix.md - リスク評価マトリックス
- [x] qa-terminology.md - QA用語集

## 品質確認

### YAML frontmatter

- [x] 200文字以内（実際: 約150文字）
- [x] 改行なし
- [x] allowed-toolsは一行で記述

### 汎用性

- [x] プロジェクト固有情報のハードコードなし
- [x] 完全に動的な設計
- [x] どのプロジェクトでも使用可能

### オプション

- [x] --no-verify オプション実装
- [x] --format オプション実装
- [x] --priority オプション実装
- [x] --dry-run オプション実装
- [x] -v, --verbose オプション実装

### 段階的アプローチ

- [x] UNDERSTAND フェーズ実装
- [x] EXTRACT フェーズ実装
- [x] REVIEW フェーズ実装
- [x] GENERATE フェーズ実装

## 使用方法

```bash
# 基本的な使い方
/testcase-generator "問い合わせフォーム"

# ユーザー承認をスキップ
/testcase-generator "すべて" --no-verify

# 特定の形式のみ
/testcase-generator "ログイン" --format=md
```

## 次のステップ

実際にSkillを実行して動作を確認：

```bash
/testcase-generator "問い合わせフォーム" --dry-run
```
