import React, {useContext, useState} from 'react';

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

  function login() {
    setAuthContext(authContext => ({...authContext, isAuthenticated: true}));
  }

  function logout() {
    setAuthContext(authContext => ({...authContext, isAuthenticated: false}));
  }

  function setUserInfo(userInfo) {
    setAuthContext(authContext => ({...authContext, userInfo: userInfo}));
  }

  return {
    isAuthenticated: authContext.isAuthenticated,
    userInfo: authContext.userInfo,
    login,
    logout,
    setUserInfo
  }
};

export {AuthContext, AuthContextProvider, useAuthContext};