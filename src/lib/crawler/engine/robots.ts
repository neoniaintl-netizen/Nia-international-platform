// robots.txt 파싱 + 경로 허용 판정. User-agent: * 블록 기준.
export interface Robots {
  disallow: string[];
  allow: string[];
}

export function parseRobots(txt: string): Robots {
  const lines = txt.split(/\r?\n/);
  let inStar = false;
  const disallow: string[] = [];
  const allow: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();
    if (key === "user-agent") inStar = val === "*";
    else if (inStar && key === "disallow" && val) disallow.push(val);
    else if (inStar && key === "allow" && val) allow.push(val);
  }
  return { disallow, allow };
}

/** Allow 우선 + 최장 프리픽스 매칭. 매칭 규칙 없으면 허용. */
export function isAllowed(r: Robots, path: string): boolean {
  const longest = (list: string[]) =>
    list.filter((p) => path.startsWith(p)).sort((a, b) => b.length - a.length)[0];
  const a = longest(r.allow);
  const d = longest(r.disallow);
  if (a && d) return a.length >= d.length;
  return !d;
}

export async function fetchRobots(baseUrl: string): Promise<Robots> {
  try {
    const res = await fetch(new URL("/robots.txt", baseUrl), {
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok ? parseRobots(await res.text()) : { disallow: [], allow: [] };
  } catch {
    return { disallow: [], allow: [] };
  }
}
