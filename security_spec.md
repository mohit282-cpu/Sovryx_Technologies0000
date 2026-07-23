# Security Specification: Sovryx Company OS Firestore Hardening

## 1. Data Invariants
1. **Authenticated Access**: Every write operation (unless specified) requires a authenticated user with a verified email.
2. **User Collection**: A user document under `/users/{userId}` can only be created by an authenticated user where `request.auth.uid == userId`.
3. **Role-Based Modification**: Only `CEO`, `Admin`, and `HR` roles (explicitly checked from `/users/{request.auth.uid}`) are permitted to write or edit user accounts.
4. **Self-Service Constraints**: An employee can only read/edit specific fields in their own user record (e.g., changing password/profile details, and reading their attendance/leave requests). They are strictly forbidden from modifying administrative roles or status fields.
5. **State Locking**: Terminated or suspended employee records are locked; no operations should proceed on inactive users unless overridden by an Admin/CEO.
6. **Immutable Fields**: `employeeId`, `createdAt`, and `createdBy` must remain unchanged after creation.
7. **Temporal Integrity**: `createdAt` and `updatedAt` must be validated against `request.time`.

## 2. The "Dirty Dozen" Payloads (Exploit Attempts)
1. **Role Escalation**: Employee attempts to elevate their own role to CEO.
2. **Identity Spoofing**: User A attempts to write a task assigning it to User B with User B's `ownerId` but signed in as User A.
3. **Status Hijacking**: Suspended employee attempts to mark their account as Active.
4. **Task/Project Creation by Employee**: Employee attempts to create or edit a project without privileges.
5. **Shadow Field Injection**: Writing a user document with undocumented "ghost" fields (e.g., `isSuperAdmin: true`).
6. **ID Poisoning**: Injecting 1MB junk string as a document ID to exhaust resources.
7. **PII Leakage Query**: Authenticated user attempts a blanket query of other employees' PII (phone/email) without restrictions.
8. **Bypassing Verification**: Logging in or writing data without a verified email token when verified is mandated.
9. **Relational Record Orphanage**: Creating a task with a project reference ID that doesn't exist in the database.
10. **State Inconsistency (Time Travel)**: Setting a future `createdAt` date rather than using the server's request timestamp.
11. **Unbounded List Exploitation**: Attempting to push millions of array indices to crash collection processing.
12. **Tampering with Terminal State**: Attempting to edit a rejected leave request to approved status after completion.

## 3. Test Cases (TDD Concept)
We will write the `firestore.rules` to reject all "Dirty Dozen" payloads. All tests should return `PERMISSION_DENIED` on these malicious writes.
