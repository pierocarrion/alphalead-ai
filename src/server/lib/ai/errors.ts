/**
 * Friendly error mapping shared across all AI providers. Centralized so the UX
 * never leaks vendor internals (quota project ids, auth details, stack traces).
 */
const MSG_QUOTA = "We're hitting our AI limit right now. Please try again in a moment.";
const MSG_UNAVAILABLE = "Our AI service isn't reachable right now. Please try again in a moment.";
const MSG_DEFAULT = "We couldn't process that with AI right now. Please try again in a moment.";
const MSG_PARSE = "Our AI returned something we couldn't read. Please try again.";
const MSG_EMPTY = "Our AI didn't respond. Please try again.";
const MSG_DISABLED = "AI features aren't enabled right now.";

export function toFriendlyAiError(error: string | undefined): string {
  if (!error) return MSG_DEFAULT;
  const lower = error.toLowerCase();
  if (lower.includes("quota") || lower.includes("rate_limit") || lower.includes("resource_exhausted") || lower.includes("429")) {
    return MSG_QUOTA;
  }
  if (lower.includes("permission_denied") || lower.includes("unauthenticated") || lower.includes("401") || lower.includes("403")) {
    return MSG_UNAVAILABLE;
  }
  if (lower.includes("not enabled") || lower.includes("misconfigured") || lower.includes("disabled")) {
    return MSG_DISABLED;
  }
  if (lower.includes("json parse error") || lower.includes("unexpected token")) {
    return MSG_PARSE;
  }
  if (lower.includes("empty response")) {
    return MSG_EMPTY;
  }
  if (lower.includes("unavailable") || lower.includes("timeout") || lower.includes("deadline") || lower.includes("503") || lower.includes("500")) {
    return MSG_UNAVAILABLE;
  }
  return MSG_DEFAULT;
}

export const AI_FRIENDLY = {
  quota: MSG_QUOTA,
  unavailable: MSG_UNAVAILABLE,
  default: MSG_DEFAULT,
  parse: MSG_PARSE,
  empty: MSG_EMPTY,
  disabled: MSG_DISABLED,
};
