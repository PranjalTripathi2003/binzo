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
│   │   │   └── ...
│   │   ├── data/                # Static data, constants, fixtures
│   │   ├── styles/              # Global styles
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
- Global styles in `src/styles/` directory
- Responsive breakpoints: `1120px`, `720px`, `520px` (mobile-first where applicable)

### State Management

- Use React hooks (`useState`, `useContext`) for local/shared state
- For complex state, consider Context API or state library (discuss with team)

### Routing

- Use React Router v7 (`useNavigate`, `Routes`, `Route`)
- Page components live in `src/pages/`
- Navigation items in account dropdown or buttons should use `useNavigate` hook

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

- Absolute imports from `src/` if configured
- Relative imports for same-folder references

---

## Common Features (Roadmap)

### Phase 1 (MVP)

- [x] Navbar with account dropdown and cart overlay
- [x] Home page with hero, categories, products
- [x] Product display and filtering
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

**Last Updated:** 2026-06-13
