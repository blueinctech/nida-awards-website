// Shared S3 settings for the command-line scripts (the app uses src/lib/server/storage.ts, which
// follows the same rules). Works with Amazon S3 and S3-compatible stores like Neon Object Storage.
import { S3Client } from '@aws-sdk/client-s3';

export function s3Settings() {
  const env = process.env;
  const bucket = env.S3_BUCKET || '';
  const region = env.S3_REGION || env.AWS_REGION || (env.S3_ENDPOINT ? 'auto' : '');
  const accessKeyId = env.S3_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY || '';
  const publicBase = (env.S3_PUBLIC_URL || (env.S3_ENDPOINT ? '/uploads' : `https://${bucket}.s3.${region}.amazonaws.com`)).replace(/\/$/, '');
  const ready = Boolean(bucket && region && accessKeyId && secretAccessKey);
  return { bucket, region, accessKeyId, secretAccessKey, publicBase, ready, endpoint: env.S3_ENDPOINT || '' };
}

export function makeS3() {
  const s = s3Settings();
  return new S3Client({
    region: s.region,
    endpoint: s.endpoint || undefined,
    forcePathStyle: Boolean(s.endpoint),
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: { accessKeyId: s.accessKeyId, secretAccessKey: s.secretAccessKey },
  });
}

export const publicUrl = (key: string) => s3Settings().publicBase + '/' + key.split('/').map(encodeURIComponent).join('/');
