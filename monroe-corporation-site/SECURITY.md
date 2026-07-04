# Security Notes

The Monroe Corporation site is built for GitHub Pages, which is static hosting. The included Administrative Account System supports separate Monroe Corporation administrative accounts, but first-time registration requires verification through an Emerald Games account with `role: admin`.

## Current Access Flow

1. The administrator opens `admin.html`.
2. If they do not already have a Monroe Corporation administrative account, they use the registration form.
3. Registration verifies an Emerald Games account in the Firestore `users` collection.
4. The Emerald Games account must have a matching SHA-256 `passwordHash` and `role: admin`.
5. After verification, the site creates a Monroe Corporation administrative account in the `administrativeAccounts` collection.
6. Future logins use the Monroe Corporation administrative account only.

## Important Limitations

- Static files are public. Do not store private investigations, H.R. files, security notes, or internal reports directly in this repository.
- Client-side checks can hide an interface, but they are not a replacement for server-side authorization.
- SHA-256 password hashes without a salt are not recommended for production password storage.
- If Firestore rules allow public reads and writes so this static login can work, users may be able to inspect or attempt direct database operations.
- For stronger production security, use Firebase Authentication, custom admin claims, Firestore security rules, and/or a backend service such as a Cloudflare Worker.

## Expected Emerald Games user document fields

```js
{
  username: "ExampleAdmin",
  passwordHash: "sha256_hex_password_hash",
  role: "admin",
  role2: "Administrator"
}
```

Only `role: "admin"` can register a Monroe Corporation administrative account.

## Monroe Corporation administrative account fields

```js
{
  username: "ExampleAdministrator",
  usernameLower: "exampleadministrator",
  displayName: "Example Administrator",
  passwordHash: "sha256_hex_password_hash",
  role: "administrator",
  status: "active",
  enabled: true,
  emeraldUsername: "ExampleAdmin",
  emeraldUserId: "emerald_user_document_id",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  lastLoginAt: null
}
```

## Recommended Production Upgrade

For production, move registration and login checks into a backend endpoint or Cloudflare Worker. The backend should verify the Emerald Games admin account, create the administrative account, and return only a safe session token. Firestore rules should prevent direct public reads and writes to administrative records.
