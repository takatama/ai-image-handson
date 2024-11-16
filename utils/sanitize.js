const MAX_LENGTH = 2048;

export function sanitize(input) {
  const sanitized = input.replace(/[^\w\s,.!?'"-]/g, "").slice(0, MAX_LENGTH);
  return sanitized;
}
