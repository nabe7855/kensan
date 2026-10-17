import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { SetPicker } from "@/components/workout/SetPicker";

beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});
afterEach(cleanup);

const base = {
  title: "セット2",
  initial: { weight: 82.5, reps: 8, rir: 1 },
  showRir: false,
  onClose: () => undefined,
};

describe("SetPicker", () => {
  it("starts the wheels at the given numbers", () => {
    render(<SetPicker {...base} canComplete onApply={vi.fn()} onComplete={vi.fn()} />);
    expect(
      screen.getByRole("spinbutton", { name: "重さ（kg）" }).getAttribute("aria-valuenow"),
    ).toBe("82");
    expect(
      screen.getByRole("spinbutton", { name: "重さの小数" }).getAttribute("aria-valuetext"),
    ).toBe(".50");
    expect(screen.getByRole("spinbutton", { name: "回数" }).getAttribute("aria-valuenow")).toBe(
      "8",
    );
    expect(screen.queryByRole("spinbutton", { name: "RIR" })).toBeNull();
  });

  it("saves and checks off in one tap, or just saves", () => {
    const onApply = vi.fn();
    const onComplete = vi.fn();
    render(<SetPicker {...base} canComplete onApply={onApply} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "記録して完了" }));
    expect(onComplete).toHaveBeenCalledWith({ weight: 82.5, reps: 8, rir: 1 });
    fireEvent.click(screen.getByRole("button", { name: "決定" }));
    expect(onApply).toHaveBeenCalledWith({ weight: 82.5, reps: 8, rir: 1 });
  });

  it("closing does not save, and a done set can only be edited", () => {
    const onApply = vi.fn();
    render(<SetPicker {...base} canComplete={false} onApply={onApply} onComplete={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "記録して完了" })).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: "閉じる" })[0]!);
    expect(onApply).not.toHaveBeenCalled();
  });

  it("jumps to last time's numbers", () => {
    const onApply = vi.fn();
    render(
      <SetPicker
        {...base}
        previous={{ weight_kg: 80, reps: 10 }}
        canComplete={false}
        onApply={onApply}
        onComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "前回 80×10" }));
    fireEvent.click(screen.getByRole("button", { name: "決定" }));
    expect(onApply).toHaveBeenCalledWith({ weight: 80, reps: 10, rir: 1 });
  });
});
