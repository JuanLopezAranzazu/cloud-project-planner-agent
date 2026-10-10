import type { Plan } from './types';

const TIER: Record<Plan['cost']['tier'], string> = {
  'free-tier': 'Fits in the free tier',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const tierLabel = (t: Plan['cost']['tier']) => TIER[t];

export function planToMarkdown(p: Plan): string {
  const out: string[] = [`# ${p.title}`, `*${p.tagline}*`, '', p.summary, ''];

  out.push('## Architecture', `**Pattern:** ${p.architecture.pattern}`, '');
  if (p.architecture.flow.length) out.push(`**Request flow:** ${p.architecture.flow.join(' → ')}`, '');
  p.architecture.services.forEach((s) => out.push(`- **${s.name}**: ${s.role}. _${s.why}_`));

  out.push('', '## Roadmap');
  p.roadmap.forEach((r) => {
    out.push('', `### ${r.phase}: ${r.title} (${r.duration})`);
    r.tasks.forEach((t) => out.push(`- [ ] ${t}`));
  });

  out.push('', '## Costs', `**${tierLabel(p.cost.tier)}** · approx. USD ${p.cost.monthlyEstimateUsd} per month`, '', p.cost.notes);

  if (p.risks.length) {
    out.push('', '## Risks');
    p.risks.forEach((r) => out.push(`- **${r.risk}**: ${r.mitigation}`));
  }

  out.push('', '## Your first step', p.nextStep, '', '---', '_Generated with cloud-project-planner-agent (Amazon Bedrock)_');
  return out.join('\n');
}
