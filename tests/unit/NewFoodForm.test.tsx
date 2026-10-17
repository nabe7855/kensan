import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewFoodForm } from "@/components/nutrition/NewFoodForm";

afterEach(cleanup);

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("NewFoodForm", () => {
  it("saves a per-bag label as per 100 g with the bag as a unit", () => {
    const onSave = vi.fn();
    render(<NewFoodForm initialName="サラダチキン" onSave={onSave} onCancel={vi.fn()} />);
    type("1袋の重さ（g）", "110");
    type("エネルギー（kcal）", "121");
    type("たんぱく質（g）", "26.4");
    type("脂質（g）", "1.2");
    type("炭水化物（g）", "1.5");
    type("食塩相当量（g）", "1.1");
    fireEvent.click(screen.getByRole("button", { name: "肉" }));
    fireEvent.click(screen.getByRole("button", { name: "登録して量を入れる" }));
    expect(onSave).toHaveBeenCalledWith({
      name: "サラダチキン",
      food_group: 11,
      kcal: 110,
      protein_g: 24,
      fat_g: 1.09,
      carb_g: 1.36,
      fiber_g: null,
      sodium_mg: 393.4,
      unit_name: "袋",
      unit_grams: 110,
    });
  });

  it("waits for the required numbers and warns when kcal doesn't match P/F/C", () => {
    render(<NewFoodForm onSave={vi.fn()} onCancel={vi.fn()} />);
    const save = screen.getByRole("button", { name: "登録して量を入れる" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "100g 当たり" }));
    type("食品名", "テスト");
    type("エネルギー（kcal）", "400");
    type("たんぱく質（g）", "10");
    type("脂質（g）", "1");
    type("炭水化物（g）", "10");
    expect(screen.getByText(/約 89kcal/)).toBeTruthy();
    expect(save.disabled).toBe(false);
  });
});
