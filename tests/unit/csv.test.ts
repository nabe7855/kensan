import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("adds a BOM, CRLF and escapes special characters", () => {
    const csv = toCsv(
      [
        { name: "鶏むね, 皮なし", note: 'say "hi"', g: 150, ok: true, empty: null },
        { name: "白米", note: "line\nbreak", g: 180.5, ok: false, empty: undefined },
      ],
      [
        { header: "食品", value: (r) => r.name },
        { header: "メモ", value: (r) => r.note },
        { header: "g", value: (r) => r.g },
        { header: "ok", value: (r) => r.ok },
        { header: "空", value: (r) => r.empty },
      ],
    );
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1).split("\r\n")).toEqual([
      "食品,メモ,g,ok,空",
      '"鶏むね, 皮なし","say ""hi""",150,true,',
      '白米,"line\nbreak",180.5,false,',
      "",
    ]);
  });
});
