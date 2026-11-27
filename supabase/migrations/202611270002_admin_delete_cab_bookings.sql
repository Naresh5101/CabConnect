grant delete on public.customer_requests to authenticated;

drop policy if exists "driver admins delete cab bookings" on public.customer_requests;
create policy "driver admins delete cab bookings" on public.customer_requests
for delete to authenticated
using (public.is_driver_admin() and request_type = 'cab_booking');
