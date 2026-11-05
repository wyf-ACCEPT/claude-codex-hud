#!/bin/bash
# Status line: claude-hud rendered with a personal layout (custom/layout.ts), applied to a
# patched copy of the newest installed plugin version so plugin updates don't drop it.
# Any failure (patch no longer applies, patched copy errors or prints nothing) falls back
# to the stock plugin.
base="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
bun="/Users/wangyifan/.bun/bin/bun"
custom="$base/plugins/claude-hud/custom"
plugin_dir=$(ls -d "$base"/plugins/cache/claude-hud/claude-hud/*/ 2>/dev/null \
  | awk -F/ '{ print $(NF-1) "\t" $(0) }' | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n | tail -1 | cut -f2-)
version=$(basename "$plugin_dir")
build="$custom/build/$version"
input=$(cat)

if [ ! -f "$build/.ok" ] || [ "$custom/layout.ts" -nt "$build/.ok" ] || [ "$custom/patch.py" -nt "$build/.ok" ]; then
  # Build aside and swap in whole, so concurrent status line runs never see a half copy.
  tmp="$custom/build/.tmp.$$"
  rm -rf "$tmp" && mkdir -p "$tmp" \
    && (cd "$plugin_dir" && find . -mindepth 1 -maxdepth 1 ! -name node_modules -exec cp -R {} "$tmp"/ \;) \
    && { [ ! -d "${plugin_dir}node_modules" ] || ln -s "${plugin_dir}node_modules" "$tmp/node_modules"; } \
    && python3 "$custom/patch.py" "$tmp" "$custom/layout.ts" >/dev/null 2>&1 && touch "$tmp/.ok" \
    && rm -rf "$build.old" && { [ ! -e "$build" ] || mv "$build" "$build.old"; } && mv "$tmp" "$build"
  rm -rf "$tmp" "$build.old"
fi
if [ -f "$build/.ok" ]; then
  out=$(printf '%s' "$input" | "$bun" --env-file /dev/null "$build/src/index.ts")
  if [ $? -eq 0 ] && [ -n "$out" ]; then printf '%s\n' "$out"; exit 0; fi
fi
printf '%s' "$input" | exec "$bun" --env-file /dev/null "${plugin_dir}src/index.ts"
