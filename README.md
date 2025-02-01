# Github Admin App

This project is a Next.js application used to manage GitHub repositories through a GitHub OAuth integration. It replaces the default Create React App boilerplate.

## Prerequisites

- [Node.js](https://nodejs.org/) (see [.nvmrc](.nvmrc))
- A GitHub OAuth App with your client ID and secret.  
  See [GitHub OAuth Apps](https://github.com/settings/developers) for details.

## Getting Started

1. **Clone the repository and install dependencies:**

   ```sh
   git clone <repository-url>
   cd <repository-folder>
   npm install
   ```

2. **Set environment variables:**

   Create a `.env.local` file in the project root with:
   ```sh
   NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```
   These credentials are used by the Next.js API routes in [src/app/api/auth](src/app/api/auth) to manage GitHub authentication.

3. **Run the development server:**

   Use the following command to start Next.js in development mode:
   ```sh
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Available Scripts

### `npm run dev`
Starts the app in development mode with hot reloading.  
Your GitHub OAuth callback should point to [http://localhost:3000](http://localhost:3000).

### `npm run build`
Builds the app for production into the `.next` folder and optimizes the build for best performance.

### `npm start`
Starts the Next.js server in production mode after a production build.

### `npm test`
Runs the test suite in interactive watch mode.  
Tests are configured via [src/setupTests.ts](src/setupTests.ts).

### `npm run deploy`
Deploys a new production build. (Customize this script as needed for your hosting environment.)

## Project Structure

- **src/**  
  Contains the source code:
  - `app/` – Next.js pages and layouts.
  - `components/` – Reusable React components.
  - `context/` – Application context, including authentication state managed in [`AppContext`](src/components/AppContext.tsx).
  - `hooks/` – Custom hooks.
  - `utils/` – Utility functions.

- **next.config.mjs** – Next.js configuration.

- **.env**, **.env.local** – Environment variable files.

## Authentication Flow

- The login button in [`src/components/Header.tsx`](src/components/Header.tsx) triggers GitHub OAuth.
- After successful authentication, GitHub redirects back and the code is exchanged for an access token in the API route at [`src/app/api/auth/token/route.ts`](src/app/api/auth/token/route.ts).
- The token is stored in cookies and the authentication state is maintained by the application context.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [React Documentation](https://reactjs.org/)
