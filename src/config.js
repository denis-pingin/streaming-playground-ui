const dev = {
  STRIPE_KEY: "pk_test_v1amvR35uoCNduJfkqGB8RLD",
  s3: {
    REGION: "eu-central-1",
    BUCKET: "streaming-playground-api-dev-attachmentsbucket-1alswu0csdova"
  },
  apiGateway: {
    REGION: "eu-central-1",
    URL: "https://afj3jkm2f8.execute-api.eu-central-1.amazonaws.com/dev"
  },
  cognito: {
    REGION: "eu-central-1",
    USER_POOL_ID: "eu-central-1_0s0wp6Irh",
    APP_CLIENT_ID: "1q3jufjau46flpm89v9npjq74",
    IDENTITY_POOL_ID: "eu-central-1:df62caa9-ce3d-4761-a7d9-4da91c84dad5"
  }
};

const prod = {
  STRIPE_KEY: "pk_test_v1amvR35uoCNduJfkqGB8RLD",
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
  }
};

// Default to dev if not set
const config = process.env.REACT_APP_STAGE === 'prod'
  ? prod
  : dev;

export default {
  // Add common config values here
  MAX_ATTACHMENT_SIZE: 5000000,
  ...config
};
