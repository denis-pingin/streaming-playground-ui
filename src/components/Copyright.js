import Typography from "@material-ui/core/Typography";
import {Link as RouterLink} from "react-router-dom";
import React from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Link from "@material-ui/core/Link";

const useStyles = makeStyles((theme) => ({
  copyright: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(3),
    width: "100%"
  }
}));

export default function Copyright() {
  const classes = useStyles();

  return (
    <Typography variant="body2" color="textSecondary" align="center" className={classes.copyright}>
      {'Copyright © '}
      <Link component={RouterLink} to="/" color="textSecondary">playpool.cc</Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}