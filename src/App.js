import React, {useEffect, useState} from "react";
import {Auth} from "aws-amplify";
import {useHistory} from "react-router-dom";
import {onError} from "./libs/errorLib";
import "./App.css";
import {useAuthContext} from "./contexts/AuthContext";
import Box from "@material-ui/core/Box";
import ErrorBoundary from "./components/ErrorBoundary";
import Bar from "./containers/Bar";
import Routes from "./Routes";
import {useWebsocketContext} from "./contexts/WebsocketContext";
import config from './config';
import {SnackbarProvider} from 'notistack';

function App() {
  const history = useHistory();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const {login, logout, setUserInfo} = useAuthContext();
  const {websocketConnect, websocketDisconnect} = useWebsocketContext();

  useEffect(() => {
    async function onLoad() {
      try {
        await Auth.currentSession();
        const userInfo = await login();
        websocketConnect(config.websocket.URL + `?userId=${userInfo.id}`);
        return function cleanup() {
          console.log("Disconnecting websocket");
          websocketDisconnect();
        };
      } catch (e) {
        if (e !== 'No current user') {
          onError(e);
        }
      }

      setIsAuthenticating(false);
    }

    onLoad();
  }, []);

  async function handleLogout() {
    await Auth.signOut();
    logout();
    history.push("/login");
  }

  return (
    <ErrorBoundary>
      <SnackbarProvider maxSnack={4}>
        <Bar logout={handleLogout}/>
        <Box my={2}>
          <Routes/>
        </Box>
      </SnackbarProvider>
    </ErrorBoundary>
  );
}

export default App
