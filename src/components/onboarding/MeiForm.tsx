"use client";

import { useActionState, useState } from "react";
import { serif } from "@/components/brand/fonts";
import { Button } from "@/components/ui/button";
import { saveName, type FormState } from "@/app/onboarding/actions";
import { cn } from "@/lib/utils";

export function MeiForm({ defaultName }: { defaultName?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveName, {});
  const [name, setName] = useState(defaultName ?? "");

  return (
    <form action={action} className="flex flex-1 flex-col items-center">
      <div className="surface bg-bg flex h-[340px] w-[180px] flex-col items-center px-3 pt-5 pb-6">
        <span className={cn(serif.className, "text-fg/80 text-sm")}>銘</span>
        <input
          name="display_name"
          aria-label="銘（表示名）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          required
          placeholder="名を刻む"
          autoComplete="nickname"
          className={cn(
            serif.className,
            "border-border bg-card text-fg placeholder:text-ghost focus:border-accent mt-4 h-12 w-full rounded-md border px-3 text-center text-base focus:outline-none",
          )}
        />
        <span aria-hidden className="bg-border mt-6 h-px w-3/4" />
        <p
          aria-hidden
          className={cn(
            serif.className,
            "engrave mt-6 line-clamp-4 text-center text-4xl leading-tight font-black break-all [writing-mode:horizontal-tb]",
            name ? "opacity-100" : "opacity-0",
          )}
        >
          {name || "　"}
        </p>
      </div>

      <p className="text-muted mt-6 text-sm">刀に名を刻むように、自分の名を刻む</p>
      {state.error && (
        <p role="alert" className="text-warn mt-3 text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-auto w-full" disabled={pending || !name.trim()}>
        刻む
      </Button>
    </form>
  );
}
