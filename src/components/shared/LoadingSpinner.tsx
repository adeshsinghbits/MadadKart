export function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizes[size]} rounded-full border-2 border-muted border-t-primary animate-spin`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
