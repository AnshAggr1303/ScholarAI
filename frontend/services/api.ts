const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function uploadPaper(file: File, sessionId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);

  const res = await fetch(`${API_URL}/papers/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload paper");
  }

  return res.json();
}

export async function sendMessage(
  sessionId: string,
  question: string
) {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      question,
    }),
  });

  if (!res.ok) {
    throw new Error("Chat request failed");
  }

  return res.json();
}