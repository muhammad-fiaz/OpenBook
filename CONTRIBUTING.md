# Contributing to Open Book

First off, thank you for considering contributing to Open Book! It's people like you that make Open Book such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold generally accepted standards of professional conduct.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for infinite. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps which reproduce the problem** in as much detail as possible.
- **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Open Book, including completely new features and minor improvements to existing functionality.

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as much detail as possible.
- **Explain why this enhancement would be useful** to most Open Book users.

### Pull Requests

The process described here has several goals:

- Maintain Open Book's quality
- Fix problems that are important to users
- Engage the community in working toward the best possible Open Book
- Enable a sustainable system for Open Book's maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

1.  Follow all instructions in the template
2.  Follow the styleguides
3.  After you submit your pull request, verify that all status checks are passing

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### JavaScript/TypeScript Styleguide

- All TypeScript code is linted with **Biome**.
- Run `npm run lint` or `bun run lint` to check for style issues.
- Run `npm run format` or `bun run format` to fix style issues automatically.

## Development Setup

1.  Clone the repository
2.  Copy `.env-example` to `.env` and configure your environment variables
3.  Install dependencies: `npm install` or `bun install`
4.  Run database migrations: `npx prisma migrate dev`
5.  Start the development server: `npm run dev` or `bun run dev`
