import React from "react";
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
  const { isAuthenticated } = useAuthContext();
  const redirect = querystring("redirect");
  return (
    <Route {...rest}>
      {!isAuthenticated() ? (
        children
      ) : (
        <Redirect to={redirect === "" || redirect === null ? "/" : redirect} />
      )}
    </Route>
  );
}
