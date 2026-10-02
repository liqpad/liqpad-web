import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_REPORT_BYTES = 16_384;

function safeText(value: unknown, max = 500) {
  return typeof value === 'string' ? value.slice(0, max) : undefined;
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_REPORT_BYTES) {
    return NextResponse.json({ error: 'Report is too large.' }, { status: 413 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rawReport = body['csp-report'] ?? body.body ?? body;
    const report =
      rawReport && typeof rawReport === 'object'
        ? (rawReport as Record<string, unknown>)
        : {};

    // Keep logs useful without storing the full browser payload or any wallet data.
    console.warn('CSP violation', {
      documentUri: safeText(report['document-uri'] ?? report.documentURL),
      blockedUri: safeText(report['blocked-uri'] ?? report.blockedURL),
      effectiveDirective: safeText(
        report['effective-directive'] ?? report.effectiveDirective,
      ),
      sourceFile: safeText(report['source-file'] ?? report.sourceFile),
      disposition: safeText(report.disposition, 32),
    });
  } catch {
    // Browsers may send an empty or vendor-specific report. Do not retry it.
  }

  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
}
