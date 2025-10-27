import { FAST_API_BASE_URL } from "@/config/secrets";

interface FastApiReplyResponse {
  text?: string;
  detail?: string;
}

export async function fetchFastApiReply(message: string): Promise<string> {
  const trimmedBaseUrl = FAST_API_BASE_URL.replace(/\/$/, "");

  try {
    const response = await fetch(`${trimmedBaseUrl}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = (await response.json().catch(() => ({}))) as FastApiReplyResponse;

    if (!response.ok) {
      const errorMessage = data.detail || data.text || response.statusText;
      throw new Error(errorMessage || "Failed to fetch data from FastAPI backend.");
    }

    if (!data.text) {
      throw new Error("FastAPI response did not include any data.");
    }

    return data.text;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unable to connect to FastAPI backend.");
  }
}
