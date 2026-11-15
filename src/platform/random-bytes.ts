// crypto.getRandomValues fills at most this many bytes per call.
const maxBytesPerCall = 65_536;

/** n random bytes from the browser's cryptographic generator. */
export function randomBytes(n: number): Uint8Array {
  const bytes = new Uint8Array(n);
  for (let start = 0; start < n; start += maxBytesPerCall) {
    crypto.getRandomValues(bytes.subarray(start, Math.min(start + maxBytesPerCall, n)));
  }
  return bytes;
}
