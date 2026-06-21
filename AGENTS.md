# Binzo Project Guidelines

## Project Overview

**Binzo** is a rapid grocery delivery platform (10-minute delivery model). The project is split into frontend and backend services with cloud infrastructure provided by Supabase.

---

## Technology Stack

### Frontend

- **Framework:** React 19.2.6 with TypeScript
- **Build Tool:** Vite 8.0.12
- **Routing:** React Router DOM v7.17.0
- **Styling:** CSS Modules (scoped styling per component)
- **Icons:** FontAwesome Free v7.2.0
- **Dev Server:** Vite dev server on `http://localhost:5173`

### Backend

- **Framework:** NestJS (TypeScript-based Node.js framework)
- **Architecture:** Modular, dependency injection-based
- **Database:** Supabase PostgreSQL
- **File Storage:** Supabase Storage (S3-compatible)
- **API Pattern:** RESTful with potential GraphQL support

### Infrastructure & Database

- **Database:** Supabase PostgreSQL
- **Object Storage:** Supabase Storage (images, product photos, etc.)
- **Authentication:** Supabase Auth (optional, can be managed by backend)
- **Real-time:** Supabase Realtime for live features (delivery tracking, order updates)

---

## Project Structure

```
binzo/
├── frontend/                    # React + Vite application
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   ├── Navbar/          # Navigation + Account + Cart overlay
│   │   │   ├── CategoryCard/    # Product category tiles
│   │   │   ├── ProductCard/     # Individual product card
│   │   │   ├── ProductCarousel/ # Horizontal product slider
│   │   │   ├── PromoSection/    # Promotional banner
│   │   │   ├── Hero/            # Hero section
│   │   │   ├── Footer/          # Footer
│   │   │   └── ...
│   │   ├── pages/               # Page-level components (routed)
│   │   │   ├── HomePage.tsx     # Main landing page
│   │   │   ├── OrdersPage.tsx   # User order history
│   │   │   ├── ProductDetailsPage.tsx  # Product detail view
│   │   │   └── ...
│   │   ├── data/                # Static data, types, fixtures (e.g. products.ts)
│   │   ├── App.tsx              # Routes & app shell
│   │   └── main.tsx             # React DOM entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── ...
│
├── backend/                     # NestJS application (to be built)
│   ├── src/
│   │   ├── modules/             # Feature modules (auth, products, orders, etc.)
│   │   ├── common/              # Shared utilities, guards, interceptors
│   │   ├── database/            # Database migrations, seeds
│   │   └── main.ts              # App entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
│
└── AGENTS.md                    # This file

```

---

## Frontend Development Guidelines

### Component Structure

- **One component per folder** with `.tsx`, `.module.css`, and tests
- **CSS Modules** for scoping styles (e.g., `Navbar.module.css`)
- **Functional components** with React Hooks

### Styling Convention

- Use **CSS Modules** for component-scoped styles
- Global styles live in `src/index.css` (fonts, resets, body defaults)
- Responsive breakpoints: `1120px`, `720px`, `520px` (mobile-first where applicable)

### Routing

- Use React Router v7 (`useNavigate`, `useParams`, `Link`, `Routes`, `Route`)
- Page components live in `src/pages/`
- Register new routes in `src/App.tsx`
- Current routes:
  - `/` — HomePage
  - `/orders` — OrdersPage
  - `/product/:id` — ProductDetailsPage
- Navigation from components: `useNavigate()`. In-page links: `<Link to="...">`.

### State Management

- **Current:** React hooks only (`useState`, `useEffect`, `useRef`) — no Redux, Zustand, or Context yet
- **Local UI state** (dropdowns, overlays, scroll): keep in the component
- **Shared client state** (cart, auth — upcoming): start with Context; consider Zustand if it grows
- **Server state** (products, orders from API — upcoming): use TanStack Query, not a global store
- Do not introduce a state library unless the feature requires shared state across multiple pages

### API Integration

