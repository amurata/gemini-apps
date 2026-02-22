# testcase-generator Skill

QC/QA向けの高品質なE2Eテストケースを自動生成するClaude Code Skillです。

## 概要

このSkillは、`docs/specs/` とコードベースから網羅的にテストケースを生成します。

- **出力形式**: Markdown、CSV、JSON（3形式）
- **対象**: E2E手動テスト
- **網羅基準**: 全エンドポイント、全バリデーションルール、全UIパーツ、全ビジネスロジック
- **優先順位**: リスクベース（ビジネス影響度 × ユーザー可視性 × 技術複雑性）

## 使用方法

### 基本的な使い方

```bash
# 特定の機能のテストケースを生成
/testcase-generator "問い合わせフォーム"

# 全機能のテストケースを生成
/testcase-generator "すべて"

# 引数なしで実行（対話的）
/testcase-generator
```

### オプション

```bash
# ユーザー承認をスキップ（自動生成）
/testcase-generator "すべて" --no-verify

# 特定の形式のみ出力
/testcase-generator "ログイン" --format=md
/testcase-generator "ログイン" --format=csv
/testcase-generator "ログイン" --format=json

# 優先度フィルタ
/testcase-generator "すべて" --priority=critical

# 概要のみ表示（生成しない）
/testcase-generator "すべて" --dry-run

# 詳細ログ
/testcase-generator "すべて" -v
```

## 前提条件

1. **docs/specs/ が存在すること**

   ```bash
   # /mkdocs でドキュメントを生成
   /mkdocs
   ```

2. **最低限必要なドキュメント**:
   - `docs/specs/routes/overview.md` （エンドポイント一覧）
   - `docs/specs/app/requests/*.md` （バリデーションルール）
   - `docs/specs/resources/views/*.md` （画面構造）

## 4フェーズワークフロー

```
UNDERSTAND → EXTRACT → REVIEW → GENERATE
    ↓          ↓         ↓         ↓
  対象理解    観点抽出   優先順位   TC生成
```

### Phase 1: UNDERSTAND（対象理解）

- ユーザー指定の対象を理解
- docs/specs/ から該当ドキュメントを検索
- エンドポイント、画面、機能を特定
- **ユーザー承認**: 理解が正しいか確認（`--no-verify` でスキップ可）

### Phase 2: EXTRACT（テスト観点抽出）

- エンドポイント、バリデーション、UIパーツ、ビジネスロジックを抽出
- 正常系、異常系、境界値、セキュリティに分類
- **ユーザー承認**: 観点の追加・削除（`--no-verify` でスキップ可）

### Phase 3: REVIEW（リスク評価）

- 各観点にリスクスコアを付与
- 優先度ラベル（Critical/High/Medium/Low）を自動付与
- 優先順位でソート
- **ユーザー承認**: 優先順位の調整（`--no-verify` でスキップ可）

### Phase 4: GENERATE（テストケース生成）

- 3形式で出力（Markdown、CSV、JSON）
- 目次とサマリーレポートを生成
- カバレッジレポートを生成

## 出力構造

```
tests/qa/
├── testcases/           # Markdownテストケース
│   ├── <機能名>/
│   │   ├── TC_<機能>_001.md
│   │   ├── TC_<機能>_002.md
│   │   └── ...
│   └── index.md        # 目次
├── exports/             # CSV/JSON出力
│   ├── YYYYMMDD_HHMMSS_testcases.csv
│   └── YYYYMMDD_HHMMSS_testcases.json
├── reports/             # サマリーレポート
│   └── YYYYMMDD_HHMMSS_generation_report.md
└── _context/            # 実行コンテキスト（内部用）
    ├── understand.json
    ├── extract.json
    └── review.json
```

## 出力形式

### Markdown形式

- Gherkin形式を含む詳細なテストケース
- GitHub/GitLabで見やすい
- ファイル名: `TC_<機能>_<番号>.md`

### CSV形式

- QAツールにインポート可能
- Excelで開いて編集可能
- ファイル名: `YYYYMMDD_HHMMSS_testcases.csv`

### JSON形式

- 自動化ツールと連携可能
- プログラマブル
- ファイル名: `YYYYMMDD_HHMMSS_testcases.json`

## スクリプト

Skillには以下のスクリプトが含まれます：

| スクリプト | 説明 |
|----------|------|
| `scripts/extract_routes.sh` | docs/specs/routes/ からエンドポイントを抽出 |
| `scripts/extract_validations.sh` | docs/specs/app/requests/ からバリデーションルールを抽出 |
| `scripts/calculate_risk.py` | リスクスコアを計算し、優先度を付与 |
| `scripts/generate_csv.py` | JSON → CSV 変換 |
| `scripts/count_coverage.sh` | カバレッジレポート生成 |

## リスク評価基準

### ビジネス影響度（1-5）

| スコア | 説明 |
|-------|------|
| 5 | サービス停止、金銭的損失、法的問題 |
| 4 | 主要機能の停止、顧客満足度の大幅低下 |
| 3 | 一部機能の停止、ユーザー体験の低下 |
| 2 | 軽微な不便、回避策が存在 |
| 1 | ほぼ影響なし |

### ユーザー可視性（1-3）

| スコア | 説明 |
|-------|------|
| 3 | すべてのユーザーに影響 |
| 2 | 一部のユーザーに影響 |
| 1 | 内部処理、管理者のみ |

### 技術複雑性（1-3）

| スコア | 説明 |
|-------|------|
| 3 | 複数システム連携、外部API依存 |
| 2 | 複数コンポーネント連携 |
| 1 | 単一コンポーネント |

## 完全汎用化

このSkillは **プロジェクト固有情報をハードコードしていません**。

以下のプロジェクトで使用可能：
- Laravel（PHP）
- Rails（Ruby）
- Django（Python）
- Express（Node.js）
- Spring Boot（Java）
- その他（docs/specs/ があれば適用可能）

**条件**:
- `/mkdocs` でドキュメントが生成済み
- `docs/specs/` ディレクトリが存在

## トラブルシューティング

| 問題 | 解決方法 |
|------|---------|
| `docs/specs/ が見つかりません` | `/mkdocs` を実行してドキュメントを生成 |
| エンドポイントが抽出できない | `docs/specs/routes/overview.md` の存在と形式を確認 |
| バリデーションルールが抽出できない | `docs/specs/app/requests/` の存在を確認 |
| リスクスコアが不適切 | `scripts/calculate_risk.py` のヒューリスティックを調整 |

## カスタマイズ

### リスク評価ロジックの調整

`scripts/calculate_risk.py` の `estimate_risk_factors()` 関数を編集：

```python
def estimate_risk_factors(test_perspective):
    # プロジェクト固有のキーワードを追加
    if 'payment' in description or '決済' in description:
        business_impact = 5
    # ...
```

### テンプレートのカスタマイズ

`assets/*.template` を編集してテストケースの形式を調整できます。

## ライセンス

MIT License

## 参考文献

- [LIFULL: AIエージェントによるテストケース自動生成](https://www.lifull.blog/entry/2025/12/20/120000)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [Test Case Template Best Practices 2026](https://testgrid.io/blog/test-case-template/)
