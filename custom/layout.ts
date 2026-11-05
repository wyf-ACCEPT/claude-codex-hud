// Personal claude-hud layout. custom/patch.py copies this file into a patched copy of the
// plugin as src/render/custom-layout.ts and renders it in place of the expanded layout.
//   Line 1: model  project + VCS · spend │ output speed │ prompt cache hit rate
//   Line 2: context bar + compactions │ 5h quota │ 7d quota
//   Then the plugin's activity lines (agents, todos, …) in elementOrder.
// It only uses the plugin's exported helpers; if an update changes them, the patched copy
// fails and statusline.sh falls back to the stock plugin.
import type { HudElement } from '../config.ts';
import { formatUsd } from '../cost.ts';
import type { Frame } from './frame.ts';
import { activityLine, type ActivityElement } from './activity.ts';
import { RESET } from './colors.ts';
import { contextLine } from './context.ts';
import { modelBadge, projectParts } from './parts.ts';
import { usageParts } from './usage.ts';

const ACTIVITY = new Set<HudElement>(['tools', 'skills', 'mcp', 'agents', 'todos']);
const fg = (code: number) => (text: string): string => `\x1b[38;5;${code}m${text}${RESET}`;
const muted = fg(244);
const amber = fg(214);
const cyan = fg(80);
const green = fg(114);
const yellow = fg(221);
const red = fg(203);
const SEP = muted(' │ ');

// Model and project, then spend / speed / cache hit after a dot.
function identityLine(f: Frame): string {
  const head = [modelBadge(f), ...projectParts(f, 'expanded')].join('  ');
  const perf = performanceLine(f);
  return perf ? `${head}  ${muted('·')} ${perf}` : head;
}

// Usage windows relabelled `5h` / `7d`, with the reset time as `↻ 3h 9m`.
function quotaParts(f: Frame): string[] {
  const display = { ...f.config.display, showResetLabel: false };
  const parts = usageParts({ ...f, config: { ...f.config, display } } as Frame, 'expanded') ?? [];
  return parts.map((p) => p.replace('Usage', '5h').replace('Weekly', '7d').replace(/\(([^()]*)\)/, '↻ $1'));
}

function resourceLine(f: Frame): string {
  const count = f.transcript?.compactionCount ?? 0;
  const context = contextLine(f) + (f.config?.display?.showCompactions && count > 0 ? ` ${yellow(`⇊${count}`)}` : '');
  return [context, ...quotaParts(f)].join(SEP);
}

function performanceLine(f: Frame): string | null {
  const display = f.config?.display, parts: string[] = [];
  const totals = f.costTotals;
  // `D/W $22.41/$112.70` (day / week), or just one of them.
  const spend: Array<[string, string]> = [];
  if (display?.showDailyCost && totals) spend.push(['D', formatUsd(totals.todayUsd)]);
  if (display?.showWeeklyCost && totals?.weekUsd != null) spend.push(['W', formatUsd(totals.weekUsd)]);
  if (spend.length) parts.push(`💰 ${muted(spend.map(([k]) => k).join('/'))} ${amber(spend.map(([, v]) => v).join('/'))}`);
  if (display?.showSpeed && f.outputSpeed !== null) parts.push(`⚡ ${cyan(`${f.outputSpeed.toFixed(1)} tok/s`)}`);
  const ratio = f.stdin.prompt_cache?.hit_ratio;
  if (display?.showCacheHitRate && typeof ratio === 'number' && Number.isFinite(ratio)) {
    const pct = Math.min(100, Math.max(0, ratio * 100));
    const paint = pct >= 90 ? green : pct >= 70 ? yellow : red;
    parts.push(`🎯 ${muted('Cache')} ${paint(`${pct.toFixed(1)}%`)}`);
  }
  return parts.length ? parts.join(SEP) : null;
}

export function customLines(f: Frame): string[] {
  const order = f.config?.elementOrder ?? [];
  const activity = order
    .filter((el): el is ActivityElement => ACTIVITY.has(el))
    .map((el) => activityLine(f, el))
    .filter((line): line is string => !!line);
  return [identityLine(f), resourceLine(f), ...activity].filter((line): line is string => !!line);
}
