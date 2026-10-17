import { ProgressRing } from "@/components/ui/progress-ring";
import { ringProgress } from "@/lib/rings";
import { perKg } from "@/lib/weekly-sets";

/** Today's protein at a glance: eaten as the solid arc, planned as the lighter one. */
export function ProteinRing({
  eaten,
  planned,
  target,
  bodyKg = null,
}: {
  eaten: number;
  planned: number;
  target: number | null;
  bodyKg?: number | null;
}) {
  const ring = ringProgress(eaten, target);
  const plannedRatio = target ? planned / target : 0;
  const left = target ? Math.max(0, Math.round(target - eaten - planned)) : null;

  return (
    <section className="surface flex items-center gap-4 px-4 py-4">
      <ProgressRing
        ratio={ring?.ratio ?? 0}
        extra={plannedRatio}
        size={132}
        stroke={10}
        label={ring ? `たんぱく質 ${ring.pct}%` : "たんぱく質の目標が未設定"}
      >
        <div className="flex flex-col items-center leading-none">
          <span className="num text-accent text-5xl">{ring ? ring.pct : "—"}</span>
          <span className="num text-muted mt-1 text-xs">%</span>
        </div>
      </ProgressRing>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-muted text-xs">
          たんぱく質
          {target !== null && perKg(target, bodyKg) !== null && (
            <span className="num ml-1.5">目標 体重×{perKg(target, bodyKg)}g</span>
          )}
        </span>
        <p className="flex items-baseline gap-1 whitespace-nowrap">
          <span className="num text-3xl leading-none">{Math.round(eaten)}</span>
          {target !== null && (
            <span className="num text-muted text-sm">/ {Math.round(target)}g</span>
          )}
        </p>
        {planned > 0 && (
          <p className="text-muted text-xs">
            予定を食べると <span className="num text-fg">{Math.round(eaten + planned)}g</span>
          </p>
        )}
        {left !== null && (
          <p className="text-sm">
            {left > 0 ? (
              <>
                あと <span className="num text-accent text-lg">{left}</span>g
              </>
            ) : (
              <span className="text-accent">予定分で目標に届きます</span>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
