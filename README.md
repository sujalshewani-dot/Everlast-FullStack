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

### Customer order history sign-in

Customers sign in with a one-time code sent to the email address used at
checkout. Their account page shows only order numbers, items, totals, dates,
and statuses; it does not show delivery addresses or phone numbers.

To enable code delivery, create a Brevo account, verify the sender address (and
your domain for production), then copy the SMTP host, port, username, SMTP key,
and verified sender into `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and
`SMTP_FROM` in the private `server/.env`. Use the SMTP key as the password.
Never put these values in frontend environment variables or share them in chat.
Run `npm run admin:setup` if you have not already configured the admin; it also
creates the customer-session signing secret. Restart the backend after updating
`.env`. Codes expire after 10 minutes and customer sessions after 8 hours.

The backend inserts the current 82 storefront listings on first startup without
overwriting existing product records. Seeded available items start with 10 units
per size, while existing sold-out items start at zero; review the inventory in
Admin before accepting real orders.

### Configure the private admin

From an interactive terminal in `server/`, run `npm run admin:setup`. It asks
for an email and a password twice (password input is hidden), then stores the
password hash and random session secrets in the local `.env` without printing
them. Admin sessions expire after eight hours and are held in browser
`sessionStorage`. Do not commit `.env` or send the password in chat. Open
`/admin` to sign in. There is no public admin registration endpoint.

Admin supports adding, editing, archiving, and restoring products; managing
prices, size-specific stock, images and collection visibility; viewing and
updating contact messages; and viewing orders, confirming payments, updating
fulfillment status, or cancelling an order (which restores stock if payment
was confirmed). Payment still uses the existing manual bank-transfer process.

Run backend tests with `npm test` from `server/`.

## Deploy frontend and backend

The frontend is configured for Vercel and the API for Render. MongoDB Atlas
should be used for the production database.

### Keep environment values private

- Frontend local development uses the ignored root `.env.local`. Its safe
  template is `.env.example`. Set `VITE_API_URL` to the API URL in Vercel's
  project environment variables for production; frontend `VITE_*` values are
  public and must never contain secrets.
- Backend local values belong in the ignored `server/.env`; use
  `server/.env.example` as the template. In production, add backend values in
  Render's Environment dashboard. Do not commit either private env file.

### Render API

1. Push the repository to GitHub and create a Render Blueprint from it. The
   root `render.yaml` configures the service to run from `server/`, use
   `npm install` / `npm start`, and check `/api/health`.
2. Set the private environment values in Render:
   `MONGODB_URI` (your Atlas connection string), `ADMIN_EMAIL`,
   `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, and `CUSTOMER_SESSION_SECRET`.
   Generate or retrieve the admin hash and signing secrets with the
   `admin:setup` workflow above; never put the password itself in Render's
   `ADMIN_PASSWORD_HASH` field. Set `CLIENT_ORIGIN` to
   `http://localhost:5173` temporarily if you have not deployed the frontend
   yet; replace it with the Vercel site origin after step 3.
3. Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` to
   Render if customer email sign-in is enabled. Use Brevo's SMTP key as the
   password. Render supplies `PORT`.
4. Deploy and wait for `/api/health` to report `ok`.

The Blueprint uses Render's free plan to avoid unexpected charges. Free
services can sleep when idle; choose a paid plan if the API needs to stay
available without cold starts.

### Vercel frontend

1. Import the GitHub repository into Vercel with the repository root as the
   project root. Use `npm run build` as the build command and `dist` as the
   output directory.
2. Set the production environment variable `VITE_API_URL` to
   `https://YOUR-RENDER-SERVICE.onrender.com/api`, using the actual Render
   service URL.
3. Deploy the frontend, then set Render's `CLIENT_ORIGIN` to the exact
   `https://` origin of the deployed Vercel site. Redeploy/restart the API
   after changing that value.

The Vercel rewrite in `vercel.json` supports direct navigation to frontend
routes. After deployment, test the storefront, `/admin`, API health, and a
test checkout. Review seeded inventory before accepting real orders.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
