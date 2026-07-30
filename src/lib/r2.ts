import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

function getClient() {
  const endpoint = process.env.R2_ENDPOINT;
  if (!endpoint) throw new Error('Missing R2_ENDPOINT');
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

function getBucket() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('Missing R2_BUCKET_NAME');
  return bucket;
}

export async function uploadFile(key: string, buffer: Buffer, contentType: string) {
  const upload = new Upload({
    client: getClient(),
    params: {
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    },
  });
  await upload.done();
}

export async function downloadFile(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  const response = await getClient().send(command);
  return Buffer.from(await response.Body!.transformToByteArray());
}

export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  await getClient().send(command);
}
