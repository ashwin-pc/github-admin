import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, BaseStyles } from '@primer/react';
import './index.css';
import reportWebVitals from './reportWebVitals';
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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <ThemeProvider colorMode="dark">
      <SafeBaseStyles>
        <RouterProvider router={router} />
      </SafeBaseStyles>
    </ThemeProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
