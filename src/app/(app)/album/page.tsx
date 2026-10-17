import type { Metadata } from "next";
import { AlbumScreen } from "@/components/album/AlbumScreen";

export const metadata: Metadata = { title: "ポーズ写真 | 研鑽" };

export default function AlbumPage() {
  return <AlbumScreen />;
}
