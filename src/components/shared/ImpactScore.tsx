import { TrendingUp } from 'lucide-react';

const LEVELS = [
  { min: 0,    label: 'Newcomer',   color: 'text-gray-500',  bg: 'bg-gray-100' },
  { min: 50,   label: 'Helper',     color: 'text-green-600', bg: 'bg-green-100' },
  { min: 200,  label: 'Supporter',  color: 'text-blue-600',  bg: 'bg-blue-100' },
  { min: 500,  label: 'Champion',   color: 'text-purple-600',bg: 'bg-purple-100' },
  { min: 1000, label: 'Hero',       color: 'text-amber-600', bg: 'bg-amber-100' },
  { min: 2000, label: 'Legend',     color: 'text-red-600',   bg: 'bg-red-100' },
];

export function ImpactScore({ score }: { score: number }) {
  const level = [...LEVELS].reverse().find(l => score >= l.min) || LEVELS[0];
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${level.bg} ${level.color}`}>
      <TrendingUp size={14} />
      <span>{score} pts</span>
      <span className="opacity-70">· {level.label}</span>
    </div>
  );
}
