interface Badge { id: string; name: string; icon: string; description: string; earnedAt?: string }

export function BadgeDisplay({ badges }: { badges: Badge[] }) {
  if (!badges?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map(badge => (
        <div key={badge.id} title={badge.description}
          className="group relative flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full text-xs font-medium cursor-default">
          <span>{badge.icon}</span>
          <span>{badge.name}</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
            <div className="bg-foreground text-background text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
              {badge.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
