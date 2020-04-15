import React from "react";
import {logError} from "../libs/errorLib";
import withStyles from "@material-ui/core/styles/withStyles";
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    "padding-top": "100px",
    "text-align": "center"
  },
});

class ErrorBoundary extends React.Component {
  state = {hasError: false};

  static getDerivedStateFromError(error, errorInfo) {
    return {
      hasError: true,
      error: error,
      errorInfo: errorInfo
    };
  }

  componentDidCatch(error, errorInfo) {
    logError(error, errorInfo);
  }

  render() {
    const {classes} = this.props;
    return this.state.hasError ? (
      <div className={classes.root}>
        <h3>Sorry there was a problem loading this page</h3>
        <div>{this.state.error}</div>
        <div>{this.state.errorInfo}</div>
      </div>
    ) : (
      this.props.children
    );
  }
}

ErrorBoundary.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ErrorBoundary);