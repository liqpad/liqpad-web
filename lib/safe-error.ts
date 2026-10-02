const SECRET_URL_PATTERNS = [
  /https?:\/\/[^\s"']*alchemy\.com\/v2\/[^\s"'\\]+/gi,
  /https?:\/\/[^\s"']*infura\.io\/v3\/[^\s"'\\]+/gi,
];

export function safeErrorMessage(cause: unknown): string {
  let message = cause instanceof Error ? cause.message : String(cause);
  for (const pattern of SECRET_URL_PATTERNS) message = message.replace(pattern, '[REDACTED_RPC_URL]');
  return message
    .replace(/((?:api|private|service)[-_ ]?(?:key|role)[=:]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+\/-]+/gi, '$1[REDACTED]');
}

export function logSafeError(context: string, cause: unknown) {
  console.error(context, safeErrorMessage(cause));
}

export function isPendingReceiptError(cause: unknown) {
  return /not found|could not be found|receipt.*unavailable/i.test(safeErrorMessage(cause));
}
