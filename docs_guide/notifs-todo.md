# Notifications Delete-All Backend Handoff

This guide summarizes what remains for the next developer to wire the Supabase backend for the new "Delete all notifications" UI in both Admin and Customer contexts.

## Current UI State

- `src/shared/components/ui/MarkAllReadButton.tsx` and `DeleteAllNotificationsButton.tsx` expose the actions.
- Confirm dialogs live in:
  - Admin: `src/admin/pages/Dashboard.tsx`
  - Customer dropdown: `src/shared/components/feedback/Notification.tsx`
- Both modals now:
  - Close the dropdown/card, show a confirmation modal with loading state & "Yes, delete all" CTA.
  - Simulate deletion with a temporary delay, update local state, and trigger success toast (or error toast).

## Backend Responsibilities

1. **Create delete-all action**
   - Add a new utility in `src/shared/utils/notificationUtils.ts` (or similar) to call Supabase:
     ```ts
     export async function deleteAllNotifications(
       userId: string
     ): Promise<void> {
       const { error } = await supabase
         .from('notifications')
         .delete()
         .eq('customer_id', userId);
       if (error) throw error;
     }
     ```
   - Ensure the function only operates on records scoped by `customer_id` (owner).

2. **Update handlers**
   - Admin: inside `handleConfirmDeleteAll` in `Dashboard.tsx`, call `deleteAllNotifications(user.id)` before mutating state.
   - Customer: in `handleConfirmDeleteAll` within `Notification.tsx`, call `deleteAllNotifications(user.id)` (the file already has `user` in state).
   - Handle promise failures by showing `toast.error('Delete failed', error.message)` and keeping the modal open.

3. **Modal loading states (optional but recommended)**
   - Disable buttons while awaiting Supabase response or show inline spinner.

## Required RLS Policies

Table: `public.notifications`

1. **Enable RLS** if not already enabled.
2. **Policy: delete own notifications**
   ```sql
   create policy "Users delete own notifications"
   on public.notifications
   for delete
   using (auth.uid() = customer_id);
   ```
3. **Existing policies**
   - The current mark-all-read functionality already updates rows, so the required `SELECT` and `UPDATE` policies are presumed to be in place. Verify in Supabase before creating anything new.

## Manual Verification Checklist

- [ ] RLS enabled on `public.notifications` and policies deployed.
- [ ] Supabase service role not required; client JWT can perform delete on own rows.
- [ ] Admin delete-all handler awaits Supabase mutation and handles errors.
- [ ] Customer dropdown delete-all handler awaits Supabase mutation and handles errors.
- [ ] Success toast fires only after Supabase confirms deletion.
- [ ] Error toast fires if Supabase returns an error; modal remains open for retry.
- [ ] Local state updates (`setNotifications([])`, `setUnreadCount(0)`, pagination reset) occur after successful deletion.
- [ ] Real-time listeners (if active) handle the empty state gracefully.

Once these items are complete, the UI will fully respect backend data integrity and security rules.
