import { describe, expect, it } from "vitest";
import { aliasesFor } from "@/lib/food-aliases";

describe("aliasesFor", () => {
  it("adds everyday words for official MEXT names", () => {
    expect(aliasesFor("にわとり　［若どり・主品目］　むね　皮なし　生")).toContain("鶏むね");
    expect(aliasesFor("こめ　［水稲めし］　精白米　うるち米")).toContain("ご飯");
    expect(aliasesFor("こめ　［水稲めし］　精白米　うるち米")).toContain("白米");
    expect(aliasesFor("鶏卵　全卵　生")).toContain("たまご");
    expect(aliasesFor("＜魚類＞　（さば類）　まさば　生")).toContain("鯖");
  });

  it("returns null when nothing applies", () => {
    expect(aliasesFor("アマランサス　玄穀")).toBeNull();
  });
});
