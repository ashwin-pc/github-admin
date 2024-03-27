import React from 'react';
import { ThemeProvider, BaseStyles } from '@primer/react';
import './index.css';
import { GithubApiKeyProvider } from './context';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Login } from './pages/LoginPage';
import ErrorPage from './pages/ErrorPage';
import { PRs } from './pages/PullsPage';
import { BASE_PATH } from './components/constants';

const SafeBaseStyles = BaseStyles as React.ComponentType<any>;

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <GithubApiKeyProvider>
          <Outlet />
        </GithubApiKeyProvider>
      ),
      errorElement: <ErrorPage />,
      children: [
        {
          path: '/',
          element: <PRs />,
        },
        {
          path: '/login',
          element: <Login />,
        },
      ],
    },
  ],
  {
    // Add a basename to ensure the app works on GitHub pages in production
    basename: BASE_PATH,
  },
);

const App = () => (
  <ThemeProvider colorMode="dark">
    <SafeBaseStyles>
      <RouterProvider router={router} />
    </SafeBaseStyles>
  </ThemeProvider>
);

export default App;
