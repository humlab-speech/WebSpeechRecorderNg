/**
 * CORS for the receiver. A development editor may be served from another port (`ng serve`), so the
 * headers must cover everything the write protocol uses, not just the simple requests:
 *
 * - `If-Match`/`If-None-Match` are request headers, so they belong in `Allow-Headers` or the
 *   browser refuses the preflight and a conditional draft write can never happen cross-origin.
 * - `X-Filename` is how a media upload names its file.
 * - `ETag` and `Location` are response headers, so they belong in `Expose-Headers` or the client
 *   cannot read the validator it must send back (and cannot find a created draft).
 * - The error envelope's own header and the idempotency key were already there.
 *
 * **With credentials the origin is never the request's.** Reflecting `Origin` while sending
 * `Access-Control-Allow-Credentials: true` lets any site make credentialed requests and read the
 * answers — CodeQL reports it as `js/cors-misconfiguration-for-credentials`, and the rule is right.
 * The operator names the origins it trusts with `--cors-origin`; an origin that is not one of them
 * gets no CORS headers at all — `Vary: Origin` stays, so a cache cannot hand a rejected origin a
 * response that was built for an allowed one.
 */
export const CORS_ALLOW_METHODS = 'GET, POST, PATCH, PUT, DELETE, OPTIONS';
export const CORS_ALLOW_HEADERS = 'Content-Type, Accept, Idempotency-Key, X-Requested-With, Authorization, If-Match, If-None-Match, X-Filename';
export const CORS_EXPOSE_HEADERS = 'Idempotency-Replayed, ETag, Location';

export function applyCors(req, res, opts) {
  if (!opts.cors) {
    return;
  }
  const origin = req.headers.origin;
  if (origin === undefined) {
    return;
  }
  res.setHeader('Vary', 'Origin');
  if (opts.credentials) {
    const allowed = opts.corsOrigins ?? [];
    if (!allowed.includes(origin)) {
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', CORS_ALLOW_METHODS);
  res.setHeader('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
  res.setHeader('Access-Control-Expose-Headers', CORS_EXPOSE_HEADERS);
  res.setHeader('Access-Control-Max-Age', '600');
}
