import React, {useContext, useState} from 'react';

const AuthContext = React.createContext([
  {
    isAuthenticated: false,
    cognitoUserSession: null
  }, () => {
  }]);

const AuthContextProvider = (props) => {
  const [authContext, setAuthContext] = useState({
    isAuthenticated: false,
    cognitoUserSession: null
  });
  return (
    <AuthContext.Provider value={[authContext, setAuthContext]}>
      {props.children}
    </AuthContext.Provider>
  );
}

const useAuthContext = () => {
  const [authContext, setAuthContext] = useContext(AuthContext);

  function login() {
    setAuthContext(authContext => ({...authContext, isAuthenticated: true}));
  }

  function logout() {
    setAuthContext(authContext => ({...authContext, isAuthenticated: false}));
  }

  function setCognitoUserSession(cognitoUserSession) {
    setAuthContext(authContext => ({...authContext, cognitoUserSession: cognitoUserSession}));
  }

  return {
    isAuthenticated: authContext.isAuthenticated,
    cognitoUserSession: authContext.cognitoUserSession,
    login,
    logout,
    setCognitoUserSession
  }
};

export {AuthContext, AuthContextProvider, useAuthContext};