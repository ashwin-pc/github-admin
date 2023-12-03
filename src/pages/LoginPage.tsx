// Create a login page that will allow the user to enter their GitHub API key. This key will be stored in local storage and used to make requests to the GitHub API. The login page should be the first page the user sees when they visit the site. If the user has already logged in, they should be redirected to the home page.
import React, { useState } from 'react';
import { Blankslate } from '@primer/react/drafts';
import { KeyIcon } from '@primer/octicons-react';
import { Box, Button, FormControl, TextInput } from '@primer/react';
import { useGithubApiKey } from '../context';
import { validateGithubApiKey } from '../utils/validate_api_key';
import { useStatefulNavigate } from '../utils/use_stateful_navigate';

export const Login = () => {
  const { githubApiKey, setGithubApiKey } = useGithubApiKey();
  const navigate = useStatefulNavigate();
  const [apiKey, setApiKey] = useState(githubApiKey || '');
  const [isValid, setIsValid] = useState(true);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
  };

  const validateApiKey = async () => {
    const valid = await validateGithubApiKey(apiKey);
    setIsValid(valid);

    if (valid) {
      setGithubApiKey(apiKey);
      navigate('/', { key: apiKey });
    }
  };

  return (
    <Blankslate spacious>
      <Blankslate.Visual>
        <KeyIcon size="medium" />
      </Blankslate.Visual>
      <Blankslate.Heading>Lets login to the app!</Blankslate.Heading>
      <Blankslate.Description>
        <p>Enter your GitHub API key to get started</p>
        <Box as="form">
          <FormControl>
            <FormControl.Label>Api Key</FormControl.Label>
            <TextInput
              sx={{ width: '100%' }}
              {...(isValid ? {} : { validationStatus: 'error' })}
              onChange={handleInputChange}
              value={apiKey}
            />
            {!isValid && (
              <FormControl.Validation variant="error">
                Api Key is invalid
              </FormControl.Validation>
            )}
          </FormControl>
          <FormControl sx={{ marginTop: '10px' }}>
            <Button
              onClick={(e) => {
                e.preventDefault();
                validateApiKey();
              }}
              type="submit"
              variant="primary"
            >
              Use key
            </Button>
          </FormControl>
        </Box>
      </Blankslate.Description>
      <Blankslate.SecondaryAction href="https://github.com">
        Go to github
      </Blankslate.SecondaryAction>
    </Blankslate>
  );
};
