# Security Specification

## Data Invariants
- Users can only access events they own.
- Only authenticated users can create or manage events.
- An event must always have an `ownerId` that matches the creator's UID.

## The "Dirty Dozen" Payloads
1. Create event with no `ownerId` (should be rejected).
2. Create event with `ownerId` set to another user's UID (should be rejected).
3. Attempt to update another user's event (should be rejected).
4. Attempt to list events belonging to another user (should be rejected).
5. Inject massive string into `title` field.
6. Inject invalid format (object instead of string) into `iban` field.
7. Attempt to set `createdAt` timestamp from client-side (should be rejected/overwritten).
8. Attempt to delete an event belonging to another user.
9. Attempt read access to `users` profile of another user.
10. Attempt to update `ownerId` field (must be immutable).
11. Attempt to create event with invalid ID format (not allowed by `isValidId`).
12. Attempt to update event status to terminal state without admin (if status logic exists).

## Test Plan
`firestore.rules.test.ts`
- Test `create` fail if `ownerId` != `request.auth.uid`.
- Test `update` fail if `ownerId` changed.
- Test `read` fail if `ownerId` != `request.auth.uid`.
