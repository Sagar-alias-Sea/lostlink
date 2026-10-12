# LostLink — Smart Lost & Found Portal

> **"Lost Something? Let LostLink Find It."**  
> *Report, discover, verify, and recover lost belongings through one smart centralized platform.*

LostLink is a production-style, full-stack MVP designed for university campuses, corporate tech parks, airports, hospitals, transit terminals, and shopping venues. It replaces chaotic WhatsApp groups, torn paper notice boards, and manual logbooks with an automated, secure, and privacy-preserving recovery system.

---

## 1. The Core Lifecycle Workflow

LostLink operates strictly on the 6-stage recovery pipeline:

```
[ REPORT ] ➔ [ SEARCH ] ➔ [ MATCH ] ➔ [ CLAIM ] ➔ [ VERIFY ] ➔ [ RECOVER ]
```

1. **REPORT**: Users report lost belongings (generating `LL-LST-YYYY-XXXX`) or found items (`LL-FND-YYYY-XXXX`) with metadata and photos.
2. **SEARCH**: Real-time multi-filter directory (category, brand, location, color, date, keyword) with privacy safeguards (reporter phone and email are never made public).
3. **MATCH**: Transparent heuristic multi-factor scoring engine (Category, Brand, Keywords, Color, Location, Date Proximity) calculating confidence percentages (e.g., `85% Match`).
4. **CLAIM**: Claimants answer a mandatory 7-point ownership verification questionnaire and attach proof (invoice, warranty card, prior photograph, serial number).
5. **VERIFY**: Campus administrators review competing claims side-by-side in a **Multiple-Claim Comparison Matrix**, evaluating serial numbers and distinguishing marks before approving.
6. **RECOVER**: Official handover is logged in an immutable `RecoveryRecord` with verified photo ID reference.

---

## 2. Technology Stack & Architectural Decisions

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14+ (App Router)** | Full-stack architecture, Server Components, Route Handlers, fast SSR, zero configuration deployment. |
| **Language** | **TypeScript (Strict Mode)** | End-to-end type safety across database queries, APIs, and UI components. |
| **Styling & Icons** | **Tailwind CSS & Lucide React** | Blue/purple gradient theme, clean white cards, subtle shadows, responsive mobile navigation, status badges. |
| **Database & ORM** | **Prisma ORM with SQLite (Local) / PostgreSQL (Cloud)** | Zero-config local database (`dev.db`). Instantly switchable to Supabase, Neon, or Render PostgreSQL via `DATABASE_URL`. |
| **Authentication** | **JWT (HTTP-only Cookie) + Bcrypt** | Secure password hashing (`bcryptjs`), 7-day signed JWT sessions (`jose`), role-based middleware protection (`USER` vs `ADMIN`). |
| **Matching Algorithm** | **Heuristic Rule-Based Engine** | Multi-attribute weighted scoring (0–100%) with honest labeling (explicitly stating AI Computer Vision as future scope). |
| **File Storage** | **Local Disk / Public Uploads with MIME Validation** | Validates JPG, PNG, WEBP, and PDF up to 5MB with unique cryptographic filenames. |

---

## 3. Project Structure

```
Lost link/
├── prisma/
│   ├── schema.prisma         # Prisma relational schema (User, LostItem, FoundItem, Claim, Notification, RecoveryRecord)
│   ├── dev.db                # SQLite database (auto-generated)
│   └── seed.ts               # Realistic demo seed script
├── public/
│   └── uploads/              # Uploaded photos and evidence files
├── src/
│   ├── app/
│   │   ├── admin/page.tsx    # Admin Control Center (Analytics, Moderation, Multiple Claim Matrix)
│   │   ├── api/
│   │   │   ├── admin/        # Admin endpoints (stats, reports, claims, action, recover)
│   │   │   ├── auth/         # Auth endpoints (register, login, logout, me)
│   │   │   ├── claims/       # Claim submission and retrieval
│   │   │   ├── items/        # Lost and Found CRUD & public lookup
│   │   │   ├── matches/      # Heuristic match scoring
│   │   │   ├── notifications/# User notifications and read status
│   │   │   └── upload/       # File upload handler
│   │   ├── claim/[id]/       # 7-question ownership verification form
│   │   ├── dashboard/        # User personal dashboard with metrics & activity
│   │   ├── items/            # Public searchable lost & found directory
│   │   ├── items/[id]/       # Item details with privacy protection
│   │   ├── login/page.tsx    # Sign-in with 1-click demo login buttons
│   │   ├── my-reports/       # User's lost reports, found items, claims & matches
│   │   ├── notifications/    # Real-time in-app notification center
│   │   ├── register/page.tsx # User registration with validation
│   │   ├── report/found/     # Report found item form
│   │   ├── report/lost/      # Report lost item form
│   │   ├── globals.css       # Global styles & tailwind configuration
│   │   ├── layout.tsx        # Root layout with AuthProvider, Navbar & Footer
│   │   └── page.tsx          # Startup-quality landing page
│   ├── components/
│   │   ├── auth-context.tsx  # React Context for global auth state
│   │   ├── navbar.tsx        # Responsive navbar with notifications dropdown
│   │   └── footer.tsx        # Platform footer and trust badges
│   ├── lib/
│   │   ├── auth.ts           # Bcrypt & JWT verification helpers
│   │   ├── constants.ts      # Categories and color-coded status configurations
│   │   ├── matching.ts       # Heuristic rule-based matching engine
│   │   ├── prisma.ts         # Singleton Prisma client instance
│   │   └── utils.ts          # Report ID generators and notification helpers
│   └── middleware.ts         # Route protection for admin and authenticated areas
├── tests/
│   └── e2e-workflow.test.ts  # 25-step automated workflow verification suite
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

---

## 4. Demo Accounts & Credentials

The database is pre-seeded with realistic records and test users. In addition to manual login, the `/login` page includes **1-Click Demo Fill Buttons**:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@lostlink.org` | `Admin@12345` | Campus Security Admin. Access to Admin Portal, dispute resolution, and analytics. |
| **Demo User A** | `alex.chen@campus.edu` | `User@12345` | Student (Computer Science). Claimed OnePlus Buds with exact serial number and invoice. |
| **Demo User B** | `david.kim@campus.edu` | `User@12345` | Student (Management). Competing claimant for the same OnePlus Buds (demonstrates dispute resolution). |
| **Demo User C** | `priya.sharma@campus.edu` | `User@12345` | Central Library Staff. Reported found items in the library and cafeteria. |

