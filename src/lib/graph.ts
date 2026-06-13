import crypto from "node:crypto";
import { getEnv } from "@/lib/env";
import { GRAPH_API_VERSION } from "@/lib/metrics";

const GRAPH_BASE = "https://graph.facebook.com";

export interface GraphErrorInit {
  code?: number;
  subcode?: number;
  type?: string;
  fbtraceId?: string;
  status: number;
}

/** Typed Graph API error. `code === 100` is the "invalid metric" signal we self-heal on. */
export class GraphError extends Error {
  code?: number;
  subcode?: number;
  type?: string;
  fbtraceId?: string;
  status: number;

  constructor(message: string, init: GraphErrorInit) {
    super(message);
    this.name = "GraphError";
    this.code = init.code;
    this.subcode = init.subcode;
    this.type = init.type;
    this.fbtraceId = init.fbtraceId;
    this.status = init.status;
  }
}

export type GraphParams = Record<string, string | number | undefined>;

export interface GraphInsightValue {
  value: number | Record<string, number>;
  end_time?: string;
}

export interface GraphInsightEntry {
  name: string;
  period: string;
  values: GraphInsightValue[];
  title?: string;
  id?: string;
}

export interface GraphInsightsResponse {
  data: GraphInsightEntry[];
  paging?: { next?: string; cursors?: { before?: string; after?: string } };
}

/** appsecret_proof = HMAC-SHA256(access_token) keyed by the app secret. */
export function appsecretProof(token: string, appSecret: string): string {
  return crypto.createHmac("sha256", appSecret).update(token).digest("hex");
}

/**
 * GET a Graph API resource. Adds the access token and (when FB_APP_SECRET is
 * set) the appsecret_proof. Throws GraphError on any API error.
 */
export async function graphGet<T = unknown>(
  path: string,
  params: GraphParams,
  token: string,
): Promise<T> {
  const env = getEnv();
  const version = env.FB_GRAPH_VERSION || GRAPH_API_VERSION;
  const url = new URL(`${GRAPH_BASE}/${version}/${path.replace(/^\/+/, "")}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  url.searchParams.set("access_token", token);
  if (env.FB_APP_SECRET) {
    url.searchParams.set("appsecret_proof", appsecretProof(token, env.FB_APP_SECRET));
  }

  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (e) {
    throw new GraphError(`Network error calling Graph API: ${String(e)}`, { status: 0 });
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new GraphError(`Graph API returned non-JSON (HTTP ${res.status})`, {
      status: res.status,
    });
  }

  const maybeError = (json as { error?: Record<string, unknown> }).error;
  if (!res.ok || maybeError) {
    const e = maybeError ?? {};
    throw new GraphError(String(e.message ?? `Graph API error (HTTP ${res.status})`), {
      code: typeof e.code === "number" ? e.code : undefined,
      subcode: typeof e.error_subcode === "number" ? e.error_subcode : undefined,
      type: typeof e.type === "string" ? e.type : undefined,
      fbtraceId: typeof e.fbtrace_id === "string" ? e.fbtrace_id : undefined,
      status: res.status,
    });
  }

  return json as T;
}
