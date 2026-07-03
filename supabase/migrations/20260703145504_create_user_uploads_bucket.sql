-- Private storage bucket for generation input photos. Access is granted via
-- time-limited signed URLs, not public URLs; RLS restricts each user to a
-- folder named after their own auth.uid().

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-uploads',
  'user-uploads',
  false,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own uploads"
  on storage.objects for select
  using (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own uploads"
  on storage.objects for delete
  using (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
