"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { fitWithin, photoPath, type PosePhoto } from "@/lib/poses";
import { BUCKET, photoKeys } from "@/lib/queries/photos";
import { getSupabase } from "@/lib/supabase/client";

/** Downscale to at most 1600px and re-encode as JPEG (also drops location metadata). */
export async function toJpeg(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.85),
  );
  return { blob, width, height };
}

export type PhotoMeta = { taken_on: string; pose: string; tags: string[]; note: string | null };

/** Upload, edit and delete posing photos. Needs a connection (files are not queued offline). */
export function usePhotoActions() {
  const queryClient = useQueryClient();
  const { userId } = useAppData();

  const upload = useCallback(
    async (file: File, meta: PhotoMeta) => {
      const { blob, width, height } = await toJpeg(file);
      const id = crypto.randomUUID();
      const path = photoPath(userId, id);
      const supabase = getSupabase();
      const up = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (up.error) throw up.error;
      const row = { id, user_id: userId, path, width, height, ...meta };
      const ins = await supabase.from("pose_photos").insert(row);
      if (ins.error) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw ins.error;
      }
      queryClient.setQueryData<PosePhoto[]>(photoKeys.all, (list = []) => [
        { id, path, width, height, ...meta },
        ...list,
      ]);
    },
    [queryClient, userId],
  );

  const update = useCallback(
    async (id: string, patch: Partial<PhotoMeta>) => {
      queryClient.setQueryData<PosePhoto[]>(photoKeys.all, (list = []) =>
        list.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
      const { error } = await getSupabase().from("pose_photos").update(patch).eq("id", id);
      if (error) {
        await queryClient.invalidateQueries({ queryKey: photoKeys.all });
        throw error;
      }
    },
    [queryClient],
  );

  const remove = useCallback(
    async (photo: PosePhoto) => {
      const supabase = getSupabase();
      const { error } = await supabase.from("pose_photos").delete().eq("id", photo.id);
      if (error) throw error;
      await supabase.storage.from(BUCKET).remove([photo.path]);
      queryClient.setQueryData<PosePhoto[]>(photoKeys.all, (list = []) =>
        list.filter((p) => p.id !== photo.id),
      );
    },
    [queryClient],
  );

  return { upload, update, remove };
}
