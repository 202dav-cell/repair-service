-- DAV Service: client social networks
-- Adds optional social-network contact information to clients.

alter table public.clients
add column if not exists social_networks text;
