export async function callAI(action: string, payload: any): Promise<string> {
  try {
    const res = await fetch(`/api/ai/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `AI request failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.text || '';
  } catch (err: any) {
    console.error(`Error executing AI action [${action}]:`, err);
    throw err;
  }
}
