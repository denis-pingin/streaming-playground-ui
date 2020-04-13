import React, {useContext} from "react";
import {Redirect, Route, useLocation} from "react-router-dom";
import {AuthContext, useAuthContext} from "../libs/AuthContext";

export default function AuthenticatedRoute({children, ...rest}) {
  const {pathname, search} = useLocation();
  const [authContext, setAuthContext] = useContext(AuthContext);
  const {isAuthenticated} = useAuthContext();

  return (
    <Route {...rest}>
      {isAuthenticated ? (
        children
      ) : (
        <Redirect to={
          `/login?redirect=${pathname}${search}`
        }/>
      )}
    </Route>
  );
}
