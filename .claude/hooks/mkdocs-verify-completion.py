#!/usr/bin/env python3
"""
mkdocs タスクファイル削除確認Hook

SubagentStop時に実行され、Skill完了後に対応するタスクファイルが削除されたか確認。
削除されていない場合は警告メッセージを表示。
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
        # JSON読み込みエラーは無視
        sys.exit(0)

    # agentType を取得
    agent_type = hook_input.get("agentType", "")

    # mkdocs-* Skillの場合のみチェック
    if not agent_type.startswith("mkdocs-"):
        sys.exit(0)

    # Skill名からステップ番号を抽出
    step_mapping = {
        "mkdocs-detect": "01-detect",
        "mkdocs-create": "02-create",
        "mkdocs-verify": "03-verify",
        "mkdocs-optimize": "04-optimize",
        "mkdocs-complete": "05-complete",
    }

    step_file = step_mapping.get(agent_type)
    if not step_file:
        # 未知のSkillは無視
        sys.exit(0)

    # プロジェクトディレクトリを取得
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    task_file_path = Path(project_dir) / "docs" / "specs" / "_tasks" / "mkdocs" / f"{step_file}.md"

    # タスクファイルがまだ存在する場合は警告
    if task_file_path.exists():
        warning_message = f"""
⚠️  タスクファイルがまだ存在します: {task_file_path}

このステップを完了するには、以下を実行してください:

  rm {task_file_path}

または、Bashツールで:
  Bash: rm docs/specs/_tasks/mkdocs/{step_file}.md

タスクファイルを削除しない限り、次のステップに進めません。
"""
        print(warning_message, file=sys.stderr)
        # exit 0 で続行を許可（警告のみ）
        sys.exit(0)

    # タスクファイルが削除されている場合は何もしない
    sys.exit(0)


if __name__ == "__main__":
    main()
