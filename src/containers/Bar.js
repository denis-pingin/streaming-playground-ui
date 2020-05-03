import React, {useState} from "react";
import {Link as RouterLink} from "react-router-dom";
import {AppBar, Divider, IconButton, Menu, MenuItem, Toolbar, Typography} from "@material-ui/core";
import UserAvatar from "../components/UserAvatar";
import {useAuthContext} from "../contexts/AuthContext";
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

export default function Bar({logout, ...props}) {
  const classes = useStyles();
  const {isAuthenticated} = useAuthContext();
  const [anchorElement, setAnchorElement] = useState(null);
  const [menuItems, setMenuItems] = useState([
    {
      name: "Profile",
      to: "/profile"
    },
    {
      name: "Settings",
      to: "/settings"
    },
    {
      name: "Logout",
      divide: true,
      onClick: logout
    }
  ]);

  function handleOpenMenu(event) {
    setAnchorElement(event.currentTarget);
  }

  function handleCloseMenu(event) {
    setAnchorElement(null);
  }

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

        {isAuthenticated() && (
          <>
            <IconButton color="inherit" onClick={handleOpenMenu}>
              <UserAvatar/>
            </IconButton>

            <Menu
              anchorEl={anchorElement}
              open={Boolean(anchorElement)}
              onClose={handleCloseMenu}
            >
              {menuItems.map((menuItem, index) => {
                if (menuItem.hasOwnProperty("condition") && !menuItem.condition) {
                  return null;
                }

                let component = null;

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

                if (menuItem.divide) {
                  return (
                    <span key={index}>
                      <Divider/>
                      {component}
                    </span>
                  );
                }
                return component;
              })}
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}