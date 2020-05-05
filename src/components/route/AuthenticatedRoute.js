import React, {useEffect, useState} from "react";
import {Redirect, Route, useLocation} from "react-router-dom";
import {useAuthContext} from "../../contexts/AuthContext";

export default function AuthenticatedRoute({children, ...rest}) {
  const {pathname, search} = useLocation();
  const {isAuthenticated, onAuthenticationUpdated, offAuthenticationUpdated} = useAuthContext();
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());

  function handleAuthenticationUpdated(isAuthenticated) {
    setLoggedIn(isAuthenticated);
  }

  useEffect(() => {
    onAuthenticationUpdated(handleAuthenticationUpdated);
    return function cleanup() {
      offAuthenticationUpdated(handleAuthenticationUpdated);
    }
  }, []);

  return (
    <Route {...rest}>
      {loggedIn ? (
        children
      ) : (
        <Redirect to={
          `/login?redirect=${pathname}${search}`
        }/>
      )}
    </Route>
  );
}
