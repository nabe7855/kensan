// Usage: pnpm foods:import [path/to/foods_mext8.csv]
// Converts the MEXT 8th edition CSV into a migration, then apply it with `pnpm db:push`.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { foodsToSql, parseMextFoods } from "../src/lib/foods-csv.ts";

const input = process.argv[2] ?? "data/foods_mext8.csv";
const migrations = "supabase/migrations";

const text = readFileSync(input, "utf8").replace(/^﻿/, "");
const { foods, skipped } = parseMextFoods(text);
if (foods.length === 0) throw new Error("取り込める食品がありませんでした");

const next = Math.max(0, ...readdirSync(migrations).map((f) => parseInt(f, 10) || 0)) + 1;
const file = join(migrations, `${String(next).padStart(4, "0")}_import_foods_mext8.sql`);
writeFileSync(file, foodsToSql(foods));

console.log(`${foods.length} 件を ${file} に書き出しました（スキップ ${skipped} 行）`);
console.log("適用するには: pnpm db:push");
