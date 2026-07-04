# Monroe Corporation Website

This repository contains a professional static website for Monroe Corporation. It is designed for GitHub Pages and can be published without a build step.

## Pages Included

- `index.html` — Home page
- `about.html` — Company overview
- `divisions.html` — Corporate divisions and operating groups
- `governance.html` — Governance and standards
- `contact.html` — Contact page
- `admin.html` — Administrative Account System
- `404.html` — Custom not-found page

## Corporate Divisions Included

- Security Operations
- Internal Affairs — Investigations
- H.R.
- Monroe Entertainment Services
- Emerald Systems
- Monroe Technologies
- Monroe Intelligence Agency

## Files Included

- `styles.css` — Full responsive styling
- `script.js` — Mobile navigation and dynamic footer year
- `js/firebase.js` — Firebase connection file for the Emerald Games project
- `js/admin-auth.js` — Administrative Account System logic
- `assets/logo.svg` — Monroe Corporation SVG logo
- `assets/favicon.svg` — Browser favicon
- `CNAME` — Custom domain file for GitHub Pages
- `.nojekyll` — Prevents GitHub Pages from processing the site with Jekyll
- `robots.txt` and `sitemap.xml` — Basic search engine files
- `SECURITY.md` — Security notes for the admin system

## How the Administrative Account System Works

The `admin.html` page now has two flows:

1. **First-time registration**
   - The user enters an Emerald Games username and password.
   - The site checks the Emerald Games Firestore `users` collection.
   - The Emerald Games account must exist, the password must match `passwordHash`, and the account must have `role: "admin"`.
   - After verification, the user creates a separate Monroe Corporation administrative username and password.
   - The new administrative account is stored in the Firestore collection named `administrativeAccounts`.

2. **Normal administrative login**
   - The user signs in with the Monroe Corporation administrative username and password.
   - The Emerald Games password is not required after registration.
   - The administrative account must have `role: "administrator"`, `status: "active"`, and `enabled: true`.

## Expected Emerald Games user document fields

The Emerald Games `users` collection should include documents with these fields:

```js
{
  username: "ExampleAdmin",
  passwordHash: "sha256_hex_password_hash",
  role: "admin",
  role2: "Administrator"
}
```

The code supports either `users/{username}` document IDs or user documents with a `username` field.

## Administrative Account Document Format

New Monroe Corporation administrative accounts are stored in `administrativeAccounts/{usernameLower}`.

Example:

```js
{
  username: "wmonroe",
  usernameLower: "wmonroe",
  displayName: "Wyatt Monroe",
  passwordHash: "sha256_hex_password_hash",
  role: "administrator",
  status: "active",
  enabled: true,
  emeraldUsername: "Wmonroe01",
  emeraldUsernameLower: "wmonroe01",
  emeraldUserId: "emerald_games_user_document_id",
  emeraldRole: "admin",
  emeraldRole2: "Administrator",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  lastLoginAt: null
}
```

## Setup Required for Admin Verification

Open `js/firebase.js` and replace the placeholder Firebase configuration with the same Firebase project used by Emerald Games.

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## Important Security Warning

This is a static GitHub Pages site. The included admin system protects the visible interface, but public repository files remain public. Do not store private investigations, H.R. files, security records, or confidential Monroe Corporation documents directly in the repo.

Because this version follows the existing Emerald Games SHA-256 account pattern, it is best for a controlled prototype. For stronger production security, use Firebase Authentication with custom admin claims and Firestore rules, or route administrative registration and login through a trusted backend such as a Cloudflare Worker.

## How to Publish on GitHub Pages

1. Create a new GitHub repository, for example `monroe-corporation-site`.
2. Upload all files from this folder into the repository.
3. Go to **Settings** > **Pages**.
4. Under **Build and deployment**, set the source to **Deploy from a branch**.
5. Choose the `main` branch and `/root` folder.
6. Save.
7. For a custom domain, keep the included `CNAME` file set to `monroecorp.org`.

## Customization Notes

- Replace the email text in `contact.html` with the correct business email.
- Update division names and descriptions in `divisions.html` if needed.
- Update `sitemap.xml` if the domain or page list changes.
- The contact form currently uses `mailto:` because GitHub Pages does not process backend form submissions.
