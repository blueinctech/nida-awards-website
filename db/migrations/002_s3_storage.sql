-- Uploads move from Vercel Blob to Amazon S3: allow the new 's3' storage kind.
-- 'blob' stays allowed so old rows remain valid until scripts/move-blob-to-s3.ts has moved them.
alter table media drop constraint if exists media_storage_check;
alter table media add constraint media_storage_check check (storage in ('static', 'blob', 'local', 's3'));
alter table nomination_files drop constraint if exists nomination_files_storage_check;
alter table nomination_files add constraint nomination_files_storage_check check (storage in ('blob', 'local', 's3'));
