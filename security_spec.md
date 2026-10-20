# Security Specification - EduShare Hub

## 1. Data Invariants
- **Users**:
  - Only the user can create their own profile document (`request.auth.uid == userId`).
  - Users cannot escalate their own role to 'admin' or 'moderator' upon creation (default role must be 'member' unless matching bootstrap admin email `s6710380111@pkru.ac.th`).
  - Admins can manage any user's role or status.
  - Normal users cannot alter their own `role` or `status`.
- **Resources**:
  - Anyone can read published resources (`status == 'published'`).
  - Admins / moderators can read hidden or deleted resources.
  - Authenticated users can create a resource with `authorId == request.auth.uid`.
  - The resource author can update their own resource, or Admin/Moderator can update status/fields.
  - Only author or admin can delete.
- **Favorites**:
  - Users can only read and write their own favorites (`userId == request.auth.uid`).
- **Reports**:
  - Authenticated users can create reports with `reporterId == request.auth.uid`.
  - Only Admins and Moderators can view and update report status.
- **ModerationLogs**:
  - Only Admins and Moderators can view and create moderation logs.
- **Settings**:
  - Everyone can read settings.
  - Only Admins can create or update site settings.

## 2. The Dirty Dozen Payloads
1. **Self-Role Escalation**: Normal user attempts to register with role "admin".
2. **Ghost Field Injection**: Attempt to write undocumented arbitrary field `isSuperGod: true` to `/users/{uid}`.
3. **Impersonated Resource Author**: User A posts a resource with `authorId: "UserB"`.
4. **ID Poisoning Attack**: Resource creation targeting `/resources/` with invalid ID containing path traversal characters.
5. **Unauthorized Status Modification**: Member attempts to set resource status to "deleted" on another user's post.
6. **Denial of Wallet Payload**: Submitting a resource with a 50MB description payload string.
7. **Favorite Hijack**: User A creating a favorite document with `userId: "UserB"`.
8. **Unauthorized Report Inspection**: Regular member attempting to list/read all moderation reports.
9. **Tampering with Moderation Log**: Regular user attempting to delete or insert audit records.
10. **Admin Settings Overwrite**: Unauthenticated user attempting to modify `/settings/siteConfig`.
11. **Unverified Email Privilege**: Unverified email user attempting privileged admin actions.
12. **Favorite Cross-Deletion**: User A attempting to delete User B's favorite bookmark.