- **Endpoint base URL:** `http://localhost:3000/api` (backend default)
- Use **Fetch API** or a client library like **Axios** (to be decided)
- Supabase client can be used for real-time updates and direct DB queries (if needed)

### Development Commands

```bash
cd frontend
npm run dev        # Start dev server on localhost:5173
npm run build      # Production build
npm run lint       # ESLint checks
npm run preview    # Preview production build
```

---

## Backend Development Guidelines

### Technology

- **Framework:** NestJS with TypeScript
- **Database:** Supabase PostgreSQL (via TypeORM, Prisma, or Supabase client)
- **Storage:** Supabase Storage for file uploads
- **Port:** Default port 3000 (or configure in `.env`)

### Module Structure

Organize backend into feature modules:

- `AuthModule` — User authentication, login, registration
- `ProductModule` — Products, categories, inventory
- `OrderModule` — Orders, order history, status tracking
- `CartModule` — Shopping cart operations
- `UserModule` — User profile, addresses
- `PaymentModule` — Payment gateway integration (Stripe, Razorpay, etc.)

### Database Schema

Tables will be managed in Supabase. Migrations can be:

- SQL migrations in Supabase dashboard
- TypeORM/Prisma migrations (if chosen ORM)

### API Response Format

Standard JSON response format:

```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful",
  "timestamp": "2024-06-13T10:30:00Z"
}
```

### Real-time Features

- Use Supabase Realtime for live order tracking, delivery status
- Push notifications for order updates (via Firebase Cloud Messaging or similar)

---

## Database Schema Overview (Supabase)

### Key Tables

- `users` — User profiles, contact info, delivery addresses
- `products` — Product catalog with images, pricing, category
- `categories` — Product categories
- `orders` — Order history with totals, status, delivery details
- `order_items` — Items in each order
- `cart_items` — Active shopping cart items (optional, can be session-based)
- `addresses` — Saved delivery addresses per user
- `payments` — Payment records and transactions

Details to be finalized with backend team.

---

## Deployment & Environment

### Development

- **Frontend:** Vite dev server locally
- **Backend:** NestJS dev server locally
- **Database:** Supabase cloud (shared dev project)

### Production

- **Frontend:** Render (static site or web service)
- **Backend:** Render (web service)
- **Database:** Supabase (production tier)

---

## Code Standards

### TypeScript

- Strict mode enabled
- Use types for all function parameters and returns
- Export types when sharing between modules

### Naming Conventions

- **Components:** PascalCase (`Navbar`, `OrdersPage`)
- **Hooks:** camelCase with `use` prefix (`useNavigate`, `useContext`)
- **CSS Classes:** camelCase (`cartButton`, `orderCard`)
- **File names:** Match component name or kebab-case for utilities

### Imports

- Relative imports from sibling/parent folders (e.g. `../components/Navbar/Navbar`)
- Import CSS Modules as `styles` from `./ComponentName.module.css`
- Import Font Awesome via global CSS in `main.tsx` — use `<i className="fa-solid fa-...">` in JSX

---

## Code Writing Guide

This section is for AI agents and contributors writing code in this repo. **Read surrounding files before editing.** Match existing patterns rather than introducing new conventions.

### Core Principles

1. **Minimize scope** — Make the smallest correct change. Do not refactor unrelated code, add unused abstractions, or expand beyond what was asked.
2. **Follow existing conventions** — Naming, file layout, styling, and import style should match neighboring files.
3. **Avoid over-engineering** — No premature libraries, helpers, or abstractions. Inline simple logic; extract only when reused or clearly complex.
4. **Comments sparingly** — Code should be self-explanatory. Comment only non-obvious business logic.
5. **Tests when meaningful** — Add tests when requested or when covering real behavior. Skip trivial assertions.
6. **Verify before finishing** — Run `npm run build` and `npm run lint` in `frontend/` after substantive changes.

### Frontend: File & Folder Layout

**Reusable UI** → `frontend/src/components/ComponentName/`

```
ComponentName/
├── ComponentName.tsx
└── ComponentName.module.css
```

