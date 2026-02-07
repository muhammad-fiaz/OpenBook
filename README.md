# Open Book

Open Book is a self-hosted, personal accounting and finance application designed for individuals and small businesses. It provides invoicing, expenses, reporting, products, clients, and basic bookkeeping features with a privacy-first approach.

Key features:
- Invoicing and PDF generation
- Client and product management
- Expense and income tracking
- Basic financial reports and dashboards
- User accounts and team management

Quick start:
1. Copy your environment variables to `.env` (this file is ignored by git).
2. Install dependencies: `npm install` or `yarn`.
3. Run the development server: `npm run dev`.

License
-------
This project is released under the MIT License. See the `LICENSE` file for details.

Repository: https://github.com/muhammad-fiaz/OpenBook

Clone
-----

To get a local copy of the project:

```bash
git clone https://github.com/muhammad-fiaz/OpenBook.git
cd OpenBook
```

Setup
-----

1. Copy the example env file and fill in values:

```bash
cp .env-example .env
# Edit .env and provide your DB and secrets
```

2. Install dependencies (choose one):

```bash
npm install
# or
yarn
# or
# bun install
```

Development
-----------

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Database migrations
-------------------

This project uses Prisma. To run migrations locally (development):

```bash
npx prisma migrate dev
```

For deploying to production where migrations are already created:

```bash
npx prisma migrate deploy
```

Production
----------

Build and start the production server:

```bash
npm run build
npm start
```

Notes
-----

- `.env` is intentionally ignored by git — keep secrets out of the repository.
- Use Postgres for the `DATABASE_URL` environment variable (see `prisma/schema.prisma`).
- License: MIT (see `LICENSE`).

If you want additional examples (docker-compose, CI, or contributor guide), tell me what you'd like added.
