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

The `admin.html` page verifies an Emerald Games account in Firestore. It checks:

1. The account exists in the `users` collection.
2. The entered password matches the account's SHA-256 `passwordHash`.
3. The account has `role: "admin"`.

The expected Firestore user document fields are:

```js
{
  username: "ExampleAdmin",
  passwordHash: "sha256_hex_password_hash",
  role: "admin",
  role2: "Administrator"
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

## Security Warning

This is a static GitHub Pages site. The included admin system protects the visible interface, but public repository files remain public. Do not store private investigations, H.R. files, security records, or confidential Monroe Corporation documents directly in the repo.

For stronger protection, use Firebase Authentication with custom admin claims and Firestore rules, or a backend service such as a Cloudflare Worker.

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
