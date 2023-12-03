import React, { useState } from 'react';
import { validateGithubApiKey } from '../utils/validate_api_key';
import { useGithubApiKey } from '../context';

const NoKey = () => {
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(true);
  const { setGithubApiKey } = useGithubApiKey();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
  };

  const validateApiKey = async () => {
    const valid = await validateGithubApiKey(apiKey);
    setIsValid(valid);

    if (valid) {
      setGithubApiKey(apiKey);
    }
  };

  return (
    <div className="center">
      <div>
        <h1>Enter your GitHub API Key</h1>
        <input type="text" value={apiKey} onChange={handleInputChange} />
        <button onClick={validateApiKey}>Use key</button>
        {!isValid && apiKey !== '' && <p>API Key is invalid</p>}
      </div>
    </div>
  );
};

export default NoKey;
