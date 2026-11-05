#!/usr/bin/env python3
"""Apply the personal claude-hud layout to a copy of the plugin.

Usage: patch.py <plugin copy dir> <layout.ts>
Copies layout.ts to src/render/custom-layout.ts and makes render/index.ts use
customLines() for the expanded layout. Exits non-zero when the plugin source no
longer matches, so statusline.sh falls back to the stock plugin.
"""
import shutil
import sys
from pathlib import Path

root, layout = Path(sys.argv[1]), Path(sys.argv[2])
index = root / "src/render/index.ts"
text = index.read_text()

anchor_import = "import { expandedLines } from './expanded.ts';"
anchor_call = "? expandedLines(frame)"
if anchor_import not in text or anchor_call not in text:
    sys.exit("claude-hud render/index.ts changed; patch not applied")

text = text.replace(anchor_import, anchor_import + "\nimport { customLines } from './custom-layout.ts';", 1)
text = text.replace(anchor_call, "? customLines(frame)", 1)
index.write_text(text)
shutil.copyfile(layout, root / "src/render/custom-layout.ts")
print("patched", root)
