const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: options.credentials || "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Unable to reach the server. Please try again.");
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || "The request could not be completed.");
  }

  if (!result?.success) {
    throw new Error(result?.message || "The server returned an invalid response.");
  }

  return result;
}
