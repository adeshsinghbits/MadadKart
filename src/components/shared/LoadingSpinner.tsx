type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
};

export function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-16',
    md: 'w-24',
    lg: 'w-32',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        fullScreen ? 'fixed inset-0 z-9999 bg-black/40' : 'w-full h-full'
      }`}
    >
      <div
        className={`${sizes[size]} aspect-square rounded-full relative flex justify-center items-center animate-[spin_3s_linear_infinite] z-40 bg-[conic-gradient(white_0deg,white_300deg,transparent_270deg,transparent_360deg)] before:animate-[spin_2s_linear_infinite] before:absolute before:w-[60%] before:aspect-square before:rounded-full before:z-80 before:bg-[conic-gradient(white_0deg,white_270deg,transparent_180deg,transparent_360deg)] after:absolute after:w-3/4 after:aspect-square after:rounded-full after:z-60 after:animate-[spin_3s_linear_infinite] after:bg-[conic-gradient(#065f46_0deg,#065f46_180deg,transparent_180deg,transparent_360deg)]`}
      >
        <span className="absolute w-[85%] aspect-square rounded-full z-60 animate-[spin_5s_linear_infinite] bg-[conic-gradient(#34d399_0deg,#34d399_180deg,transparent_180deg,transparent_360deg)]" />
      </div>

      {text && (
        <p className="text-sm font-medium text-white tracking-wide">
          {text}
        </p>
      )}
    </div>
  );
}