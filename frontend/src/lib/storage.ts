import "server-only";

const baseUrl = () => {
  const value = process.env.SUPABASE_URL;
  if (!value) throw new Error("SUPABASE_URL is missing from the server environment.");
  return value.replace(/\/$/, "");
};
const key = () => {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing from the server environment.");
  return value;
};
const headers = () => ({ authorization: `Bearer ${key()}`, apikey: key() });
const objectUrl = (bucket: string, path: string) => `${baseUrl()}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;

export async function uploadStorageFile(bucket: string, path: string, body: BodyInit, contentType: string) {
  const response = await fetch(objectUrl(bucket, path), { method: "POST", headers: { ...headers(), "content-type": contentType, "x-upsert": "true" }, body });
  if (!response.ok) throw new Error(`Unable to upload file: ${await response.text()}`);
}
export async function downloadStorageFile(bucket: string, path: string) {
  const response = await fetch(objectUrl(bucket, path), { headers: headers() });
  if (!response.ok) return null;
  return response;
}
export async function deleteStorageFile(bucket: string, path: string) {
  const response = await fetch(`${baseUrl()}/storage/v1/object/${bucket}`, { method: "DELETE", headers: { ...headers(), "content-type": "application/json" }, body: JSON.stringify({ prefixes: [path] }) });
  if (!response.ok) throw new Error(`Unable to delete file: ${await response.text()}`);
}
export function publicStorageUrl(bucket: string, path: string) { return `${baseUrl()}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`; }
export async function signedStorageUrl(bucket: string, path: string, expiresIn = 300) {
  const response = await fetch(`${baseUrl()}/storage/v1/object/sign/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`, { method: "POST", headers: { ...headers(), "content-type": "application/json" }, body: JSON.stringify({ expiresIn }) });
  if (!response.ok) throw new Error(`Unable to sign file URL: ${await response.text()}`);
  const result = await response.json() as { signedURL: string };
  return `${baseUrl()}/storage/v1${result.signedURL}`;
}
