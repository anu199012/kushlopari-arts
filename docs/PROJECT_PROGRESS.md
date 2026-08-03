# Kushalopari Arts — Project Progress Document

**Last updated:** 3 August 2026  
**Owner / GitHub:** anu199012 (`anu.kampati@gmail.com`)  
**Repo:** https://github.com/anu199012/kushlopari-arts  
**Live site:** https://kushalopariarts.in/  
**Admin:** https://kushalopariarts.in/admin  
**Firebase project:** `kushalopariarts-e5d7f` (Blaze plan)

This document summarizes what we built, which languages and tools we used, and how the system is set up today.

---

## 1. What this project is

**Kushalopari Arts** is an artist portfolio / gallery website for Dileep Kampati. Visitors browse art categories (sketching, blood art, watercolor, string art, etc.), open galleries, and can contact via WhatsApp to order. An authenticated **admin** area lets the owner upload, replace, and delete cover/gallery images.

The product is primarily a **web app** (also built with React Native / Expo so the same codebase can target mobile later).

---

## 2. Languages used

| Language | Where / why |
|----------|-------------|
| **TypeScript** | App screens, components, Firebase helpers (`app/`, `components/`, `src/`, `hooks/`) |
| **TSX / JSX** | React Native UI components and Expo Router screens |
| **JavaScript** | Config / scripts (`babel.config.js`, `metro.config.js`, `eslint.config.js`, `scripts/`) |
| **JSON** | Project config (`package.json`, `app.json`, `firebase.json`, `tsconfig.json`) |
| **YAML** | CI/CD (`.github/workflows/firebase-hosting.yml`) |
| **Firebase Rules DSL** | `firestore.rules`, `storage.rules` |
| **HTML** | Web shell / icon fallbacks (`app/+html.tsx`, `public/`) |
| **CSS** (via StyleSheet) | React Native `StyleSheet` for layout and theming |

---

## 3. Tools & platforms used

### Development

| Tool | Purpose |
|------|---------|
| **Cursor** | AI-assisted coding IDE used to build and ship features |
| **VS Code / Cursor editor** | Editing TypeScript/React Native code |
| **Node.js + npm** | Package install, local scripts, Expo CLI |
| **Expo** (`expo`, `expo-router`) | App framework, routing, web export |
| **TypeScript** | Typed app code |
| **ESLint** (`eslint-config-expo`) | Linting |
| **Git + GitHub** | Source control and PRs |
| **GitHub Desktop** | Optional local Git UI |
| **Chrome** | Testing the live/local site and Firebase / Cloud consoles |

### Backend / cloud

| Tool | Purpose |
|------|---------|
| **Firebase** | Hosting, Firestore, Auth, Storage |
| **Firebase CLI** (`firebase-tools`) | Deploy rules/hosting, project access |
| **Cloud Firestore** | Category documents (`imageUrl`, `images`, titles, order) |
| **Firebase Authentication** | Email/password admin login |
| **Firebase Storage** | New image uploads under `categories/{id}/…` |
| **Firebase Hosting** | Serves the Expo web build (`dist/`) |
| **Google Cloud Billing** | Blaze billing account “Firebase Payment” |
| **Google Cloud Budgets & alerts** | ₹500/month spend alert |

### CI / deploy

| Tool | Purpose |
|------|---------|
| **GitHub Actions** | On push to `main`: `npm ci` → `expo export --platform web` → `firebase deploy --only hosting` |
| **Workflow file** | `.github/workflows/firebase-hosting.yml` |
| **Secret** | `FIREBASE_TOKEN` in GitHub repo secrets |

### Domain / DNS

| Tool | Purpose |
|------|---------|
| **GoDaddy** | Domain registrar for `kushalopariarts.in` |
| **Firebase Hosting custom domain** | SSL + CDN for the live site |
| *(earlier)* **kushlopariarts.in** | Old custom domain; removed from Hosting |

### Design / product integrations

| Tool | Purpose |
|------|---------|
| **WhatsApp** | Order / enquiry FAB → number `918008794794` |
| **Facebook / Instagram** | Social links on Explore (`kushalopari`) |
| **Cloudinary** *(legacy)* | Older gallery image URLs still may exist; new uploads go to Firebase Storage |
| **Canvas API (browser)** | Client-side image compression before upload |

### Ops / monitoring

| Tool | Purpose |
|------|---------|
| **Firebase Console → Usage and billing** | Quotas for Firestore, Hosting, Storage |
| **Google Cloud Console → Budgets** | Alert budget **Kushalopari Arts 500r/ Month** (50% / 90% / 100%) |
| **Alert email** | `anu.kampati@gmail.com` |

---

## 4. Tech stack (libraries)

- **React 19** + **React Native 0.81** + **react-native-web**
- **Expo SDK ~54** + **Expo Router 6**
- **Firebase JS SDK v12** (Auth, Firestore, Storage)
- **React Navigation** (native stack / tabs packages)
- **react-native-gesture-handler**, **reanimated**, **safe-area-context**
- **expo-image**, **expo-linear-gradient**, **@expo/vector-icons** (Ionicons)

---

## 5. App structure (important folders)

