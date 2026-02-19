-- Block anon reads on waitlist (only service role should read)
create policy "Only service role can read waitlist" on public.waitlist for select using (false);

-- Block anon deletes/updates on waitlist
create policy "No anon updates on waitlist" on public.waitlist for update using (false);
create policy "No anon deletes on waitlist" on public.waitlist for delete using (false);
