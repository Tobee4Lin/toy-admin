// Local file upload utility (replaces @lark-apaas/client-toolkit/dataloom)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.json();
}
