# claude-hud personal setup

Personal layout and config for the [claude-hud](https://github.com/jarrodwatts/claude-hud)
status line. The plugin itself lives in `~/.claude/plugins/cache/claude-hud/` and is never
edited; everything here survives plugin updates.

## Files

| File | What it does |
|---|---|
| `config.json` | Plugin display options (read by claude-hud itself). |
| `custom/layout.ts` | The two-line layout: model · project · `💰 D/W` · `⚡` · `🎯`, then context `⇊n` · 5h · 7d. |
| `custom/patch.py` | Copies `layout.ts` into a plugin copy and swaps it in for the expanded layout. |
| `custom/statusline.sh` | Status line entry point: builds `custom/build/<version>/` from the newest installed plugin, runs it, falls back to the stock plugin on any failure. |

## Wiring

`~/.claude/settings.json` must point the status line at the wrapper:

```json
"statusLine": {
  "type": "command",
  "command": "bash \"${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/claude-hud/custom/statusline.sh\""
}
```

Running `/claude-hud:setup` rewrites this command to the stock one; set it back afterwards.

## After a plugin update

Nothing to do normally: the wrapper rebuilds `custom/build/<new version>/` on first run.
If the status line falls back to the stock look, the plugin's internals changed:
check `python3 custom/patch.py <copy> custom/layout.ts` and the helpers `layout.ts` imports.
