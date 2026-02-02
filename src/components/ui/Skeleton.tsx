export function Skeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border">
      <div className="aspect-video bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="flex gap-1.5">
          <div className="h-5 w-10 rounded bg-muted" />
          <div className="h-5 w-14 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
