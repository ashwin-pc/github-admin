import { Octicon, Token } from '@primer/react';

export const StatusBadge = ({
  status,
  color,
  icon,
  leadingVisual,
}: {
  status: string;
  color: string;
  icon?: any;
  leadingVisual?: () => JSX.Element;
}) => {
  const Icon = () => <Octicon icon={icon} color={color} />;
  return (
    <Token text={status} leadingVisual={leadingVisual || Icon} as="span" />
  );
};
