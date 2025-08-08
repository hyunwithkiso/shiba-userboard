# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application called "SHIBA 유저보드" - a Korean gaming community userboard platform with e-commerce functionality. It serves as a user dashboard for managing game-related content (killfeed, chat titles) and purchasing digital goods through Tebex integration.

## Key Development Commands

- `npm run dev --turbopack`: Start development server with Turbopack
- `npm run dev`: Start development server without Turbopack  
- `npm run build`: Build for production 
- `npm start`: Start production server
- `npm run lint`: Run ESLint

## Database Management

- `npx drizzle-kit generate`: Generate database migrations
- `npx drizzle-kit migrate`: Run database migrations
- `npx drizzle-kit push`: Push schema changes directly (dev only)
- `npx drizzle-kit studio`: Launch Drizzle Studio (database GUI)

Database uses PostgreSQL with Drizzle ORM. Schema located in `lib/schema.ts`. Configuration in `drizzle.config.ts` requires `DB_URL` environment variable.

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5 with Discord OAuth
- **UI**: TailwindCSS + Radix UI components
- **Payments**: Tebex API integration
- **Image Processing**: Custom image upload/approval system

### Key Architecture Patterns

**Dual Database System**: 
- Primary PostgreSQL database (Drizzle schema) for core app data
- Legacy MySQL integration for game-specific data via `ImageService`
- Both systems are bridged through user ID mapping

**Service Layer Pattern**:
- `services/` directory contains business logic services
- `ImageService` handles legacy MySQL operations
- Services abstract database operations from UI components

**Action-Based Data Mutations**:
- Server actions in `actions/` directory handle form submissions
- Client components use server actions for data mutations
- Follows Next.js App Router patterns

### Directory Structure

- `app/`: Next.js App Router pages and API routes
- `components/`: Reusable React components (UI, forms, layouts)
- `lib/`: Core utilities, database schema, auth configuration
- `services/`: Business logic and external service integrations
- `actions/`: Server actions for data mutations
- `drizzle/`: Database migration files

## Database Schema Highlights

**Core Entities**:
- `users`: Extended user profiles with Discord integration, admin flags
- `killfeedSubmission` & `chatTitleSubmission`: Game content submission workflows
- `purchases` & `payments`: E-commerce transaction tracking
- `notices` & `events`: Community content management

**Key Relationships**:
- Users can have multiple submissions (killfeed/chat titles)
- Submissions have approval workflows (pending/approved/rejected)
- Purchase tracking links to Tebex transactions

## Authentication Flow

NextAuth.js v5 with custom Discord provider:
- Discord OAuth for user registration/login
- Custom adapter saves Discord ID to user profile
- JWT strategy with database user data enrichment
- Admin role management through database flags

## Image Submission System

**Two-Stage Process**:
1. File upload to external service (proxy.dokku.co.kr)
2. Metadata submission to local database for admin approval

**Types**:
- Killfeed images: Gaming achievement screenshots
- Chat title images: Custom user title graphics

**Approval Workflow**:
- Pending → Admin review → Approved/Rejected
- Metadata includes positioning and scaling parameters

## E-commerce Integration

**Tebex Integration** (`lib/tebex.ts`):
- Digital goods marketplace for gaming items
- Basket/cart management
- Webhook-based payment processing
- Multiple database tables track purchase lifecycle

**Payment Flow**:
1. Add items to Tebex basket
2. Checkout through Tebex
3. Webhook processes completion
4. Local database updated with purchase records

## Development Guidelines

**Database Changes**:
Always generate migrations with `npx drizzle-kit generate` after schema changes. Both PostgreSQL (Drizzle) and MySQL (legacy) systems need consideration.

**Authentication Context**:
User sessions include: `id`, `nickname`, `gameId`, `discordId`, `isAdmin`, `userId`. Check admin status for sensitive operations. There are duplicate type definitions in `next-auth.d.ts` and `types/next-auth.d.ts` - the root level one should be considered canonical.

**Error Handling**:
Services use try/catch with detailed logging. UI components handle service errors gracefully with user feedback.


**Environment Variables**:
Required: `DATABASE_URL` (or `DB_URL` for Drizzle), `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `AUTH_SECRET`, `TEBEX_*` variables for payment processing.

MySQL variables for legacy game integration: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`.

**Image Hosting**:
External image uploads go through proxy.dokku.co.kr and screenshot.dokku.co.kr domains (configured in Next.js image optimization).

**TypeScript Configuration**:
Uses relaxed TypeScript with `noImplicitAny: false` for legacy compatibility. Path mapping `@/*` resolves to project root.