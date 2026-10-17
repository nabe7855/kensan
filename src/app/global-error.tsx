"use client";

import { useEffect } from "react";
import { reloadForChunkOnce } from "@/lib/chunk-error";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
    reloadForChunkOnce(error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{ background: "#0A0A0C", color: "#F2F2F2", fontFamily: "sans-serif", padding: 24 }}
      >
        <h1 style={{ fontSize: 20 }}>表示できませんでした</h1>
        <p style={{ color: "#9A9AA3", fontSize: 14 }}>
          記録は消えていません。再読み込みしてください。
        </p>
        <pre style={{ color: "#5C5C66", fontSize: 12, whiteSpace: "pre-wrap" }}>
          {error.name}: {error.message}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 16,
            height: 48,
            padding: "0 20px",
            background: "#FF4D1C",
            color: "#0A0A0C",
            border: 0,
            borderRadius: 8,
            fontWeight: 700,
          }}
        >
          再読み込み
        </button>
      </body>
    </html>
  );
}
