import React from 'react';
import ReactDOM from 'react-dom';
import { Amplify } from 'aws-amplify';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App';
import config from './config';
import { initSentry } from './libs/errorLib';
import * as serviceWorker from './serviceWorker';

initSentry();

Amplify.configure({
  Auth: {
    mandatorySignIn: true,
    region: config.cognito.REGION,
    userPoolId: config.cognito.USER_POOL_ID,
    identityPoolId: config.cognito.IDENTITY_POOL_ID,
    userPoolWebClientId: config.cognito.APP_CLIENT_ID
  },
  Storage: {
    region: config.s3.REGION,
    bucket: config.s3.BUCKET,
    identityPoolId: config.cognito.IDENTITY_POOL_ID
  },
  API: {
    endpoints: [
      {
        name: "streams",
        endpoint: config.apiGateway.URL,
        region: config.apiGateway.REGION
      },
      {
        name: "streaming",
        endpoint: config.apiGateway.URL + "/streaming",
        region: config.apiGateway.REGION
      },
    ]
  }
});

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
