import React, {useContext, useState} from 'react';
import {Auth} from "aws-amplify";

const AuthContext = React.createContext([
  {
    isAuthenticated: false,
    userInfo: null
  }, () => {
  }]);

const AuthContextProvider = (props) => {
  const [authContext, setAuthContext] = useState({
    isAuthenticated: false,
    userInfo: null
  });
  return (
    <AuthContext.Provider value={[authContext, setAuthContext]}>
      {props.children}
    </AuthContext.Provider>
  );
}

const useAuthContext = () => {
  const [authContext, setAuthContext] = useContext(AuthContext);

  async function login() {
    const userInfo = await Auth.currentUserInfo();
    console.log("Logged in userInfo:", userInfo);
    setAuthContext({
      isAuthenticated: true,
      userInfo: userInfo
    });
    return userInfo;
  }

  function logout() {
    setAuthContext({
      isAuthenticated: false,
      userInfo: null
    });
  }

  return {
    isAuthenticated: authContext.isAuthenticated,
    userInfo: authContext.userInfo,
    login,
    logout
  }
};

export {AuthContext, AuthContextProvider, useAuthContext};