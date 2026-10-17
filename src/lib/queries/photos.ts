"use client";

import { useQuery } from "@tanstack/react-query";
import type { PosePhoto } from "@/lib/poses";
import { getSupabase } from "@/lib/supabase/client";

export const BUCKET = "pose-photos";
const URL_TTL_SEC = 60 * 60;

export const photoKeys = {
  all: ["pose-photos"] as const,
  urls: (paths: string[]) => ["pose-photo-urls", ...paths] as const,
};

export function usePosePhotos() {
  return useQuery({
    queryKey: photoKeys.all,
    queryFn: async (): Promise<PosePhoto[]> => {
      const { data, error } = await getSupabase()
        .from("pose_photos")
        .select("id, taken_on, pose, tags, note, path, width, height")
        .order("taken_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Short-lived links for private photos, refreshed before they expire. */
export function useSignedUrls(paths: string[]) {
  return useQuery({
    queryKey: photoKeys.urls(paths),
    enabled: paths.length > 0,
    staleTime: (URL_TTL_SEC - 300) * 1000,
    gcTime: (URL_TTL_SEC - 300) * 1000,
    // A plain object, not a Map: the query cache is persisted as JSON.
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await getSupabase()
        .storage.from(BUCKET)
        .createSignedUrls(paths, URL_TTL_SEC);
      if (error) throw error;
      const urls: Record<string, string> = {};
      for (const d of data) if (d.path && d.signedUrl) urls[d.path] = d.signedUrl;
      return urls;
    },
  });
}
