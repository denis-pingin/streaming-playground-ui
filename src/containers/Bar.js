import React, {useState} from "react";
import {Link as RouterLink} from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  ButtonGroup,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography
} from "@material-ui/core";
import UserAvatar from "../components/UserAvatar";
import {useAuthContext} from "../libs/AuthContext";
import Link from "@material-ui/core/Link";

export default function Bar({logout, ...props}) {
  const {isAuthenticated, userInfo} = useAuthContext();
  const [anchorElement, setAnchorElement] = useState(null);
  const [menuItems, setMenuItems] = useState([
    {
      name: "Profile",
      to: userInfo ? `/user/${userInfo.id}` : null
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
    <AppBar color="primary" position="static">
      <Toolbar>
        <Box display="flex" flexGrow={1}>
          <Typography variant="h6">
            <Link component={RouterLink} to="/" underline="none" color="textPrimary">
              Streaming Playground
            </Link>
          </Typography>
        </Box>

        {isAuthenticated && (
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

        {!isAuthenticated && (
          <ButtonGroup variant="outlined">
            <Button component={RouterLink} to="/login">Login</Button>
            <Button component={RouterLink} to="/signup">Sign Up</Button>
          </ButtonGroup>
        )}
      </Toolbar>
    </AppBar>
  );
}