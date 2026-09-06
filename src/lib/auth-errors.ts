/**
 * Safe, user-facing copy for OAuth failures, shared by `/login` and
 * `/register` so the two pages cannot drift. This map is the validation:
 * an unrecognised `error` code — or anything that isn't a plain string,
 * including a repeated query param that arrives as an array — falls
 * through to the generic message rather than ever reaching the DOM.
 *
 * `error_description`, which Better Auth also appends to the callback URL,
 * is provider- and attacker-influenced free text and must never be read
 * here or anywhere else.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Sign-in was cancelled. Try again when you're ready.",
  no_code: "Sign-in was cancelled. Try again when you're ready.",
};

const DEFAULT_AUTH_ERROR_MESSAGE =
  "We couldn't complete sign-in with Google. Please try again.";

export function getAuthErrorMessage(
  error: string | string[] | undefined,
): string | null {
  if (typeof error !== "string") {
    return null;
  }

  return AUTH_ERROR_MESSAGES[error] ?? DEFAULT_AUTH_ERROR_MESSAGE;
}
