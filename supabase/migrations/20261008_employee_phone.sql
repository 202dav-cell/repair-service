alter table public.profiles
  add column if not exists phone text;

comment on column public.profiles.phone is 'Phone number of employee';
