/**
 * Deterministic sample/demo data so the dashboard looks complete BEFORE any
 * token or database is connected. Clearly badged as "Sample data" in the UI.
 */
import { addDaysISO, todayISO } from "@/lib/dates";

export interface SamplePage {
  id: string;
  name: string;
}

export const SAMPLE_PAGES: SamplePage[] = [
  { id: "sample-sunrise", name: "Sunrise Coffee Co." },
  { id: "sample-trailhead", name: "Trailhead Outdoors" },
];

const BASE: Record<string, number> = {
  page_views_total: 1200,
  page_post_engagements: 480,
  page_actions_post_reactions_total: 260,
  page_daily_follows_unique: 35,
  page_video_views: 900,
};

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

export function sampleSeries(
  pageId: string,
  metric: string,
  days = 30,
): { date: string; value: number }[] {
  const rnd = mulberry32(hashSeed(`${pageId}:${metric}`));
  const base = BASE[metric] ?? 100;
  const pageMult = pageId === SAMPLE_PAGES[1].id ? 0.62 : 1;
  const out: { date: string; value: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = addDaysISO(todayISO(), -i);
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    const weekly = dow === 0 || dow === 6 ? 0.8 : 1.05;
    const trend = 1 + ((days - i) / days) * 0.25;
    const noise = 0.85 + rnd() * 0.3;
    out.push({ date, value: Math.max(0, Math.round(base * pageMult * weekly * trend * noise)) });
  }
  return out;
}

const SAMPLE_POST_TEXTS = [
  "New seasonal blend just dropped ☕ come try it this weekend!",
  "Behind the scenes: how we roast our single-origin beans 🔥",
  "Thank you for 10k followers — here's 20% off all week 🎉",
  "Rainy day = perfect latte weather. What's your go-to order?",
  "Meet the team! Say hi to our new head barista, Maya 👋",
  "Weekend giveaway: tag a friend you'd share a cortado with.",
  "Our pumpkin spice is back (yes, already). Don't @ us.",
  "Live music this Friday 7pm — free entry, great espresso.",
];

export interface SamplePost {
  postId: string;
  message: string;
  createdTime: string;
  clicks: number;
  reactions: number;
  videoViews: number | null;
}

export function samplePosts(pageId: string, count = 8): SamplePost[] {
  const rnd = mulberry32(hashSeed(`${pageId}:posts`));
  const out: SamplePost[] = [];
  for (let i = 0; i < count; i++) {
    const isVideo = rnd() > 0.6;
    out.push({
      postId: `${pageId}-post-${i + 1}`,
      message: SAMPLE_POST_TEXTS[i % SAMPLE_POST_TEXTS.length],
      createdTime: `${addDaysISO(todayISO(), -(i * 3 + 1))}T14:30:00Z`,
      clicks: Math.round(40 + rnd() * 220),
      reactions: Math.round(15 + rnd() * 140),
      videoViews: isVideo ? Math.round(300 + rnd() * 4000) : null,
    });
  }
  return out;
}
