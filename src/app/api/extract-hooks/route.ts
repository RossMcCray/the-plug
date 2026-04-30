import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type ValidMediaType = (typeof VALID_TYPES)[number];

const MAX_PER_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB decoded
const MAX_TOTAL_BYTES = 30 * 1024 * 1024;     // 30 MB decoded total

// Standard base64 alphabet — used to reject garbage before it reaches Anthropic
const BASE64_RE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export async function POST(request: NextRequest) {
  // Optional shared-secret guard. Set EXTRACT_API_SECRET in .env.local to enable.
  const requiredSecret = process.env.EXTRACT_API_SECRET;
  if (requiredSecret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${requiredSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Reject oversized bodies before buffering them
  const MAX_BODY_BYTES = 35 * 1024 * 1024; // 30 MB images + JSON overhead
  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  try {
    // Catch malformed JSON separately so it returns 400, not 500
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { images, niche } = body as { images?: unknown; niche?: unknown };

    // Validate top-level shape
    if (!Array.isArray(images) || images.length === 0 || typeof niche !== 'string' || !niche.trim()) {
      return NextResponse.json({ error: 'images (array) and niche are required' }, { status: 400 });
    }
    if (images.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 images allowed' }, { status: 400 });
    }

    // Validate each image + enforce size limits
    let totalBytes = 0;
    for (let idx = 0; idx < images.length; idx++) {
      const img = images[idx];
      if (
        img === null ||
        typeof img !== 'object' ||
        typeof img.data !== 'string' ||
        img.data.length === 0 ||
        !BASE64_RE.test(img.data) ||
        typeof img.mediaType !== 'string' ||
        !(VALID_TYPES as readonly string[]).includes(img.mediaType)
      ) {
        return NextResponse.json(
          { error: `Image ${idx + 1} has an invalid shape, encoding, or unsupported media type` },
          { status: 400 }
        );
      }
      const decodedBytes = Math.floor(img.data.length * 0.75);
      if (decodedBytes > MAX_PER_IMAGE_BYTES) {
        return NextResponse.json(
          { error: `Image ${idx + 1} exceeds the 10 MB per-image limit` },
          { status: 413 }
        );
      }
      totalBytes += decodedBytes;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json(
          { error: 'Total image payload exceeds the 30 MB limit' },
          { status: 413 }
        );
      }
    }

    const imageBlocks: Anthropic.ImageBlockParam[] = images.map(
      (img: { data: string; mediaType: ValidMediaType }) => ({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: img.data },
      })
    );

    const prompt = `Analyze this TikTok slideshow and:
1. Identify the main hook used in the first slide.
2. Explain why this hook works (curiosity / pain point / relatability).
3. Write 7 hook variations for my niche: ${niche.trim()}.
4. Give me 5 specific Pinterest search queries to find background images that match this aesthetic.

Format your response as valid JSON only, with this exact structure — no markdown, no extra text:
{
  "mainHook": "...",
  "whyItWorks": "...",
  "variations": ["hook1", "hook2", "hook3", "hook4", "hook5", "hook6", "hook7"],
  "pinterestQueries": ["query1", "query2", "query3", "query4", "query5"]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text: prompt }] }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type from Claude' }, { status: 500 });
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse JSON from Claude response' }, { status: 500 });
    }

    // Narrow to a non-null object before accessing fields
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Claude returned an unexpected payload shape' }, { status: 502 });
    }
    const p = parsed as Record<string, unknown>;

    if (
      typeof p.mainHook !== 'string' ||
      typeof p.whyItWorks !== 'string' ||
      !Array.isArray(p.variations) ||
      p.variations.length !== 7 ||
      p.variations.some((v: unknown) => typeof v !== 'string') ||
      !Array.isArray(p.pinterestQueries) ||
      p.pinterestQueries.length !== 5 ||
      p.pinterestQueries.some((q: unknown) => typeof q !== 'string')
    ) {
      return NextResponse.json({ error: 'Claude returned an unexpected payload shape' }, { status: 502 });
    }

    return NextResponse.json(p);
  } catch (err) {
    console.error('[extract-hooks]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to extract hooks' }, { status: 500 });
  }
}
