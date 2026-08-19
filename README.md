# Ticket Management Application (سامانه مدیریت تیکت و پشتیبانی)

An enterprise-grade Ticket & Support Management application built with Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS, Radix UI, next-intl (bilingual English/Persian with RTL support), and a centralized typed API layer connected to the live backend API.

---

## 1. Application Overview

The system provides tailored experiences for two distinct user roles:

### 1.1 Ticket Issuer / Regular User (`roleId: 2` or `roleName: "user"`)
- **Dashboard**: Real-time summary KPI cards (Total, Pending Review, In Progress, Closed) and recent group tickets.
- **Create Ticket**: Category selection (`GET /api/ticket-groups`), subject, multi-line description, and file attachment support (`multipart/form-data`).
- **Ticket Details & Timeline**: Full conversation history distinguishing user and support responder messages.
- **Reply**: Send text replies with optional attachment files.
- **Close Ticket**: Safely close active tickets with confirmation dialog.
- **1–5 Star Rating**: When a ticket is closed and unrated, the issuer can rate the responder's support quality.

### 1.2 Support Responder / Admin (`roleId: 1` or `roleName: "admin"`)
- **Responder Dashboard**: Support-wide metrics, **Attention-Required** priority queue (open/pending tickets), and recent activity.
- **Ticket Management**: Full ticket list with search, status filtering, and server-side pagination.
- **Reply & Attachment**: Professional support responses with attachments.
- **Change Status**: Direct status transitions (`در انتظار بررسی`, `در حال بررسی`, `در حال انجام`, `خوانده شده`, `بسته شده`).
- **Close Ticket**: Close tickets with confirmation dialog.
- **Groups Directory**: View all active organizational user groups and ticket categories.

---

## 2. Group Isolation Rule

- **Strict 1:1 Mapping**: Every user belongs to exactly one user group (`userGroupId`).
- **Group Visibility**: Normal users only see tickets created within their authorized group.
- **Responder Context**: Responders manage tickets for groups authorized by the backend API.
- **Backend Authority**: Frontend adheres to group isolation while relying on backend JWT authorization as the ultimate security boundary.

---

## 3. Technology Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript (strict mode, zero `any` compromises)
- **UI & Styling**: Tailwind CSS, Radix UI primitives (`@radix-ui/react-dialog`), Lucide Icons
- **Internationalization**: `next-intl` (English `en` & Persian `fa` with automatic RTL layout)
- **State & Architecture**: Server Components for data fetching, Server Actions for mutations, typed client/server fetch wrappers
- **Validation**: Zod + React Hook Form

---

## 4. Getting Started & Environment Configuration

### 4.1 Prerequisites
- Node.js 20+
- pnpm

### 4.2 Installation

```bash
pnpm install
```

### 4.3 Environment Variables

Create `.env.local` (copied from `.env.example`):

```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Ticket Management System"

# Backend API Configuration
API_BASE_URL=http://192.168.77.30:6040
NEXT_PUBLIC_API_URL=http://192.168.77.30:6040
API_TIMEOUT_MS=15000

# Authentication Cookie Secrets & TTLs
AUTH_SECRET=ticket-management-secret-key-32charsmin!
AUTH_ACCESS_TOKEN_TTL=86400
AUTH_REFRESH_TOKEN_TTL=2592000
```

### 4.4 Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000/](http://localhost:3000/) in your browser.

---

## 5. User Roles

| Role | User Group Access | Description |
| :--- | :--- | :--- |
| **Responder / Admin** | All Groups | Support agent with status management and organization-wide ticket visibility |
| **Ticket Issuer / User** | Group-Isolated | Regular user with group-isolated ticket creation and rating capabilities |

---

## 6. Backend API Integration Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user credentials, returns JWT Bearer token & user profile |
| `GET` | `/api/auth/me` | Fetch authenticated user identity and group info |
| `GET` | `/api/ticket-groups` | Retrieve ticket category list |
| `GET` | `/api/user-groups` | Retrieve organizational user groups list |
| `GET` | `/api/tickets?status=&search=&page=&pageSize=` | Retrieve paginated tickets with server-side filtering |
| `POST` | `/api/tickets` | Create ticket (`multipart/form-data`: `TicketGroupId`, `TicketSubject`, `TicketDescription`, `attachment`) |
| `GET` | `/api/tickets/{id}` | Retrieve ticket details, initial description, and replies timeline |
| `POST` | `/api/tickets/{id}/reply` | Reply to ticket (`multipart/form-data`: `Text`, `attachment`) |
| `POST` | `/api/tickets/{id}/close` | Close ticket |
| `POST` | `/api/tickets/{id}/status` | Update ticket status (`{ status: string }`) |

> [!NOTE]
> **Rating Endpoint Status**:
> The backend API currently returns `404` for rating submissions (`POST /api/tickets/{id}/rating`).
> The frontend rating module (`src/lib/api/ratings.ts` and `TicketRating`) has been cleanly isolated with full 1–5 star interactive UI, accessible keyboard support, and status guards. When the backend deploys the rating endpoint, it will plug in directly without code restructuring.

---

## 7. Quality & Verification Commands

| Command | Action |
| :--- | :--- |
| `pnpm typecheck` | Run strict TypeScript compiler verification (`tsc --noEmit`) |
| `pnpm lint` | Run ESLint static analysis |
| `pnpm lint:fix` | Automatically fix ESLint formatting and import sorting |
| `pnpm build` | Create optimized Next.js production build |
| `pnpm start` | Start the production server |
