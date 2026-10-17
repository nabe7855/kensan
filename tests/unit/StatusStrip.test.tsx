import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StripRings } from "@/components/shell/StatusStrip";
import { stripPage } from "@/components/shell/useStatusStrip";

afterEach(cleanup);

describe("status strip", () => {
  it("shows only on the main tabs", () => {
    expect(stripPage("/nutrition")).toBe("/nutrition");
    expect(stripPage("/training/workout")).toBeNull();
    expect(stripPage("/analysis")).toBeNull();
  });

  it("renders a ring per item with a percentage or a check", () => {
    render(
      <StripRings
        items={[
          {
            key: "p",
            label: "たんぱく質",
            value: "96/150g",
            ring: { ratio: 0.64, pct: 64 },
            centre: "pct",
            aria: "たんぱく質 64%",
          },
          {
            key: "k",
            label: "カロリー",
            value: "目標未設定",
            ring: null,
            centre: "pct",
            aria: "カロリーの目標が未設定",
          },
          {
            key: "c",
            label: "今日の体調",
            value: "記録済み",
            ring: { ratio: 1, pct: 100 },
            centre: "check",
            aria: "今日の体調は記録済み",
          },
        ]}
      />,
    );
    expect(screen.getByRole("img", { name: "たんぱく質 64%" }).textContent).toBe("64");
    expect(screen.getByRole("img", { name: "カロリーの目標が未設定" }).textContent).toBe("—");
    expect(screen.getByText("96/150g")).toBeTruthy();
  });
});
