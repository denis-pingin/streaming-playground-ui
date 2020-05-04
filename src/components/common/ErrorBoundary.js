import React from "react";
import {logError} from "../../libs/errorLib";
import Typography from "@material-ui/core/Typography";

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
    return this.state.hasError ? (
      <>
        <Typography component="h4" variant="h4">
          Sorry there was a problem loading this page
        </Typography>
        <Typography>
          {this.state.error}
        </Typography>
        <Typography>
          {this.state.errorInfo}
        </Typography>
      </>
    ) : (
      this.props.children
    );
  }
}

export default ErrorBoundary;