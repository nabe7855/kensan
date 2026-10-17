// Regenerates src/types/database.ts with this project's own access token, so it keeps working
// when the Supabase CLI on this machine is logged into a different account.
//   .env.supabase.local (gitignored):  SUPABASE_ACCESS_TOKEN=sbp_...
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const env = { ...process.env };
if (existsSync(".env.supabase.local")) {
  for (const line of readFileSync(".env.supabase.local", "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
if (!env.SUPABASE_ACCESS_TOKEN) {
  console.error(
    "SUPABASE_ACCESS_TOKEN がありません。.env.supabase.local に書いてください（.env.example 参照）。",
  );
  process.exit(1);
}

const ref =
  env.SUPABASE_PROJECT_REF ??
  (existsSync("supabase/.temp/project-ref")
    ? readFileSync("supabase/.temp/project-ref", "utf8").trim()
    : "");
if (!ref) {
  console.error("プロジェクト ID がありません。SUPABASE_PROJECT_REF を設定してください。");
  process.exit(1);
}

const types = execFileSync(
  "npx",
  ["supabase", "gen", "types", "typescript", "--project-id", ref, "--schema", "public"],
  {
    env,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "inherit"],
  },
);
if (!types.includes("export type Database")) {
  console.error(
    "型を取得できませんでした。トークンのアカウントにこのプロジェクトがあるか確認してください。",
  );
  process.exit(1);
}
writeFileSync("src/types/database.ts", types);
console.log(`src/types/database.ts を更新しました（${ref}）`);
