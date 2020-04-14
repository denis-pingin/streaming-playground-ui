import React, {useEffect, useState} from "react";
import {Auth} from "aws-amplify";
import {useHistory} from "react-router-dom";
import {onError} from "./libs/errorLib";
import "./App.css";
import {useAuthContext} from "./libs/AuthContext";
import Box from "@material-ui/core/Box";
import Copyright from "./components/Copyright";
import makeStyles from "@material-ui/core/styles/makeStyles";
import ErrorBoundary from "./components/ErrorBoundary";
import Bar from "./containers/Bar";
import Routes from "./Routes";

function App() {
  const history = useHistory();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const {login, logout, setUserInfo} = useAuthContext();

  useEffect(() => {
    onLoad();
  }, []);

  async function onLoad() {
    try {
      await Auth.currentSession();
      const userInfo = await Auth.currentUserInfo();
      console.log(userInfo);
      login(true);
      setUserInfo(userInfo);
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
    history.push("/login");
  }

  return (
    <ErrorBoundary>
      {/*<Routes/>*/}
      <Bar logout={handleLogout}/>
      <Box my={2}>
        <Routes/>
        <Copyright/>
      </Box>
      {/*<Grid className={classes.grid} container justify="center" spacing={5}>*/}
      {/*  <Grid item xs={6}>*/}
      {/*  </Grid>*/}
      {/*</Grid>*/}
      {/*<Snackbar*/}
      {/*  autoHideDuration={snackbar.autoHideDuration}*/}
      {/*  message={snackbar.message}*/}
      {/*  open={snackbar.open}*/}
      {/*  onClose={this.closeSnackbar}*/}
      {/*/>*/}
    </ErrorBoundary>
  );
}

// {!isAuthenticating && (
// <div className="App container">
//   <Navbar fluid collapseOnSelect>
//     <Navbar.Header>
//       <Navbar.Brand>
//         <Link to="/">Streaming Playground</Link>
//       </Navbar.Brand>
//       <Navbar.Toggle/>
//     </Navbar.Header>
//     <Navbar.Collapse>
//       <Nav pullRight>
//         {isAuthenticated ? (
//           <>
//             <LinkContainer to="/settings">
//               <NavItem>Settings</NavItem>
//             </LinkContainer>
//             <NavItem onClick={handleLogout}>Logout</NavItem>
//           </>
//         ) : (
//           <>
//             <LinkContainer to="/signup">
//               <NavItem>Signup</NavItem>
//             </LinkContainer>
//             <LinkContainer to="/login">
//               <NavItem>Login</NavItem>
//             </LinkContainer>
//           </>
//         )}
//       </Nav>
//     </Navbar.Collapse>
//   </Navbar>
//   <ErrorBoundary>
//     <Routes/>
//   </ErrorBoundary>
// </div>)}
export default App
