import { Blankslate } from '@primer/react/drafts';
import { useRouteError } from 'react-router-dom';
import { XCircleFillIcon } from '@primer/octicons-react';

export default function ErrorPage() {
  const error = useRouteError() as any;
  console.error(error);

  return (
    <Blankslate spacious>
      <Blankslate.Visual>
        <XCircleFillIcon size="medium" />
      </Blankslate.Visual>
      <Blankslate.Heading>Oops!</Blankslate.Heading>
      <Blankslate.Description>
        Sorry, an unexpected error has occurred. Looks like the page you were
        looking for doesn't exist. Try going back to the previous page or going
        to the home page.
        {error.statusText || error.message}
      </Blankslate.Description>
      <Blankslate.PrimaryAction href="/">Go Home</Blankslate.PrimaryAction>
      <Blankslate.SecondaryAction href="https://github.com">
        Go to github
      </Blankslate.SecondaryAction>
    </Blankslate>
  );
}
