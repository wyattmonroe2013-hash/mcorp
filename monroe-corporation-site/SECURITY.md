# Security Notes

The Monroe Corporation site is built for GitHub Pages, which is static hosting. The included Administrative Account System verifies an Emerald Games account from Firestore and only displays the administrative interface when the account has `role: admin`.

Important limitations:

- Static files are public. Do not store private investigations, H.R. files, security notes, or internal reports directly in this repository.
- Client-side checks can hide an interface, but they are not a replacement for server-side authorization.
- The included login flow matches the existing Emerald Games account pattern using `users.username`, `users.passwordHash`, and `users.role`.
- For stronger production security, use Firebase Authentication, custom admin claims, and Firestore security rules, or route administrative actions through a trusted backend such as a Cloudflare Worker.

## Expected Emerald Games user document fields

The admin verification code expects the Firestore `users` collection to include documents with these fields:

```js
{
  username: "ExampleAdmin",
  passwordHash: "sha256_hex_password_hash",
  role: "admin",
  role2: "Administrator"
}
```

Only `role: "admin"` grants Monroe Corporation administrative access in the included system.
