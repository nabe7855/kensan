"use client";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { LogItem } from "@/lib/queries/nutrition";
import { AmountEntry } from "./AmountEntry";

/** Change the amount of a logged item, or delete it. */
export function ItemSheet({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: LogItem;
  onClose: () => void;
  onSave: (grams: number) => void;
  onDelete: () => void;
}) {
  return (
    <Sheet title="量を変更" onClose={onClose}>
      <div className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto pb-3">
        <AmountEntry
          food={item.food}
          initialGrams={item.grams}
          submitLabel="保存"
          onSubmit={(grams) => {
            onSave(grams);
            onClose();
          }}
        />
        <Button
          variant="ghost"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          この記録を削除
        </Button>
      </div>
    </Sheet>
  );
}
