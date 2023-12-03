// create a react useNavigate hook that preserves state in the query params

import queryString from 'query-string';
import { useLocation, useNavigate } from 'react-router-dom';

export const useStatefulNavigate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (to: string, state?: any) => {
    let newQuery = location.search;

    if (state) {
      newQuery = queryString.stringify({
        ...queryString.parse(location.search),
        ...state,
      });
    }
    navigate(`${to}${newQuery ? `?${newQuery}` : ''}`);
  };
};
