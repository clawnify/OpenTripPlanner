let _bucket: R2Bucket;

export function initUploads(bucket: R2Bucket) {
  _bucket = bucket;
}

export async function putUpload(
  filename: string,
  data: ArrayBuffer | Uint8Array,
  contentType: string,
): Promise<string> {
  await _bucket.put(filename, data, { httpMetadata: { contentType } });
  return `/api/uploads/${filename}`;
}

export async function getUpload(
  filename: string,
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "");
  const obj = await _bucket.get(safe);
  if (!obj) return null;
  return {
    data: await obj.arrayBuffer(),
    contentType: obj.httpMetadata?.contentType || "application/octet-stream",
  };
}

export async function deleteUpload(filename: string): Promise<void> {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "");
  await _bucket.delete(safe);
}
