import React from "react";
import {Link as RouterLink} from "react-router-dom";
import {useAuthContext} from "../contexts/AuthContext";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import {Button, ButtonGroup} from "@material-ui/core";
import Pools from "./Pools";

export default function Home() {
  const {isAuthenticated} = useAuthContext();

  return (
    <>
      {isAuthenticated() ?
        <Pools/>
        :
        <Container component="main" maxWidth="sm">
          <Typography component="h1" variant="h4" align="center" color="textPrimary">
            Streaming Playground
          </Typography>
          <Typography component="h1" variant="h6" align="center" color="textSecondary">
            Let's play!
          </Typography>
          <ButtonGroup variant="outlined" fullWidth={true}>
            <Button component={RouterLink} to="/login">Login</Button>
            <Button component={RouterLink} to="/signup">Sign Up</Button>
          </ButtonGroup>
        </Container>}
    </>
  );
}
