export function Skeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border">
      <div className="h-[130px] w-full bg-muted sm:h-[150px]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-4/5 rounded bg-muted" />
        <div className="h-3 w-3/5 rounded bg-muted" />
        <div className="h-6 w-2/3 rounded bg-muted" />
        <div className="flex gap-1.5">
          <div className="h-5 w-16 rounded bg-muted" />
          <div className="h-5 w-14 rounded bg-muted" />
          <div className="h-5 w-12 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
