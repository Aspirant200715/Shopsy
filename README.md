# Shopsy — MERN E-commerce Store

Shopsy is a full-stack MERN e-commerce application for curated home, lifestyle, stationery, and electronics products. It includes customer authentication, catalog browsing, cart and wishlist management, Razorpay checkout, order tracking, stock-safe payments, and a protected admin dashboard.

![Shopsy frontend login preview](./docs/screenshots/login.png)

> **Project status:** deployed and available for staging/testing. Configure your own production business details, live Razorpay credentials, and custom domain before accepting real orders.

## Live deployment

| Service | URL | Purpose |
|---|---|---|
| Shopsy storefront | [shopsy-eight-alpha.vercel.app](https://shopsy-eight-alpha.vercel.app) | Vercel-hosted React/Vite frontend |
| Shopsy API | [shopkart-api-wyjo.onrender.com](https://shopkart-api-wyjo.onrender.com) | Render-hosted Express API |
| API health | [shopkart-api-wyjo.onrender.com/health](https://shopkart-api-wyjo.onrender.com/health) | Public API and MongoDB connectivity check |

The production frontend uses the API URL through `VITE_API_URL`. The backend uses `CORS_ORIGINS` to allow credentialed browser requests from the deployed frontend. The Render free service may sleep after inactivity, so the first request after a quiet period can take longer.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Run locally](#run-locally)
- [Application pages](#application-pages)
- [Authentication and roles](#authentication-and-roles)
- [Admin dashboard](#admin-dashboard)
- [Payment and stock behavior](#payment-and-stock-behavior)
- [Backend API](#backend-api)
- [Environment variables](#environment-variables)
- [Seed products and promote an admin](#seed-products-and-promote-an-admin)
- [Deployment](#deployment)
- [Production configuration](#production-configuration)
- [Validation commands](#validation-commands)
- [Troubleshooting](#troubleshooting)
- [License and third-party notices](#license-and-third-party-notices)

## Features

### Storefront

- Editorial Shopsy homepage with hero cards, collections, metrics, reviews, newsletter CTA, and an Admin Studio preview.
- Product catalog with category filtering, product details, stock labels, and image fallbacks.
- Product cards with add-to-cart, wishlist, increment/decrement controls, direct quantity input, and stock-aware validation.
- Cart with shipping address form, Razorpay checkout, item-level out-of-stock messaging, and safe cart clearing.
- Wishlist page backed by the API.
- Order history and order details with payment status, fulfilment status, shipping address, product image snapshots, and progress.
- Responsive navigation, toast feedback, empty states, loading states, and broken-image placeholders.

### Authentication

- Customer registration and login.
- Cookie-based JWT authentication.
- Password hashing with `bcrypt`.
- Customer and admin roles.
- Protected customer routes and protected admin routes.
- Specific validation messages for invalid name, email, phone, password, duplicate email, and unavailable server errors.

### Admin Studio

- Catalog, customer, order, and paid-revenue overview.
- Product creation, editing, deletion, and stock visibility.
- Low-stock indicators.
- Recent order listing.
- Fulfilment progression: `PLACED` → `CONFIRMED` → `SHIPPED` → `DELIVERED`.

The public homepage and login/signup pages include a small static Admin Studio glimpse. It uses sample values only and never exposes real customer or revenue data.

## Technology stack

### Frontend

React 19, Vite, React Router, Redux Toolkit, React Redux, Axios, React Toastify, CSS modules, and application CSS.

### Backend

Node.js, Express 5, MongoDB, Mongoose, JWT, bcrypt, Razorpay, cookie-parser, CORS, and dotenv.

## Project structure

```text
Shopkart/
├── backend/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   │   ├── seed-products.js
│   │   └── set-admin.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── vite.config.js
├── run.sh
└── README.md
```

## Run locally

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB, local or hosted
- Razorpay test account for checkout testing

### Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Configure the backend

Create `backend/.env`:

```env
PORT=5050
dbUrl=mongodb+srv://<username>:<password>@<cluster>/<database>
jwt_secret=replace-with-a-long-random-secret
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
```

Never commit `.env` files, database credentials, JWT secrets, or Razorpay secrets.

### Start both applications

Option 1:

```bash
bash run.sh
```

Option 2, using two terminals:

```bash
# Terminal 1
cd backend
npm run dev
```

```bash
# Terminal 2
cd frontend
npm run dev
```

The Vite server is configured in [vite.config.js](./frontend/vite.config.js) to use port `5174` during development. The Express API uses port `5050`.

The frontend automatically uses the current browser hostname on port `5050` unless `VITE_API_URL` is set.

## Application pages

The following client-side routes are available after deploying the frontend. Use the deployed frontend domain as the base URL.

| Page | Link | Access |
|---|---|---|
| Login | `/login` | Public |
| Signup | `/signup` | Public |
| Storefront home | `/` | Logged-in customer |
| Products | `/products` | Logged-in customer |
| Product details | `/products/:id` | Logged-in customer |
| Wishlist | `/wishlist` | Logged-in customer |
| Cart and checkout | `/cart` | Logged-in customer |
| Orders | `/orders` | Logged-in customer |
| Order details | `/orders/:id` | Logged-in customer |
| Admin Studio | `/admin` | Admin only |
| Privacy | `/privacy` | Public |
| Terms | `/terms` | Public |
| Shipping and returns | `/shipping-returns` | Public |
| Contact | `/contact` | Public |
| API health | `/health` on the backend domain | Public |

Protected pages redirect to `/login` without a valid authentication cookie.

## Frontend visual references

The application uses a dark green, lime, coral, and editorial cream visual system.

### Authentication

![Shopsy login screen](./docs/screenshots/login.png)

The login screen uses the shared [AuthLeftPanel.jsx](./frontend/src/pages/AuthLeftPanel.jsx), including the Shopsy branding, trust benefits, and Admin Studio glimpse.

### Signup screen

![Shopsy signup screen](./docs/screenshots/signup.png)

The signup screen shares the same frontend visual system and provides the customer registration flow.

Homepage hero, collection, and product cards use curated product imagery. Product records also store an image URL so the same image can appear in catalog cards, cart, wishlist, product details, and order snapshots.

## Authentication and roles

### Customer registration

1. Open `/signup`.
2. Enter name, phone, email, and a password of at least seven characters.
3. Submit the form.
4. Log in from `/login`.

The backend normalizes email/name/phone input and enforces unique email addresses. Full names do not need to be unique.

### Admin promotion

An account must exist before it can become an admin:

```bash
cd backend
npm run set-admin -- your-email@example.com
```

Then log out, log in again, and open `/admin`. If the command reports `No customer found`, register that email first.

## Admin dashboard

The Admin Studio frontend is [AdminPage.jsx](./frontend/src/pages/AdminPage.jsx). It loads:

```text
GET /admin/overview
GET /admin/products
GET /admin/orders
PATCH /admin/orders/:id/status
```

All admin endpoints require a valid authentication cookie and a customer record with the `admin` role. The public preview is intentionally static.

## Payment and stock behavior

Checkout uses Razorpay:

1. The frontend submits the shipping address.
2. The backend validates the cart and current stock.
3. The backend creates a local order with `paymentStatus: "PENDING"` and `orderStatus: "PENDING_PAYMENT"`.
4. The backend creates a Razorpay order.
5. Razorpay returns payment details to the frontend.
6. The frontend sends those details to `/orders/verify-payment`.
7. The backend validates the HMAC-SHA256 signature.
8. A MongoDB transaction atomically decrements stock, marks payment `PAID`, changes order status to `PLACED`, stores payment IDs, and clears the cart.

Stock is **not** reduced when an order is only created, pending, cancelled, or failed. Invalid payment signatures also do not reduce stock. If any item lacks stock during successful verification, the transaction rolls back and no item is reduced.

Order names, prices, quantities, and images are snapshotted so historical orders remain consistent if a product later changes.

## Backend API

Base URL: the deployed backend domain configured in `VITE_API_URL`.

### Health

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health` | No | Check API and MongoDB connection state |

### Customers

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/customers/register` | No | Create a customer account |
| `POST` | `/customers/login` | No | Log in and set auth cookie |
| `GET` | `/customers/me` | Yes | Read current customer |
| `POST` | `/customers/logout` | No | Clear auth cookie |
| `PATCH` | `/customers/change-password` | Yes | Change password |

### Products

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/products` | No | List products |
| `GET` | `/products/:id` | No | Read one product |
| `POST` | `/products` | Admin | Create product |
| `PATCH` | `/products/:id` | Admin | Update product |
| `DELETE` | `/products/:id` | Admin | Delete product |

Product records require `name`, `description`, `price`, `category`, `image`, and non-negative `stock`.

### Cart

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/cart` | Yes | Read current cart |
| `POST` | `/cart/:productId` | Yes | Add product or increase quantity |
| `PATCH` | `/cart/:productId` | Yes | Set quantity |
| `DELETE` | `/cart/:productId` | Yes | Remove one item |

### Wishlist

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/wishlist` | Yes | Read wishlist |
| `POST` | `/wishlist/:productId` | Yes | Add product |
| `DELETE` | `/wishlist/:productId` | Yes | Remove product |

### Orders and payments

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/orders/create-payment-order` | Yes | Validate cart and create pending Razorpay order |
| `POST` | `/orders/verify-payment` | Yes | Verify signature and place order |
| `GET` | `/orders` | Yes | List current customer's orders |
| `GET` | `/orders/:id` | Yes | Read one customer's order |
| `PATCH` | `/orders/:id/status` | Admin | Advance fulfilment status |

### Admin

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/overview` | Admin | Read counts and paid revenue |
| `GET` | `/admin/products` | Admin | Read admin catalog |
| `GET` | `/admin/orders` | Admin | Read all orders |
| `PATCH` | `/admin/orders/:id/status` | Admin | Advance order status |

## Environment variables

### Backend `.env`

| Variable | Required | Description |
|---|---:|---|
| `PORT` | No | Express port; defaults to `5050` |
| `dbUrl` | Yes | MongoDB connection string |
| `jwt_secret` or `JWT_SECRET` | Yes | JWT signing secret |
| `RAZORPAY_KEY_ID` | Checkout | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Checkout | Razorpay secret used for signature verification |
| `CORS_ORIGINS` | Production | Comma-separated frontend origin(s), for example `https://shop.example.com` |
| `NODE_ENV` | Production | Set to `production` to enable secure cross-site auth cookies |

### Frontend

```env
VITE_API_URL=https://your-api-domain.example.com
```

If omitted, the frontend uses the current browser hostname with port `5050`. For production, set `VITE_API_URL` to the deployed backend URL and configure credentials/CORS for the deployed frontend origin.

## Seed products and promote an admin

Seed or update the catalog:

```bash
cd backend
npm run seed-products
```

The seeder updates existing records by product name and includes valid images for Graphic Tablet, Pen, Mouse, and Mechanical Keyboard.

Promote an existing customer:

```bash
cd backend
npm run set-admin -- your-email@example.com
```

## Deployment

### Backend

1. Deploy the `backend` directory to a Node.js host.
2. Set `PORT`, `dbUrl`, JWT, and Razorpay variables.
3. Restrict CORS to the deployed frontend origin instead of local origins.
4. Use HTTPS.
5. Run `npm install` and `npm start`.
6. Verify `/health` reports a connected database.

### Frontend

1. Deploy the `frontend` directory to a static host.
2. Set `VITE_API_URL=https://your-api-domain.example.com`.
3. Run `npm install` and `npm run build`.
4. Serve `frontend/dist`.
5. Keep [`frontend/vercel.json`](./frontend/vercel.json) so Vercel rewrites client-side React Router routes to the application entry point when a page is refreshed or opened directly.
6. Test login, logout, cart, Razorpay test payment, order history, and admin access.

### Current deployment values

The current deployment uses the following configuration:

```text
Frontend host: Vercel
Frontend root directory: frontend
Frontend build command: npm run build
Frontend output directory: dist

Backend host: Render
Backend root directory: backend
Backend build command: npm install
Backend start command: npm start
Backend region: Singapore
```

For a new deployment, deploy the backend first, verify `/health`, then set the frontend `VITE_API_URL` to the backend URL. After the frontend has a stable URL, set the backend `CORS_ORIGINS` to that exact origin without a trailing slash and redeploy the backend.

## Production configuration

### Render backend variables

Set these variables on the backend service. Keep all secret values in the hosting provider's secret manager; never commit them to Git.

```env
NODE_ENV=production
PORT=10000
dbUrl=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=<long-random-secret>
RAZORPAY_KEY_ID=<razorpay-key-id>
RAZORPAY_KEY_SECRET=<razorpay-key-secret>
CORS_ORIGINS=https://shopsy-eight-alpha.vercel.app
```

`PORT` is normally supplied by Render. The backend defaults to `5050` for local development. `dbUrl` is intentionally lowercase because that is the environment variable read by the server and maintenance scripts. The JWT utility accepts either `jwt_secret` or `JWT_SECRET`; use `JWT_SECRET` consistently in production.

### Vercel frontend variable

```env
VITE_API_URL=https://shopkart-api-wyjo.onrender.com
```

Vite embeds `VITE_*` values into the browser bundle at build time. Redeploy the frontend after changing this variable.

### MongoDB Atlas

The backend requires a MongoDB Atlas database user with read/write access. Atlas Network Access must allow the Render service to connect. For initial Render testing, `0.0.0.0/0` is commonly used because Render outbound addresses can change; review this exposure and your database permissions before a high-security production launch.

### Payment rollout

Use Razorpay test keys while validating signup, cart, checkout, signature verification, stock handling, and order history. Switch to live keys only after completing Razorpay account verification and replacing all test credentials in Render. Never expose `RAZORPAY_KEY_SECRET` or any database/JWT secret in frontend variables.

### Production security checklist

- Never commit `.env`, credentials, or payment secrets.
- Use a strong random JWT secret and HTTPS.
- Restrict CORS to known frontend origins.
- Use Razorpay production keys only after completing test flows.
- Replace `support@shopsy.example` and other placeholder support/legal details.
- Review privacy, terms, shipping, and returns copy for the real business.
- Replace third-party image hotlinks with owned or licensed assets where possible.
- Back up MongoDB before production migrations or seed operations.
- Confirm `CORS_ORIGINS` exactly matches the frontend origin and uses HTTPS.
- Confirm the deployed `/health` endpoint reports `"database": "connected"`.
- Configure a custom domain and update CORS after the domain is active.

## Validation commands

```bash
# Frontend
cd frontend
npm run build
npm run lint

# Backend syntax
node --check backend/server.js
node --check backend/controllers/order.controller.js

# API checks
curl https://your-api-domain.example.com/health
curl https://your-api-domain.example.com/products
```

## Troubleshooting

### Site does not load on port 5174

```bash
cd frontend
npm run dev
```

Then open the frontend deployment URL. During development, the Vite configuration binds to `0.0.0.0` and uses port `5174`.

### Frontend loads but API calls fail

```bash
cd backend
npm run dev
```

Then open `/health` on the deployed backend domain.

### User is redirected to login

This is expected for protected routes. Log in at `/login`.

### Admin link is missing

```bash
cd backend
npm run set-admin -- your-email@example.com
```

Log out and log in again after promotion.

### Payment does not complete

Check that Razorpay keys exist, the backend is reachable, the cart has sufficient stock, and a Razorpay test checkout is being used. Check the browser console and backend logs for verification errors.

## License and third-party notices

This project is released under the [MIT License](./LICENSE).

The MIT license applies to the original Shopsy application code in this repository. It does not automatically grant ownership or redistribution rights for third-party software, fonts, images, logos, payment SDKs, or other external services.

Before deploying publicly:

- Confirm that every product, hero, and shopping-bag image is licensed for the intended use.
- Review the terms for any external image CDN used by the application.
- Keep the original notices for open-source dependencies.
- Review Razorpay's current merchant and SDK terms.
- Replace the placeholder copyright holder in [LICENSE](./LICENSE) with the legal owner or company name if required.
