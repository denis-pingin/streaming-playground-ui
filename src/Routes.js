import React from "react";
import {Route, Switch} from "react-router-dom";

import AuthenticatedRoute from "./components/AuthenticatedRoute";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";

import Home from "./containers/Home";
import Login from "./containers/Login";
import Pool from "./containers/Pool";
import Stream from "./containers/Stream";
import Signup from "./containers/Signup";
import Settings from "./containers/Settings";
import NotFound from "./containers/NotFound";

export default function Routes() {
  return (
    <Switch>
      <Route exact path="/">
        <Home />
      </Route>
      <UnauthenticatedRoute exact path="/login">
        <Login />
      </UnauthenticatedRoute>
      <UnauthenticatedRoute exact path="/signup">
        <Signup />
      </UnauthenticatedRoute>
      <AuthenticatedRoute exact path="/settings">
        <Settings />
      </AuthenticatedRoute>
      <AuthenticatedRoute exact path="/pools/:poolId">
        <Pool />
      </AuthenticatedRoute>
      <AuthenticatedRoute exact path="/pools/:poolId/streams/:streamId">
        <Stream />
      </AuthenticatedRoute>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}
