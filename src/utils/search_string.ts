export const search = {
  add: (q: string, key: string, value: string, position?: number) => {
    const tokens = q.split(' ');
    const newTokens = tokens.filter((token) => !token.startsWith(`${key}:`));
    if (position !== undefined) {
      newTokens.splice(position, 0, `${key}:${value}`);
    } else {
      newTokens.push(`${key}:${value}`);
    }
    return newTokens.join(' ');
  },
  remove: (q: string, key: string) => {
    const tokens = q.split(' ');
    const newTokens = tokens.filter((token) => !token.startsWith(`${key}:`));
    return newTokens.join(' ');
  },
  has: (q: string, key: string, value: string) => {
    const tokens = q.split(' ');
    return tokens.some((token) => token === `${key}:${value}`);
  },
  get: (q: string, key: string) => {
    const tokens = q.split(' ');
    const token = tokens.find((token) => token.startsWith(`${key}:`));
    return token ? token.split(':')[1] : '';
  },
  getKeys: (q: string) => {
    const tokens = q.split(' ');
    return tokens
      .filter((token) => token.includes(':'))
      .map((token) => token.split(':')[0]);
  },
  getValues: (q: string, key: string) => {
    const tokens = q.split(' ');
    return tokens
      .filter((token) => token.startsWith(`${key}:`))
      .map((token) => token.split(':')[1]);
  },
};
