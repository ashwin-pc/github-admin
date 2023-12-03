import './App.css';
import { useGithubApiKey } from './context';
import NoKey from './components/NoKey';
import { PRs } from './components/PRs';
import { Box } from '@primer/react';

function App() {
  const { githubApiKey } = useGithubApiKey();

  return (
    <Box className="App" color="fg.default" bg="canvas.default">
      {!githubApiKey ? <NoKey /> : <PRs />}
    </Box>
  );
}

export default App;
