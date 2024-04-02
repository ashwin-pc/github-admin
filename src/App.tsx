import React from 'react';
import { ThemeProvider, BaseStyles } from '@primer/react';
import './index.css';
import { AppProvider } from './context';
import { PRs } from './legacy_pages/PullsPage';

const SafeBaseStyles = BaseStyles as React.ComponentType<any>;

const App = () => (
  <ThemeProvider colorMode="dark">
    <SafeBaseStyles>
      <AppProvider>
        <PRs />
      </AppProvider>
    </SafeBaseStyles>
  </ThemeProvider>
);

export default App;
