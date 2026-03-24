export function getErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeMessage = 'message' in error ? error.message : null;
    const maybeDetails = 'details' in error ? error.details : null;
    const maybeHint = 'hint' in error ? error.hint : null;

    const parts = [maybeMessage, maybeDetails, maybeHint].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    );

    if (parts.length > 0) {
      return parts.join(' ');
    }
  }

  return fallback;
}
