"use client";

import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/app/(app)/settings/actions";
import { useSync } from "@/components/providers/SyncProvider";
import { Button } from "@/components/ui/button";
import { localDb } from "@/lib/offline/db";

export function LogoutButton() {
  const { pending } = useSync();
  const queryClient = useQueryClient();

  async function logout() {
    if (
      pending > 0 &&
      !window.confirm(
        `未送信の記録が ${pending} 件あります。ログアウトすると失われます。続けますか？`,
      )
    ) {
      return;
    }
    await localDb().outbox.clear();
    await localDb().kv.clear();
    queryClient.clear();
    await signOut();
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={logout}>
      ログアウト
    </Button>
  );
}