```
kushlopari-arts/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout, brand splash, WhatsApp FAB
│   ├── (tabs)/
│   │   ├── index.tsx       # Home / category grid + search + MODULE_ORDER
│   │   └── explore.tsx     # About / social links
│   ├── category/[id].tsx   # Category gallery detail
│   └── admin/index.tsx     # Admin login + image manager
├── components/             # UI (header, splash, WhatsApp button, etc.)
├── src/
│   ├── firebaseConfig.ts   # Firebase app, auth, db, storage
│   ├── adminAuth.ts        # Admin sign-in / sign-out
│   ├── adminApi.ts         # Upload / cover / gallery CRUD helpers
│   └── imageCompress.ts    # Web JPEG compress before upload
├── firestore.rules         # Public read; auth write on categories
├── storage.rules           # Public read; auth write images < 3 MB
├── firebase.json           # Hosting + rules wiring
└── .github/workflows/      # Auto-deploy Hosting on main
```

---

## 6. What we did (timeline / features)

### Phase A — Foundation & hosting

- Scaffolded Expo Router app and connected **Firestore**.
- Fixed Firestore permissions, home category cards, and Firebase Hosting setup.
- Configured GitHub Actions to build Expo **web** into `dist/` and deploy Hosting.
- Fixed tabs, icons (Ionicons), search, babel/metro config, and web production icons.
- Fixed swipe / gestures (`GestureHandlerRootView`, pinch handler on web).

### Phase B — Branding & UX (PR #1)

**PR:** https://github.com/anu199012/kushlopari-arts/pull/1  

- Branding → **Kushalopari Arts**.
- Splash with artist image + name **“D I L E E P   K A M P A T I”**.
- Removed bottom-tab-heavy UX; hamburger / title → Explore.
- WhatsApp floating button with prefilled enquiry message.
- Search suggestions; cover photo prioritized on category detail.
- Domain work: connected **kushalopariarts.in** (GoDaddy DNS → Firebase), SSL; removed old **kushlopariarts.in** from Hosting.

### Phase C — Module order

- Hardcoded preferred category order on the home screen (`MODULE_ORDER`):  
  Rough Sketching → Realistic Pencil Potrait → Blood Art → … → String Art.  
- Client-side sort used because Firestore `order` writes were permission-denied from the client earlier.

### Phase D — Admin image manager (PR #2)

**PR:** https://github.com/anu199012/kushlopari-arts/pull/2  

- Auth-gated `/admin` (email/password).
- List categories; upload / replace **cover**; add **gallery** images; delete; make cover.
- Firestore + Storage security rules (auth required for writes).
- Enabled Firebase Storage on Blaze (`gs://kushalopariarts-e5d7f.firebasestorage.app`).
- Public empty gallery copy: **“Images coming soon.”**
- Splash / WhatsApp hidden on `/admin`.

### Phase E — Cost control (PR #3 + Cloud setup)

**PR:** https://github.com/anu199012/kushlopari-arts/pull/3  

- **Client-side image compression** before admin upload (canvas → JPEG, max dimension 1920, aim under ~2 MB).
- Clear **red error messages** if compression fails (“please compress…”).
- Storage write limit tightened to **3 MB** (rules deployed).
- Explained billing: Firebase charges for **storage + downloads (views)** + ops — not upload-only.
- Set Google Cloud budget alert ≈ **₹500/month** (`Kushalopari Arts 500r/ Month`, thresholds 50/90/100%).
- Checked Firebase Usage (example snapshot around Aug 2026): Firestore reads and Hosting usage well within free quotas; **no billing transactions yet**.

---

## 7. Security rules (current)

**Firestore** (`firestore.rules`):

- `categories`: anyone can **read**; only signed-in users can **write**.

**Storage** (`storage.rules`):

- `categories/{categoryId}/**`: anyone can **read**; signed-in users can **write** image files under **3 MB**; signed-in users can **delete**.

---

## 8. Deploy & environments

| Environment | URL / notes |
|-------------|-------------|
| Production | https://kushalopariarts.in/ |
| Admin | https://kushalopariarts.in/admin |
| Local web | `npm run web` → typically http://localhost:8081 |
| Deploy path | Push/merge to `main` → GitHub Action deploys Hosting |
| Rules deploy | `firebase deploy --only firestore:rules,storage` (when rules change) |

---

## 9. Merged pull requests

| PR | Title | Focus |
|----|--------|--------|
| [#1](https://github.com/anu199012/kushlopari-arts/pull/1) | Kushalopari UX updates | Splash, WhatsApp, nav, branding |
| [#2](https://github.com/anu199012/kushlopari-arts/pull/2) | Admin image manager | Auth uploads, rules, empty state |
| [#3](https://github.com/anu199012/kushlopari-arts/pull/3) | Compress admin uploads | Compress + 3 MB Storage limit |

---

## 10. Useful console links

- Firebase overview: https://console.firebase.google.com/project/kushalopariarts-e5d7f/overview  
- Usage & billing: https://console.firebase.google.com/project/kushalopariarts-e5d7f/usage  
- Budgets & alerts: https://console.cloud.google.com/billing/014043-DC449E-CD4DFB/budgets?project=kushalopariarts-e5d7f  

---

## 11. How to run locally

```bash
cd ~/Desktop/kushlopari-arts
npm install
npm run web
```

Admin: open `/admin`, sign in with the Firebase Auth email/password user created for this project.

---

## 12. Notes / known details

- New images → **Firebase Storage**; some older images may still be **Cloudinary** URLs.
- Home cards need full `https` download URLs in `imageUrl`, not bare Storage paths.
- Admin file upload is implemented for **web** (file picker).
- Compressing uploads reduces both **stored size** and **every visitor download** (main cost lever for a gallery).
- Untracked local junk should stay out of git (e.g. `firebase-debug.log`, `public/firebase-welcome.html.bak`).

---

*Document generated from the Kushalopari Arts codebase and work completed through August 2026.*