**Routed views** → `frontend/src/pages/`

```
pages/
├── PageName.tsx
└── PageName.module.css   # optional; add when page-specific styles are needed
```

**Shared static data & types** → `frontend/src/data/`

```
data/
└── products.ts           # types, mock data, lookup helpers
```

**Routes** → register in `frontend/src/App.tsx` only.

### Frontend: React & TypeScript Patterns

- Use **functional components** with hooks. No class components.
- Use **`type` for props** (not `interface` unless matching an existing file):
  ```tsx
  type ProductCardProps = {
    productId: string;
    title: string;
    price: number;
  };
  ```
- **Default export** the component at the bottom of the file.
- Name props types as `ComponentNameProps`.
- Export shared domain types from `src/data/` or a dedicated types file — not from components.
- Prefer explicit types on props and function params. Avoid `any`.
- Use optional chaining and nullish coalescing where data may be missing (e.g. route params, API responses).

**Page composition pattern** — pages assemble components; they stay thin:

```tsx
const HomePage = () => (
  <>
    <Navbar />
    <Hero />
    <ProductSection />
    <Footer />
  </>
);
```

**Interactive components** — extract handlers with clear names; use functional `setState` updates:

```tsx
const openProductDetails = () => navigate(`/product/${productId}`);

onClick={() => setQuantity((current) => Math.max(1, current - 1))}
```

**Route params** — use `useParams<{ id: string }>()` and handle missing/invalid data with an early return (see `ProductDetailsPage.tsx`).

**Reset local state when route data changes** — use `useEffect` keyed on the loaded entity:

```tsx
useEffect(() => {
  if (!product) return;
  setSelectedUnitId(product.units[0].id);
  setQuantity(1);
}, [product]);
```

### Frontend: CSS Modules

- One `.module.css` file per component/page that needs scoped styles.
- Import as: `import styles from "./ComponentName.module.css"`
- Class names: **camelCase** (`.cartButton`, `.unitGrid`, `.priceRow`)
- Apply classes: `className={styles.cartButton}`
- Conditional classes:
  ```tsx
  className={`${styles.unitButton} ${isSelected ? styles.unitButtonSelected : ""}`}
  ```
- Do **not** set `font-family` in component CSS unless overriding for branding — Inter is inherited globally.
- Use **media queries** at project breakpoints: `1120px`, `720px`, `520px`
- Prefer flexbox/grid layouts already used in the codebase.
- Common radii: `12px`–`14px` for cards/buttons; `50%` for circular icon buttons.

### Typography

| Usage | Font | Where set |
|-------|------|-----------|
| All UI text, buttons, inputs | **Inter** (400, 500, 700, 800) | `src/index.css` — inherited globally |
| Logo ("Binzo") and footer branding | **Lobster** | `Navbar.module.css`, `Footer.module.css` only |

Do not introduce additional fonts without explicit approval.

### Design Tokens (use these consistently)

| Token | Hex | Usage |
|-------|-----|-------|
| Primary indigo | `#4F46E5` | Links, focus rings, selected unit borders, hero accents |
| Primary indigo light | `#EEF2FF` | Selected unit/card backgrounds |
| Accent lime | `#DCE546` | Cart button, quantity controls, promo accents |
| Text primary | `#000000` | Headings, prices, primary labels |
| Text muted | `#64748B` | Secondary labels, unit sizes, tax notes |
| Border light | `#E2E8F0` / `#DCDCDC` | Card borders, inputs |
| Surface muted | `#F8FAFC` / `#F7F8FC` | Image placeholders, page backgrounds |
| White | `#FFFFFF` | Cards, panels |

Match Figma specs when implementing new UI. If Figma provides exact colors, use those values.

### Icons

- **Font Awesome Free v7** — loaded globally in `main.tsx`
- Use solid icons: `<i className="fa-solid fa-cart-shopping" />`
- Decorative icons inside buttons should have `aria-label` on the button, not on the icon

### Accessibility

