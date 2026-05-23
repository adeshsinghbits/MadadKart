export function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="h-44 bg-muted skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded skeleton w-3/4" />
        <div className="h-3 bg-muted rounded skeleton w-full" />
        <div className="h-3 bg-muted rounded skeleton w-2/3" />
        <div className="h-1.5 bg-muted rounded-full skeleton" />
        <div className="flex justify-between pt-2">
          <div className="h-3 bg-muted rounded skeleton w-24" />
          <div className="w-5 h-5 bg-muted rounded-full skeleton" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="h-32 bg-muted skeleton" />
      <div className="px-6 pb-6">
        <div className="w-20 h-20 rounded-full bg-muted skeleton -mt-10 mb-4 border-4 border-white" />
        <div className="h-5 bg-muted rounded skeleton w-40 mb-2" />
        <div className="h-3 bg-muted rounded skeleton w-60 mb-4" />
        <div className="flex gap-4">
          <div className="h-3 bg-muted rounded skeleton w-20" />
          <div className="h-3 bg-muted rounded skeleton w-20" />
        </div>
      </div>
    </div>
  );
}
