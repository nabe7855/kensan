/** Deterministic wavy "hamon" temper lines as SVG path strings in a 400x240 box. */
export function hamonPaths(lines = 36, width = 400, height = 240): string[] {
  const paths: string[] = [];
  for (let i = 0; i < lines; i++) {
    const t = i / (lines - 1);
    const base = height * (0.35 + 0.6 * t);
    const amp = 10 + 22 * (1 - t);
    const phase = i * 0.12;
    let d = "";
    for (let x = 0; x <= width; x += 8) {
      const u = x / width;
      const y =
        base -
        amp * Math.sin(u * Math.PI * 2.2 + phase) -
        amp * 0.45 * Math.sin(u * Math.PI * 5.3 + phase * 1.3) -
        height * 0.18 * u;
      d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`;
    }
    paths.push(d);
  }
  return paths;
}
