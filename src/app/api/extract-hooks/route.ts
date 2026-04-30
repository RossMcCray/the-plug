import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type ValidMediaType = (typeof VALID_TYPES)[number];

const MAX_PER_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB decoded
const MAX_TOTAL_BYTES = 30 * 1024 * 1024;     // 30 MB decoded total

export async function POST(request: NextRequest) {
  // Optional shared-secret guard. Set EXTRACT_API_SECRET in .env.local to enable.
  const requiredSecret = process.env.EXTRACT_API_SECRET;
  if (requiredSecret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${requiredSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { images, niche } = body;

    // Validate top-level shape
    if (!Array.isArray(images) || images.length === 0 || !niche?.trim?.()) {
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
        typeof img !== 'object' ||
        typeof img.data !== 'string' ||
        img.data.length === 0 ||
        typeof img.mediaType !== 'string' ||
        !(VALID_TYPES as readonly string[]).includes(img.mediaType)
      ) {
        return NextResponse.json(
          { error: `Image ${idx + 1} has an invalid shape or unsupported media type` },
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

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate response shape
    if (
      typeof parsed.mainHook !== 'string' ||
      typeof parsed.whyItWorks !== 'string' ||
      !Array.isArray(parsed.variations) ||
      parsed.variations.length !== 7 ||
      parsed.variations.some((v: unknown) => typeof v !== 'string') ||
      !Array.isArray(parsed.pinterestQueries) ||
      parsed.pinterestQueries.length !== 5 ||
      parsed.pinterestQueries.some((q: unknown) => typeof q !== 'string')
    ) {
      return NextResponse.json({ error: 'Claude returned an unexpected payload shape' }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to extract hooks';
    console.error('[extract-hooks]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
