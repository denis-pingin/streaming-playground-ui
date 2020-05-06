import React, {useEffect, useState} from "react";
import {Redirect, Route} from "react-router-dom";
import {useAuthContext} from "../../contexts/AuthContext";

function querystring(name, url = window.location.href) {
  name = name.replace(/[[]]/g, "\\$&");

  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i");
  const results = regex.exec(url);

  if (!results) {
    return null;
  }
  if (!results[2]) {
    return "";
  }

  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export default function UnauthenticatedRoute({ children, ...rest }) {
  const {isAuthenticated, onAuthenticationUpdated, offAuthenticationUpdated} = useAuthContext();
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const redirect = querystring("redirect");

  useEffect(() => {
    onAuthenticationUpdated(setLoggedIn);
    return function cleanup() {
      offAuthenticationUpdated(setLoggedIn);
    }
  }, []);

  return (
    <Route {...rest}>
      {!loggedIn ? (
        children
      ) : (
        <Redirect to={redirect === "" || redirect === null ? "/" : redirect} />
      )}
    </Route>
  );
}
