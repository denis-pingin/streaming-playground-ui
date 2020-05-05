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

  function getAuthContext() {
    return authContextRef.current;
  }

  function updateAuthContext(value) {
    setAuthContext(value);
    authContextRef.current = value;
  }

  function getUserInfo() {
    return getAuthContext().userInfo;
  }

  function isAuthenticated() {
    return getAuthContext().isAuthenticated;
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
    return getAuthContext().callbacks || new Set();
  }

  function setCallbacks(callbacks) {
    updateAuthContext({...getAuthContext(), callbacks: callbacks});
  }

  function invokeCallbacks() {
    const authContext = getAuthContext();
    getCallbacks().forEach(callback => callback(authContext.isAuthenticated, authContext.userInfo));
  }

  async function login() {
    // await Auth.currentSession();
    // const authUser = await Auth.currentAuthenticatedUser();
    const userInfo = await Auth.currentUserInfo()
    console.log("Logged in:", userInfo);

    updateAuthContext({
      ...getAuthContext(),
      isAuthenticated: userInfo != null,
      userInfo: userInfo
    });
    invokeCallbacks();
  }

  async function logout() {
    await Auth.signOut();
    updateAuthContext({
      ...getAuthContext(),
      isAuthenticated: false,
      userInfo: null
    });
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