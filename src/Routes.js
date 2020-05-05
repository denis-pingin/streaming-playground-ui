import React from "react";
import {Route, Switch} from "react-router-dom";

import AuthenticatedRoute from "./components/route/AuthenticatedRoute";
import UnauthenticatedRoute from "./components/route/UnauthenticatedRoute";

import Home from "./components/common/Home";
import Login from "./components/user/Login";
import Pool from "./components/pool/Pool";
import Signup from "./components/user/Signup";
import Settings from "./components/user/Settings";
import NotFound from "./components/common/NotFound";

export default function Routes() {
  return (
    <Switch>
      <Route exact path="/">
        <Home/>
      </Route>
      <UnauthenticatedRoute exact path="/login">
        <Login/>
      </UnauthenticatedRoute>
      <UnauthenticatedRoute exact path="/signup">
        <Signup/>
      </UnauthenticatedRoute>
      <AuthenticatedRoute exact path="/settings">
        <Settings/>
      </AuthenticatedRoute>
      <Route path="/pools/:poolId">
        <Pool/>
      </Route>
      <Route>
        <NotFound/>
      </Route>
    </Switch>
  );
}
