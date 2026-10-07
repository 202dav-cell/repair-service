-- DAV Service: social networks for employees.
alter table public.profiles
add column if not exists social_networks text;
