# Everlast Fragrances

## Run the application

Install the frontend dependencies from the repository root and start Vite:

```sh
npm install
npm run dev
```

## Backend API

The Express API is in `server/`. It stores orders, contact messages, and
newsletter subscriptions in MongoDB.

1. Install backend dependencies with `cd server && npm install`.
2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and
   `CLIENT_ORIGIN`. `CLIENT_ORIGIN` accepts comma-separated frontend origins.
3. Start the API with `npm run dev` from `server/`.
4. Set `VITE_API_URL` for the frontend if the API is not at
   `http://localhost:5000/api`.

The backend runs an insert-only catalog seed at startup. Keep `server/.env`
private, and rotate MongoDB credentials if a connection string is ever exposed.

The API provides public product catalog reads, order creation, contact and
newsletter submissions, plus authenticated admin product, order, and contact
message management. Orders calculate prices from MongoDB products and check
stock at checkout. Inventory is deducted transactionally only when an
administrator confirms payment; cancelling a confirmed order restores its stock.
The 110 ML price is always twice the 55 ML price.

The backend inserts the current 82 storefront listings on first startup without
overwriting existing product records. Seeded available items start with 10 units
per size, while existing sold-out items start at zero; review the inventory in
Admin before accepting real orders.

### Configure the private admin

From an interactive terminal in `server/`, run `npm run admin:setup`. It asks
for an email and a password twice (password input is hidden), then stores the
password hash and random admin session secret in the local `.env` without printing
them. Admin sessions expire after eight hours and are held in browser
`sessionStorage`. Do not commit `.env` or send the password in chat. Open
`/admin` to sign in. There is no public admin registration endpoint.

Admin supports adding, editing, archiving, and restoring products; managing
prices, size-specific stock, images and collection visibility; viewing and
updating contact messages; and viewing orders, confirming payments, updating
fulfillment status, or cancelling an order (which restores stock if payment
was confirmed). Payment still uses the existing manual bank-transfer process.

Run backend tests with `npm test` from `server/`.

## Deploy frontend and backend to Vercel

Deploy this repository as two Vercel projects: the frontend uses the repository
root, and the Express backend uses `server/` as its root directory. MongoDB
Atlas is the production database.

### Keep environment values private

- Frontend local development uses the ignored root `.env.local`. Its safe
  template is `.env.example`. Set `VITE_API_URL` to the API URL in Vercel's
  project environment variables for production; frontend `VITE_*` values are
  public and must never contain secrets.
- Backend local values belong in the ignored `server/.env`; use
  `server/.env.example` as the template. In production, add backend values in
  the backend Vercel project's Environment Variables settings. Do not commit
  either private env file.

1. Push the project to GitHub and create the frontend Vercel project with the
   repository root as its Root Directory. Keep the build command `npm run
   build` and output directory `dist`, as configured in `vercel.json`. Deploy
   once to get the frontend domain.
2. Create a second Vercel project from the same repository and set its Root
   Directory to `server`. Vercel deploys the Express app in `server/index.js`
   as a function. Add these backend environment variables in its settings:
   `MONGODB_URI` (your Atlas connection string), `CLIENT_ORIGIN` (the exact
   frontend origin, such as `https://your-site.vercel.app`),
   `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `JWT_SECRET`.
3. If you have not configured the admin yet, run `npm run admin:setup` from
   `server/` in an interactive terminal. Copy the generated `ADMIN_EMAIL`,
   `ADMIN_PASSWORD_HASH`, and `JWT_SECRET` values from the private local
   `server/.env` into the backend project's Vercel settings. Do not deploy or
   share that file.
4. In the MongoDB Atlas Network Access settings, allow connections from your
   backend. Use Vercel static egress IPs if available for your plan; otherwise
   an IP allowlist entry of `0.0.0.0/0` may be needed because serverless
   outbound IPs can change. Protect Atlas with a strong, unique database
   password and never expose the connection string in frontend variables.
5. Deploy the backend and check
   `https://YOUR-BACKEND.vercel.app/api/health` for `{"success":true,"status":"ok"}`.
6. In the frontend Vercel project, set the production variable
   `VITE_API_URL` to `https://YOUR-BACKEND.vercel.app/api`, then redeploy the
   frontend. If you use preview or custom frontend domains, add their exact
   origins to `CLIENT_ORIGIN` as comma-separated values.

The backend has no SMTP or customer email-code sign-in requirement. The
customer-account/order-history login has been removed; customers can still
place orders and provide their delivery contact details. Test the storefront,
`/admin`, API health, and a test checkout after both projects deploy. Review
seeded inventory before accepting real orders.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
