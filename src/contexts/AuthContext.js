import React, {useContext, useRef, useState} from 'react';
import {Auth} from "aws-amplify";

const AuthContext = React.createContext([
  {
    isAuthenticated: false,
    userInfo: null,
    callbacks: new Set()
  }, () => {
  }]);

const AuthContextProvider = (props) => {
  const [authContext, setAuthContext] = useState({
    isAuthenticated: false,
    userInfo: null,
    callbacks: new Set()
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

  function getUserInfo() {
    return authContextRef.current.userInfo;
  }

  function isAuthenticated() {
    return authContextRef.current.isAuthenticated;
  }

  function onAuthenticationUpdated(callback) {
    const callbacks = getCallbacks();
    callbacks.add(callback);
    setCallbacks(callbacks);
  }

  function offAuthenticationUpdated(callback) {
    const callbacks = getCallbacks();
    callbacks.delete(callback);
    setCallbacks(callbacks);
  }

  function getCallbacks() {
    return authContextRef.current.callbacks || new Set();
  }

  function setCallbacks(callbacks) {
    authContextRef.current.callbacks = callbacks;
    setAuthContext(authContext => ({...authContext, callbacks: callbacks}));
  }

  function invokeCallbacks() {
    getCallbacks().forEach(callback =>
      callback(authContextRef.current.isAuthenticated, authContextRef.current.userInfo));
  }

  async function login() {
    // await Auth.currentSession();
    // const authUser = await Auth.currentAuthenticatedUser();
    const userInfo = await Auth.currentUserInfo()
    console.log("Logged in:", userInfo);

    authContextRef.current.isAuthenticated = userInfo != null;
    authContextRef.current.userInfo = userInfo;
    setAuthContext(authContext => ({
      ...authContext,
      isAuthenticated: userInfo != null,
      userInfo: userInfo
    }));

    invokeCallbacks();
  }

  async function logout() {
    await Auth.signOut();

    authContextRef.current.isAuthenticated = false;
    authContextRef.current.userInfo = null;
    setAuthContext(authContext => ({
      ...authContext,
      isAuthenticated: false,
      userInfo: null
    }));

    invokeCallbacks();
  }

  return {
    isAuthenticated,
    getUserInfo,
    login,
    logout,
    onAuthenticationUpdated,
    offAuthenticationUpdated
  }
};

export {AuthContext, AuthContextProvider, useAuthContext};