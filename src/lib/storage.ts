import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export async function uploadFile(key: string, buffer: Buffer, _contentType: string) {
  const blob = new Blob([buffer as unknown as BlobPart]);
  const file = new File([blob], key);
  const result = await utapi.uploadFiles(file);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function deleteFile(key: string) {
  await utapi.deleteFiles(key);
}
