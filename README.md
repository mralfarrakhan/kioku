# Kioku

Kioku is a modern spaced-repetition flashcard application built with SvelteKit and tailored for deployment on Cloudflare Workers. It allows users to create, manage, and share flashcard collections, and features a spaced-repetition algorithm to optimize learning. It integrates a robust stack for styling, database management, and authentication to provide a seamless full-stack experience.

## Features

- **User Authentication**: Secure signup and login via Better Auth.
- **Flashcard Collections**: Create personal flashcard collections or discover public, shared collections.
- **Spaced Repetition**: Keep track of your learning progress with a spaced-repetition algorithm that tracks intervals, ease factors, and repetitions.
- **Markdown Support**: Rich text definitions using markdown.

## Tech Stack

This project is built using the following modern web technologies:

- **Package Manager**: [Bun](https://bun.sh/)
- **Framework**: [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (with Typography and Forms plugins)
- **Database & ORM**: [Drizzle ORM](https://orm.drizzle.team/) configured for [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Deployment**: Cloudflare Workers via Wrangler (`@sveltejs/adapter-cloudflare`)
- **Code Quality**: ESLint, Prettier, and Svelte Check

## Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed on your machine.

### Installation

Clone the repository and install dependencies using Bun:

```sh
bun install
```

### Database Management

The project uses Drizzle ORM and Cloudflare D1. We have provided several scripts in `package.json` for database operations:

```sh
# Generate Drizzle migrations
bun run db:generate

# Apply migrations to local Cloudflare D1 environment
bun run db:migrate:dev

# Apply migrations to production
bun run db:migrate:prod

# Push schema directly
bun run db:push

# Open Drizzle Studio for local database management
bun run db:studio
```

If you modify the Better Auth configuration, you can update the database schema with:

```sh
bun run auth:schema
```

## Developing

Start a local development server:

```sh
bun run dev

# Or start the server and automatically open the app in your browser
bun run dev -- --open
```

## Building & Previewing

To create a production-ready version of your app:

```sh
bun run build
```

You can preview the production build locally with:

```sh
bun run preview
```

## Project Generation Reference

For reference, this project was originally scaffolded using the `sv` CLI with the following configuration:

```sh
bun x sv@0.16.3 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:typography,forms" sveltekit-adapter="adapter:cloudflare+cfTarget:workers" better-auth="demo:password" mcp="ide:gemini,claude-code+setup:local" drizzle="database:d1" --install bun kioku
```
