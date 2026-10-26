import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { REVIEW_MAX_BODY_BYTES, reviewInputSchema, reviewPageSchema } from "@/lib/validators/review";
import {
  getPublicBranchReviews, submitBranchReview, ReviewBranchNotFoundError, ReviewRateLimitError,
} from "@/services/review.service";

type Context = { params: Promise<{ slug: string }> };

function errorResponse(error: unknown) {
  if (error instanceof ReviewBranchNotFoundError) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (error instanceof ReviewRateLimitError) return NextResponse.json({ error: "RATE_LIMITED" }, {
    status: 429, headers: { "Retry-After": "3600" },
  });
  console.error("[branch reviews]", error);
  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
}

export async function GET(request: NextRequest, context: Context) {
  const page = reviewPageSchema.safeParse(request.nextUrl.searchParams.get("page") ?? undefined);
  if (!page.success) return NextResponse.json({ error: "INVALID_QUERY" }, { status: 400 });
  try {
    const { slug } = await context.params;
    return NextResponse.json(await getPublicBranchReviews(slug, page.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest, context: Context) {
  const origin = request.headers.get("origin");
  const allowedOrigins = [request.nextUrl.origin];
  if (process.env.NEXT_PUBLIC_SITE_URL) allowedOrigins.push(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin);
  if (!origin || !allowedOrigins.includes(origin)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 415 });
  }
  if (Number(request.headers.get("content-length")) > REVIEW_MAX_BODY_BYTES) {
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }
  // Bound actual bytes even when Content-Length is absent or misleading.
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > REVIEW_MAX_BODY_BYTES) {
        await reader.cancel();
        return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
      }
      chunks.push(value);
    }
  } catch { return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 }); }
  let body: unknown;
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }
  const parsed = reviewInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET must be configured for review submissions");
    // Deployment proxy must overwrite X-Forwarded-For (see docs/customer-reviews.md).
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const clientHash = createHmac("sha256", secret).update(`branch-reviews:${ip}`).digest("hex");
    const { slug } = await context.params;
    await submitBranchReview(slug, parsed.data, clientHash);
    return NextResponse.json({ status: "PENDING" }, { status: 202 });
  } catch (error) { return errorResponse(error); }
}
