import React, {useEffect, useState} from "react";
import {Link as RouterLink} from "react-router-dom";
import {AppBar, IconButton, Menu, MenuItem, Toolbar, Typography} from "@material-ui/core";
import UserAvatar from "../user/UserAvatar";
import {useAuthContext} from "../../contexts/AuthContext";
import Link from "@material-ui/core/Link";
import makeStyles from "@material-ui/core/styles/makeStyles";
import MenuIcon from "@material-ui/icons/Menu";

const useStyles = makeStyles((theme) => ({
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
    "user-select": "none",
    "white-space": "nowrap"
  },
}));

export default function Bar({login, logout}) {
  const classes = useStyles();
  const {isAuthenticated, onAuthenticationUpdated, offAuthenticationUpdated} = useAuthContext();
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [anchorElement, setAnchorElement] = useState(null);
  const [menuItems] = useState([
    {
      name: "Profile",
      to: "/profile",
      authenticated: true
    },
    {
      name: "Settings",
      to: "/settings",
      authenticated: true
    },
    {
      name: "Logout",
      onClick: logout,
      authenticated: true
    },
    {
      name: "Login",
      onClick: login,
      authenticated: false
    }
  ]);

  function handleOpenMenu(event) {
    setAnchorElement(event.currentTarget);
  }

  function handleCloseMenu(event) {
    setAnchorElement(null);
  }

  function handleAuthenticationUpdated(isAuthenticated) {
    setLoggedIn(isAuthenticated);
  }

  useEffect(() => {
    onAuthenticationUpdated(handleAuthenticationUpdated);
    return function cleanup() {
      offAuthenticationUpdated(handleAuthenticationUpdated);
    }
  }, []);

  return (
    <AppBar color="primary" position="sticky">
      <Toolbar>
        <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
          <MenuIcon/>
        </IconButton>
        <Typography variant="h5" color="textPrimary" className={classes.title}>
          <Link component={RouterLink} to="/" underline="none" color="textPrimary" className={classes.title}>
            Streaming Playground
          </Link>
        </Typography>

        <IconButton color="inherit" onClick={handleOpenMenu}>
          <UserAvatar/>
        </IconButton>

        <Menu
          anchorEl={anchorElement}
          open={Boolean(anchorElement)}
          onClose={handleCloseMenu}
        >
          {menuItems
            .filter(menuItem => loggedIn === menuItem.authenticated)
            .map((menuItem, index) => {
              let component;
              if (menuItem.to) {
                component = (
                  <MenuItem
                    key={index}
                    component={Link}
                    to={menuItem.to}
                    onClick={handleCloseMenu}
                  >
                    {menuItem.name}
                  </MenuItem>
                );
              } else {
                component = (
                  <MenuItem
                    key={index}
                    onClick={() => {
                      handleCloseMenu();
                      menuItem.onClick();
                    }}
                  >
                    {menuItem.name}
                  </MenuItem>
                );
              }
              return component;
            })}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}