export function verifyOrigin(context) {
  const { request, env } = context;
  const allowedOrigin = env.ALLOWED_ORIGIN;
  const origin = request.headers.get("Origin");
  const secFetchSite = request.headers.get("Sec-Fetch-Site");
  if (allowedOrigin !== origin) {
    console.error(
      `許可されていないOriginです。origin=${origin}, allowedOrigin=${allowedOrigin}`
    );
    return new Response("Bad Request", { status: 400 });
  }
  if (secFetchSite && secFetchSite !== "same-origin") {
    console.error(`Fetch Metadataが不正です。Sec-Fetch-Site: ${secFetchSite}`);
    return new Response("Bad Request", { status: 400 });
  }
  return context.next();
}
