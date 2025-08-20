// utils/apiClient.js

const API_BASE = "https://mynk-rag-api.vercel.app";

/**
 * Helper fetch wrapper with timeout and retry for rate limits (429).
 * @param {string} url
 * @param {object} options
 * @param {number} retries number of retry attempts
 */
async function fetchWithRetry(
  url,
  options = {},
  retries = 3,
  timeoutMs = 20000
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      if (response.status === 429) {
        if (attempt === retries) {
          throw new Error("Rate limit exceeded, please try again later.");
        }
        // Exponential backoff delay before next retry
        await new Promise(r => setTimeout(r, 1000 * 2 ** attempt));
        continue;
      }
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status} — ${text.slice(0, 300)}`);
      }
      return response;
    } catch (err) {
      clearTimeout(id);
      if (err.name === "AbortError") {
        if (attempt === retries)
          throw new Error("Request timeout, please try again.");
        await new Promise(r => setTimeout(r, 1000 * 2 ** attempt));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Uploads a single file with sessionId to the backend.
 * @param {File} file
 * @param {string} sessionId
 */
export async function uploadFile(file, sessionId) {
  const form = new FormData();
  form.append("sessionId", sessionId);
  form.append("file", file);

  const res = await fetchWithRetry(`${API_BASE}/api/upload`, {
    method: "POST",
    body: form,
  });

  // Backend sometimes returns non-JSON, so just return text or success
  return await res.text();
}

/**
 * Sends a query to the backend with question, sessionId, and optional files array.
 * @param {string} question
 * @param {string} sessionId
 * @param {string[]} files
 */
export async function askQuestion(question, sessionId, files = []) {
  const body = JSON.stringify({ question, sessionId, files });

  const res = await fetchWithRetry(`${API_BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { answer: text };
  }
  return data;
}
