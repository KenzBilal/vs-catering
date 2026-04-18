export default function LoadingState({ rows = 3 }) {
  return (
    <div className="animate-pulse flex flex-col gap-3 w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-[72px] bg-white border border-cream-200 rounded-2xl w-full flex items-center px-5 gap-4">
          <div className="w-10 h-10 bg-cream-100 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-4 bg-cream-100 rounded-md w-1/3" />
            <div className="h-3 bg-cream-100 rounded-md w-1/4" />
          </div>
          <div className="h-8 w-20 bg-cream-100 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}
