const offline = {
  s3: {
    REGION: "localhost",
    BUCKET: ""
  },
  apiGateway: {
    REGION: "localhost",
    URL: "http://localhost:4000/offline"
  },
  cognito: {
    REGION: "localhost",
    USER_POOL_ID: "eu-central-1_xxxxxxxxx",
    APP_CLIENT_ID: "offlineAppClientId",
    IDENTITY_POOL_ID: "offlineIdentityPoolId"
  },
  websocket: {
    URL: "ws://localhost:4001"
  }
};

const dev = {
  s3: {
    REGION: "eu-central-1",
    BUCKET: "streaming-playground-api-dev-attachmentsbucket-ny4fj5oz3abo"
  },
  apiGateway: {
    REGION: "eu-central-1",
    URL: "https://9tlygji4yd.execute-api.eu-central-1.amazonaws.com/dev"
  },
  cognito: {
    REGION: "eu-central-1",
    USER_POOL_ID: "eu-central-1_sJQv7BsQg",
    APP_CLIENT_ID: "7gq6p4ekjes2u7adaka47do07p",
    IDENTITY_POOL_ID: "eu-central-1:491e207a-da5b-446e-a964-e80d24c373fc"
  },
  websocket: {
    URL: "wss://3lny6x8mr4.execute-api.eu-central-1.amazonaws.com/dev"
  }
};

const prod = {
  s3: {
    REGION: "eu-central-1",
    BUCKET: ""
  },
  apiGateway: {
    REGION: "eu-central-1",
    URL: ""
  },
  cognito: {
    REGION: "eu-central-1",
    USER_POOL_ID: "",
    APP_CLIENT_ID: "",
    IDENTITY_POOL_ID: ""
  },
  websocket: {
    URL: ""
  }
};

// Default to dev if not set
const config = process.env.REACT_APP_STAGE === 'offline'
  ? offline
  : process.env.REACT_APP_STAGE === 'prod'
    ? prod
    : dev;

export default {
  // Add common config values here
  MAX_ATTACHMENT_SIZE: 5000000,
  ...config
};
