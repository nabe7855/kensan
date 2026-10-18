import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dock, DockSpacer } from "@/components/shell/Dock";
import type { DockMetrics } from "@/components/shell/useDockMetrics";

const state = vi.hoisted(() => ({
  pathname: "/home",
  timer: null as null | { endsAt: number },
  metrics: null as DockMetrics | null,
}));

vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("@/components/providers/RestTimerProvider", () => ({
  useRestTimer: () => ({ timer: state.timer }),
}));
vi.mock("@/components/shell/useDockMetrics", async (orig) => ({
  ...(await orig<typeof import("@/components/shell/useDockMetrics")>()),
  useDockMetrics: (page: string | null) => (page ? state.metrics : null),
}));

afterEach(() => {
  cleanup();
  state.pathname = "/home";
  state.timer = null;
});

const home: DockMetrics = {
  left: { label: "大会まで", value: "あと48", unit: "日", href: "/contest/c1" },
  hero: {
    ratio: 0.84,
    value: "4.2",
    caption: "体調・良好",
    href: "/condition",
    aria: "今日の体調 4.2（5 段階）、良好",
  },
  right: { label: "たんぱく質", value: "96", unit: "/160g", href: "/nutrition" },
};

describe("Dock", () => {
  it("shows the metrics on a main tab, each linking to its screen", () => {
    state.metrics = home;
    render(<Dock />);
    expect(screen.getByRole("link", { name: /大会まで/ }).getAttribute("href")).toBe("/contest/c1");
    expect(
      screen.getByRole("link", { name: "今日の体調 4.2（5 段階）、良好" }).getAttribute("href"),
    ).toBe("/condition");
    expect(screen.getByRole("link", { name: /たんぱく質/ }).getAttribute("href")).toBe(
      "/nutrition",
    );
    expect(screen.getByText("体調・良好")).toBeTruthy();
  });

  it("keeps the five tabs and marks the current one", () => {
    state.metrics = home;
    render(<Dock />);
    const tabs = screen.getAllByRole("link").filter((a) => a.closest("li"));
    expect(tabs.map((a) => a.textContent)).toEqual([
      "ホーム",
      "トレ",
      "食事",
      "コンディション",
      "分析",
    ]);
    expect(tabs[0]!.getAttribute("aria-current")).toBe("page");
  });

  it("is just the tabs elsewhere and while a rest is counting down", () => {
    state.metrics = home;
    state.pathname = "/analysis";
    render(<Dock />);
    expect(screen.queryByLabelText("今日の状況")).toBeNull();
    cleanup();
    state.pathname = "/home";
    state.timer = { endsAt: Date.now() + 60_000 };
    render(<Dock />);
    expect(screen.queryByLabelText("今日の状況")).toBeNull();
  });

  it("asks to record when there is nothing yet", () => {
    state.metrics = {
      ...home,
      hero: {
        ...home.hero,
        ratio: 0,
        value: "—",
        caption: "今日の体調を記録",
        empty: true,
        aria: "未記録",
      },
    };
    render(<Dock />);
    expect(screen.getByText("今日の体調を記録")).toBeTruthy();
  });
});

describe("DockSpacer", () => {
  it("reserves room only where the metrics row shows", () => {
    const { container, rerender } = render(<DockSpacer />);
    expect(container.firstChild).not.toBeNull();
    state.pathname = "/analysis";
    rerender(<DockSpacer />);
    expect(container.firstChild).toBeNull();
  });
});
