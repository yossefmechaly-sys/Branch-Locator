/** État `loading` de `BranchList` — squelette animé, sans dépendance aux données. */
export function BranchListSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={index} className="animate-pulse rounded-xl border p-5">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
          <div className="mt-4 h-3 w-1/3 rounded bg-muted" />
          <div className="mt-4 flex gap-2">
            <div className="h-8 w-20 rounded-md bg-muted" />
            <div className="h-8 w-20 rounded-md bg-muted" />
            <div className="h-8 w-20 rounded-md bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}
