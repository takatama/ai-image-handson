export function verifyOrigin(context) {
  const { request, env } = context;
  const allowedOrigin = env.ALLOWED_ORIGIN;
  const origin = request.headers.get("Origin");
  if (allowedOrigin !== origin) {
    console.error(
      `許可されていないOriginです。origin=${origin}, allowedOrigin=${allowedOrigin}`
    );
    return new Response("Forbidden", { status: 403 });
  }
  return context.next();
}
