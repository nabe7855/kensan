/** Shown at once while a screen that needs the server (settings, reports) loads. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      <div className="surface h-12 animate-pulse" />
      <div className="surface h-40 animate-pulse" />
      <div className="surface h-24 animate-pulse" />
    </div>
  );
}
