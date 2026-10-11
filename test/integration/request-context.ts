// What `next/headers` returns inside a test: the headers of the request the
// test is currently sending. Route handlers read auth from here, as in Next.
let current = new Headers();

export function setRequestHeaders(headers: Headers) {
  current = headers;
}

export function requestHeaders() {
  return current;
}
