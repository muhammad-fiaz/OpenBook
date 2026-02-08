<div align="center">

# Open Book

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC.svg)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.0-336791.svg)](https://www.postgresql.org/)



[Report Bug](https://github.com/muhammad-fiaz/OpenBook/issues) · [Request Feature](https://github.com/muhammad-fiaz/OpenBook/issues)

</div>

Open Book is a self-hosted, personal accounting and finance application designed for individuals and small businesses. It provides invoicing, expenses, reporting, products, clients, and basic bookkeeping features with a privacy-first approach.


## Table of Contents

- [Open Book](#open-book)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Built With](#built-with)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Database Setup](#database-setup)
  - [Production](#production)
  - [Contributing](#contributing)
  - [License](#license)
  - [Contact](#contact)

## Features

Open Book offers a comprehensive suite of tools for managing your finances:

- **Invoicing**: Create and manage professional invoices with PDF generation capabilities.
- **Expense Tracking**: Log manageable expenses and categorize them for better financial oversight.
- **Client Management**: Maintain a database of client details and transaction history.
- **Product & Service Catalog**: Manage your inventory of products and services.
- **Financial Reporting**: Visualize your financial health with dashboards and reports.
- **Team Management**: Invite team members and manage user roles and permissions.
- **Authentication**: Secure user authentication and session management.

## Built With

This project utilizes a modern technology stack to ensure performance, scalability, and developer experience:

- **Framework**: [Next.js 16](https://nextjs.org/) (React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn/ui](https://ui.shadcn.com/)
- **Authentication**: [Better-Auth](https://better-auth.com/)
- **Form Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **PDF Generation**: [PDFMe](https://pdfme.com/)
- **Linting & Formatting**: [Biome](https://biomejs.dev/)

## Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher) or [Bun](https://bun.sh/)
- [PostgreSQL](https://www.postgresql.org/) database

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/muhammad-fiaz/OpenBook.git
    cd OpenBook
    ```

2.  **Install dependencies**

    Using npm:
    ```bash
    npm install
    ```

    Or using Bun:
    ```bash
    bun install
    ```

3.  **Configure Environment Variables**

    Copy the example environment file to `.env`:

    ```bash
    cp .env-example .env
    ```

    Open `.env` and populate the necessary variables, particularly your database connection string and authentication secrets.

### Database Setup

1.  **Run Migrations**

    Apply the Prisma migrations to your local database:

    ```bash
    npx prisma migrate dev
    ```

2.  **Seed Database (Optional)**

    If there are seed scripts available, run them to populate initial data:

    ```bash
    npx prisma db seed
    ```

3.  **Start Development Server**

    ```bash
    npm run dev
    # or
    bun run dev
    ```

    The application should now be running at `http://localhost:3000`.

## Production

To build and run the application for production:

1.  **Build the application**

    ```bash
    npm run build
    ```

2.  **Start the server**

    ```bash
    npm start
    ```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to submit improvements and bug fixes.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Project Repository: [https://github.com/muhammad-fiaz/OpenBook](https://github.com/muhammad-fiaz/OpenBook)
