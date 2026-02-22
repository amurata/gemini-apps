#!/usr/bin/env python3
"""
mkdocs タスクファイル存在確認Hook

PreToolUse時に実行され、Skill実行前に対応するタスクファイルが存在するか確認。
存在しない場合はexit 2でブロック。
"""

import json
import os
import sys
from pathlib import Path


def main():
    # stdin から JSON を読み込む
    try:
        hook_input = json.load(sys.stdin)
    except json.JSONDecodeError:
        # JSON読み込みエラーは無視（他のツールの場合）
        sys.exit(0)

    # Skill実行の場合のみチェック
    if hook_input.get("tool") != "Skill":
        sys.exit(0)

    # パラメータから skill 名を取得
    parameters = hook_input.get("parameters", {})
    skill_name = parameters.get("skill", "")

    # mkdocs-* Skillの場合のみチェック
    if not skill_name.startswith("mkdocs-"):
        sys.exit(0)

    # Skill名からステップ番号を抽出
    step_mapping = {
        "mkdocs-detect": "01-detect",
        "mkdocs-create": "02-create",
        "mkdocs-verify": "03-verify",
        "mkdocs-optimize": "04-optimize",
        "mkdocs-complete": "05-complete",
    }

    step_file = step_mapping.get(skill_name)
    if not step_file:
        # 未知のSkillは許可
        sys.exit(0)

    # プロジェクトディレクトリを取得
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    task_file_path = Path(project_dir) / "docs" / "specs" / "_tasks" / "mkdocs" / f"{step_file}.md"

    # タスクファイル存在確認
    if not task_file_path.exists():
        error_message = f"""
❌ タスクファイルが見つかりません: {task_file_path}

考えられる原因:
1. 前のステップが完了していない
2. /mkdocs コマンドを実行していない
3. タスクファイルが手動で削除された

解決方法:
- 初回実行の場合: /mkdocs コマンドを実行してください
- 途中のステップの場合: 前のステップを完了させてください
"""
        print(error_message, file=sys.stderr)
        sys.exit(2)  # ブロック

    # タスクファイルが存在する場合は許可
    sys.exit(0)


if __name__ == "__main__":
    main()