Follow patterns in `ProductDetailsPage.tsx` and `ProductCard.tsx`:

- Use `type="button"` on all non-submit buttons
- Provide `aria-label` on icon-only or ambiguous controls
- Use `aria-expanded`, `aria-pressed`, `aria-checked`, `role="radio"` / `role="radiogroup"` for custom toggles
- Clickable non-link elements: add `tabIndex={0}`, keyboard handler for Enter/Space, and a descriptive `aria-label`
- Use `event.stopPropagation()` when a nested button should not trigger a parent click handler (e.g. Add vs. card click)
- Images: meaningful `alt` on content images; `alt=""` on decorative/thumbnail duplicates

### Data Layer (current MVP)

Until the backend is live, use `src/data/` for mock catalog data:

```ts
export type Product = { id: string; title: string; /* ... */ };

export const products: Product[] = [ /* ... */ ];

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}
```

- Product images are served from `frontend/public/` (e.g. `/images/milk.png`)
- Components should import from `data/` rather than duplicating inline arrays
- When API integration arrives, replace data helpers with fetch/React Query calls — keep types

### Navigation Patterns

| Scenario | Approach |
|----------|----------|
| Button/action navigation | `const navigate = useNavigate(); navigate("/orders")` |
| Text links, back links | `<Link to="/">Back to home</Link>` |
| Product card → detail | `navigate(\`/product/${productId}\`)` |
| Navbar logo | `onClick={() => navigate("/")}` |

Every page that needs the header should include `<Navbar />` at the top (consistent with `HomePage`, `OrdersPage`, `ProductDetailsPage`).

### What Not To Do

- Do not add Redux, Zustand, TanStack Query, or other libraries without a clear need
- Do not use inline styles except for truly dynamic values
- Do not use CSS-in-JS or Tailwind — this project uses CSS Modules
- Do not create commits, push, or open PRs unless explicitly asked
- Do not duplicate mock data inside components — centralize in `src/data/`
- Do not change unrelated files while fixing a focused issue
- Do not use `interface` for new props types if the file uses `type` (stay consistent per file)

### Backend Code Guide (when implementing)

The backend folder is not yet scaffolded. When building it:

- **Framework:** NestJS with TypeScript, modular structure under `backend/src/modules/`
- **One module per domain:** auth, products, orders, cart, users, payments
- **Controllers** handle HTTP; **services** hold business logic; **DTOs** validate input
- **API prefix:** `/api` (frontend expects `http://localhost:3000/api`)
- **Response shape:**
  ```json
  { "success": true, "data": {}, "message": "...", "timestamp": "..." }
  ```
- Use environment variables for Supabase credentials — never commit secrets
- Match NestJS conventions: PascalCase classes, camelCase methods, kebab-case route paths

---

## Common Features (Roadmap)

### Phase 1 (MVP)

- [x] Navbar with account dropdown and cart overlay
- [x] Home page with hero, categories, products
- [x] Product display and filtering
- [x] Product details page (`/product/:id`)
- [ ] Shopping cart functionality (full cart backend integration)
- [ ] Checkout flow
- [ ] Orders page (UI built, backend TBD)
- [ ] User authentication

### Phase 2

- Real-time order tracking
- Payment gateway integration
- Address management
- Promo codes and discounts
- Ratings and reviews

---

## Communication & Questions

**For clarifications on:**

- Backend API contracts → Discuss with backend lead
- Database schema → Check Supabase console or discuss with backend
- Component design → Review design files or Figma mockups
- Deployment strategy → TBD with devops/infrastructure team

---

## Quick Reference Links

- **Supabase Dashboard:** [console.supabase.com](https://console.supabase.com)
- **React Documentation:** [react.dev](https://react.dev)
- **Vite Documentation:** [vitejs.dev](https://vitejs.dev)
- **React Router Documentation:** [reactrouter.com](https://reactrouter.com)
- **NestJS Documentation:** [docs.nestjs.com](https://docs.nestjs.com)

---

**Last Updated:** 2026-06-16