---

## 5. Multiple-Claims Dispute Demonstration

A core requirement is ensuring multiple people claiming the same item are safely moderated:

1. In the demo dataset, **Found Item `LL-FND-2026-0001`** (*OnePlus Nord Buds 2*) has been claimed by **both Alex Chen and David Kim**.
2. The item is automatically flagged with status:
   `MULTIPLE CLAIMS — ADMIN REVIEW REQUIRED`.
3. Log in as **Admin** (`admin@lostlink.org`), navigate to **Admin Panel ➔ Claim Verification & Disputes**.
4. The system renders the **Side-by-Side Verification Factor Comparison Matrix**:
   - Compares: Stated Model, Loss Location, Loss Time, Serial Number, Unique Scratch Marks, and Uploaded Receipts.
5. The Admin clicks **Approve Claim** on Alex Chen.
6. The system automatically:
   - Marks Alex Chen's claim as `APPROVED`.
   - Automatically marks David Kim's competing claim as `REJECTED` with an explanatory note.
   - Updates the Found Item to `READY_FOR_RECOVERY`.
   - Sends in-app notifications to both claimants.
7. Click **Mark Ready / Complete Handover** to log the official ID-verified recovery in `RecoveryRecord`.

---

## 6. Heuristic Matching Algorithm (Rule-Based)

LostLink calculates similarity scores (0–100%) between reported lost and found items based on:

- **Category Match**: +30%
- **Brand Equality**: +20%
- **Title / Model Keyword Overlap**: +20% (tokenized Jaccard similarity)
- **Color Match**: +15%
- **Location Similarity**: +10%
- **Date Proximity**: +5% (loss occurred within 14 days of discovery)

> *Note: LostLink clearly identifies this as rule-based heuristic matching. AI Computer Vision image matching is displayed in the UI as a transparent "Coming Soon in v2.0" feature.*

---

## 7. Environment Variables

Create `.env` based on `.env.example`:

```env
# Local SQLite default (zero-config)
DATABASE_URL="file:./dev.db"

# Or Cloud PostgreSQL (Supabase, Neon, Render)
# DATABASE_URL="postgresql://user:password@host:5432/lostlink?schema=public"

# JWT Secret Key
JWT_SECRET="lostlink-super-secure-production-jwt-secret-key-2026"

# App Public URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 8. Quickstart Guide (Local Development)

### Prerequisites
- Node.js v18+ (v20+ recommended)
- npm or pnpm

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database & Seed Data
```bash
# Push schema to SQLite
npx prisma db push

# Seed realistic demo users, items, disputes, and notifications
npm run db:seed
```

### 3. Run Automated Tests
```bash
npx tsx tests/e2e-workflow.test.ts
```
*(All 25 test assertions will verify end-to-end functionality).*

### 4. Start the Application
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 9. Deployment Guide

### Deploying to Vercel (Recommended)
1. Push repository to GitHub/GitLab.
2. Link repository in Vercel.
3. In Project Settings ➔ Environment Variables, add:
   - `DATABASE_URL`: Your cloud PostgreSQL connection string (from Supabase, Neon, or Railway).
   - `JWT_SECRET`: A secure random 32-character string.
4. Set Build Command: `prisma generate && next build`.
5. Deploy!

### Deploying to Render / Railway / Docker
For a full Node.js container with persistent SQLite or PostgreSQL:
```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 10. Future Scope & Innovation Roadmap
- **v2.0 AI Image Vision**: Deep vector embeddings comparing uploaded photos against found catalog.
- **v2.0 QR Code Smart Tags**: Pre-printed QR stickers for student badges and laptops.
- **v2.1 Native Mobile App**: iOS & Android apps with push notifications and barcode scanning.
- **v2.2 Multi-Organization Federation**: Cross-campus network allowing search across neighboring universities and municipal transit.
