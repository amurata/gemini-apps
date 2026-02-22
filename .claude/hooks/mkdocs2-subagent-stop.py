#!/usr/bin/env python3
"""
mkdocs2 サブエージェント完了確認Hook

SubagentStop時に実行され、タスクファイルの削除確認と次のステップをガイド。
"""

import os
import sys
from pathlib import Path


def main():
    # プロジェクトディレクトリを取得
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    task_dir = Path(project_dir) / "docs" / "specs" / "_tasks" / "mkdocs2"

    # タスクディレクトリが存在しない場合は何もしない（mkdocs2関連でない）
    if not task_dir.exists():
        sys.exit(0)

    # 各タスクファイルの存在確認
    tasks = {
        "01-detect.md": "DETECT",
        "02-create.md": "CREATE",
        "03-verify.md": "VERIFY",
        "04-optimize.md": "OPTIMIZE",
        "05-complete.md": "COMPLETE",
    }

    remaining_tasks = []
    for task_file, phase_name in tasks.items():
        task_path = task_dir / task_file
        if task_path.exists():
            remaining_tasks.append((task_file, phase_name))

    # すべてのタスクが完了している場合
    if not remaining_tasks:
        print("\n" + "=" * 60)
        print("🎉 /mkdocs2 ワークフロー完了")
        print("=" * 60)
        print("\nすべてのフェーズが正常に完了しました。")
        print("\n📚 作成されたドキュメント:")
        print("   > Read docs/specs/overview.md")
        print("\n📊 完了サマリー:")
        print("   > Read docs/specs/_context/completion_summary.md")
        print("\n" + "=" * 60 + "\n")
        sys.exit(0)

    # 最初の残タスクを特定
    current_task_file, current_phase = remaining_tasks[0]
    current_step = current_task_file.split("-")[0]

    # 次のサブエージェント名を決定
    subagent_mapping = {
        "01": ("mkdocs2-detect", "パターン検出"),
        "02": ("mkdocs2-create", "初期ドキュメント作成"),
        "03": ("mkdocs2-verify", "コードベース検証"),
        "04": ("mkdocs2-optimize", "構造最適化"),
        "05": ("mkdocs2-complete", "最終チェック"),
    }

    subagent_name, subagent_desc = subagent_mapping.get(current_step, (None, None))

    if not subagent_name:
        sys.exit(0)

    # ガイダンス表示
    print("\n" + "=" * 60)
    print(f"📋 次のステップ: {current_phase} フェーズ")
    print("=" * 60)
    print(f"\n{subagent_desc}を実行してください。")
    print(f"\n実行コマンド:")
    print(f"   > Use the {subagent_name} subagent")
    print(f"\n残りのフェーズ: {len(remaining_tasks)}/{len(tasks)}")
    for task_file, phase_name in remaining_tasks:
        print(f"   - {phase_name}")
    print("\n" + "=" * 60 + "\n")

    sys.exit(0)


if __name__ == "__main__":
    main()
