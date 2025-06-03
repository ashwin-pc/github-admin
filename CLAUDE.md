# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the app for production
- `npm run start` - Start the production server
- `npm test` - Run tests with Jest

### Linting & Formatting
- Uses ESLint with React App configuration (extends `react-app` and `react-app/jest`)
- Prettier configured with:
  - Semi-colons enabled
  - Trailing commas for all
  - Single quotes
  - 80 character line width
  - 2 space tab width

### Environment Setup
- Node.js v20.10.0 (specified in `.nvmrc`)
- Environment variables required:
  - `NEXT_PUBLIC_GITHUB_CLIENT_ID` - GitHub OAuth app client ID
  - `GITHUB_CLIENT_SECRET` - GitHub OAuth app client secret
- Set these in `.env.local` for local development

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict null checks enabled)
- **UI Library**: Primer React (GitHub's design system)
- **State Management**: React Context API
- **Styling**: CSS modules and plain CSS files
- **Testing**: Jest with ts-jest for TypeScript support
- **CI/CD**: GitHub Actions workflow for automated testing on master branch
- **Package Manager**: npm

## Architecture

### Core Components

1. **Authentication Flow**
   - GitHub OAuth integration with the following components:
     - Login button in `src/components/Header.tsx`
     - Token exchange in `src/app/api/auth/token/route.ts`
     - Authentication state maintained in `src/context/index.tsx`

2. **GitHub API Integration**
   - GraphQL proxy at `src/app/api/graphql/route.ts` forwards authenticated GitHub GraphQL requests
   - `src/utils/graphql_proxy.ts` provides client-side interface to the API proxy
   - Uses Octokit GraphQL schema for TypeScript types

3. **Pull Request Management**
   - Main view in `src/legacy_pages/PullsPage.tsx` showing a list of PRs
   - `src/hooks/useSearch.tsx` handles search functionality with debouncing
   - PR state determined by `src/utils/determine_review_status.ts`
   - PR row components in `src/components/PRRow/` directory structure

4. **Component Structure**
   - Uses Primer React components (`@primer/react`) for GitHub-style UI
   - Context-based state management in `src/context/index.tsx`
   - Next.js app router with API routes in `src/app/api/`

### Data Flow

1. **Authentication**: 
   - User logs in via GitHub OAuth
   - Token stored in HTTP-only cookie
   - `AppContext` maintains authentication state

2. **Data Fetching**:
   - GraphQL queries defined in components (see large query in `PullsPage.tsx`)
   - Requests proxied through `/api/graphql` to maintain token security
   - Search results managed by `useSearch` hook

3. **PR Status Determination**:
   - PR status computed by `determinePRState` function in `utils/determine_review_status.ts`
   - Takes into account multiple factors including:
     - Draft status
     - Number of approvals (minimum 2 required)
     - Recent activities
     - Author vs reviewer interactions

## Project Structure

```
src/
├── app/                    # Next.js app router pages and API routes
│   ├── [[...slug]]/       # Dynamic catch-all route
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── graphql/       # GraphQL proxy endpoint
│   └── layout.tsx         # Root layout component
├── components/            # Reusable React components
│   ├── PRRow/            # Pull request row components
│   └── ...               # Other UI components
├── context/              # React Context providers
├── hooks/                # Custom React hooks
├── legacy_pages/         # Legacy page components
├── utils/                # Utility functions
└── index.css            # Global styles
```

## Key Design Patterns

1. **API Proxy Pattern**: All GitHub API requests are proxied through Next.js API routes to keep tokens secure
2. **Context for State**: Global state (auth, user data) managed via React Context
3. **Component Composition**: PR row broken into smaller, focused components
4. **Custom Hooks**: Business logic abstracted into reusable hooks (e.g., `useSearch`, `useDebounce`)
5. **Server-Side Security**: Sensitive operations (token exchange) handled in API routes, not client-side

## Development Guidelines

1. **TypeScript**: While strict mode is disabled globally, `strictNullChecks` is enabled - handle null/undefined appropriately
2. **Error Handling**: Wrap API calls in try-catch blocks and handle errors gracefully
3. **Component Organization**: Keep components focused and create sub-components for complex UI elements
4. **Testing**: Write tests for utility functions, especially complex logic like PR status determination
5. **Security**: Never expose GitHub tokens to the client - always use the GraphQL proxy