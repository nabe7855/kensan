import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWakeLock } from "@/lib/useWakeLock";

function Probe({ active }: { active: boolean }) {
  useWakeLock(active);
  return null;
}

const flush = () => act(async () => await Promise.resolve());

describe("useWakeLock", () => {
  const release = vi.fn(async () => undefined);
  const request = vi.fn(async () => ({ released: false, release }));

  beforeEach(() => {
    request.mockClear();
    release.mockClear();
    Object.defineProperty(navigator, "wakeLock", { value: { request }, configurable: true });
  });
  afterEach(cleanup);

  it("holds the screen on while active and lets go when not", async () => {
    const { rerender } = render(<Probe active />);
    await flush();
    expect(request).toHaveBeenCalledWith("screen");
    rerender(<Probe active={false} />);
    await flush();
    expect(release).toHaveBeenCalled();
  });

  it("does nothing when inactive", async () => {
    render(<Probe active={false} />);
    await flush();
    expect(request).not.toHaveBeenCalled();
  });

  it("takes the lock again when the page comes back", async () => {
    let released = false;
    request.mockImplementation(async () => ({
      get released() {
        return released;
      },
      release,
    }));
    render(<Probe active />);
    await flush();
    released = true; // the browser dropped it while hidden
    document.dispatchEvent(new Event("visibilitychange"));
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
  });
});
