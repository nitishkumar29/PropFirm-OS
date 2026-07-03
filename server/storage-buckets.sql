insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', false),
  ('screenshots', 'screenshots', false),
  ('documents', 'documents', false),
  ('exports', 'exports', false)
on conflict (id) do nothing;
