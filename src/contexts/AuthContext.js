import React, {useContext, useRef, useState} from 'react';
import {Auth} from "aws-amplify";

const AuthContext = React.createContext([
  {
    isAuthenticated: false,
    userInfo: null,
    sessionInfo: null
  }, () => {
  }]);

const AuthContextProvider = (props) => {
  const [authContext, setAuthContext] = useState({
    isAuthenticated: false,
    userInfo: null,
    sessionInfo: null
  });
  return (
    <AuthContext.Provider value={[authContext, setAuthContext]}>
      {props.children}
    </AuthContext.Provider>
  );
}

const useAuthContext = () => {
  const [authContext, setAuthContext] = useContext(AuthContext);
  const authContextRef = useRef(authContext)

  function updateAuthContext(value) {
    setAuthContext(value);
    authContextRef.current = value;
  }

  function getSessionInfo() {
    return authContextRef.current.sessionInfo;
  }

  function getUserInfo() {
    return authContextRef.current.userInfo;
  }

  function isAuthenticated() {
    return authContextRef.current.isAuthenticated;
  }

  async function login() {
    await Auth.currentSession();
    const userInfo = await Auth.currentUserInfo();
    const authUser = await Auth.currentAuthenticatedUser();

    const authContext = {
      isAuthenticated: true,
      userInfo: userInfo,
      sessionInfo: authUser.signInUserSession.idToken.jwtToken
    }
    updateAuthContext(authContext);
    return authContext;
  }

  async function logout() {
    await Auth.signOut();
    const authContext = {
      isAuthenticated: false,
      userInfo: null,
      sessionInfo: null
    }
    updateAuthContext(authContext);
    return authContext;
  }

  return {
    isAuthenticated,
    getUserInfo,
    getSessionInfo,
    login,
    logout
  }
};

export {AuthContext, AuthContextProvider, useAuthContext};