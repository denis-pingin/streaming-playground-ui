import makeStyles from "@material-ui/core/styles/makeStyles";
import React from "react";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
}));

export default function Error({error}) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography component="h4" variant="h6" color="error">
        Failed to load data
      </Typography>
      <Typography>
        {JSON.stringify(error)}
      </Typography>
    </div>
  )
}