export function getProxyFetch(): typeof fetch {
  // Centralize fetch so Gemini/OpenAI-compatible SDK calls can later respect a
  // corporate proxy, local tunnel, or custom retry wrapper from one place.
  return fetch;
}
