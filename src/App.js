import React, {useEffect, useState} from "react";
import {Auth} from "aws-amplify";
import {Link, useHistory} from "react-router-dom";
import {Nav, Navbar, NavItem} from "react-bootstrap";
import {LinkContainer} from "react-router-bootstrap";
import ErrorBoundary from "./components/ErrorBoundary";
import {onError} from "./libs/errorLib";
import Routes from "./Routes";
import "./App.css";
import {useAuthContext} from "./libs/AuthContext";

function App() {
  const history = useHistory();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const {login, logout, setCognitoUserSession} = useAuthContext();

  useEffect(() => {
    onLoad();
  }, []);

  async function onLoad() {
    try {
      const cognitoUserSession = await Auth.currentSession();
      userHasAuthenticated(true);
      login(true);
      setCognitoUserSession(cognitoUserSession.idToken.payload);
    } catch (e) {
      if (e !== 'No current user') {
        onError(e);
      }
    }

    setIsAuthenticating(false);
  }

  async function handleLogout() {
    await Auth.signOut();

    logout();
    userHasAuthenticated(false);

    history.push("/login");
  }

  return (
    !isAuthenticating && (
      <div className="App container">
        <Navbar fluid collapseOnSelect>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/">Streaming Playground</Link>
            </Navbar.Brand>
            <Navbar.Toggle/>
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav pullRight>
              {isAuthenticated ? (
                <>
                  <LinkContainer to="/settings">
                    <NavItem>Settings</NavItem>
                  </LinkContainer>
                  <NavItem onClick={handleLogout}>Logout</NavItem>
                </>
              ) : (
                <>
                  <LinkContainer to="/signup">
                    <NavItem>Signup</NavItem>
                  </LinkContainer>
                  <LinkContainer to="/login">
                    <NavItem>Login</NavItem>
                  </LinkContainer>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <ErrorBoundary>
          <Routes/>
        </ErrorBoundary>
      </div>
    )
  );
}

export default App
