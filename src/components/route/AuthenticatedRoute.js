import React, {useEffect, useState} from "react";
import {Redirect, Route, useLocation} from "react-router-dom";
import {useAuthContext} from "../../contexts/AuthContext";

export default function AuthenticatedRoute({children, ...rest}) {
  const {pathname, search} = useLocation();
  const {isAuthenticated, onAuthenticationUpdated, offAuthenticationUpdated} = useAuthContext();
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());

  useEffect(() => {
    onAuthenticationUpdated(setLoggedIn);
    return function cleanup() {
      offAuthenticationUpdated(setLoggedIn);
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
