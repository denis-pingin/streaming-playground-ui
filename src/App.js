import React, {useEffect, useRef, useState} from "react";
import {useHistory, useLocation} from "react-router-dom";
import {onError} from "./libs/errorLib";
import {useAuthContext} from "./contexts/AuthContext";
import Box from "@material-ui/core/Box";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Bar from "./components/common/Bar";
import Routes from "./Routes";
import {useSnackbar} from 'notistack';
import Loading from "./components/common/Loading";
import {ApolloProvider} from "react-apollo";
import {SubscriptionClient} from "subscriptions-transport-ws";
import config from "./config";
import {WebSocketLink} from "apollo-link-ws";
import {HttpLink} from "apollo-link-http";
import {ApolloLink} from "apollo-link";
import ApolloClient from "apollo-client";
import {defaultDataIdFromObject, InMemoryCache} from "apollo-cache-inmemory";
import {Auth} from 'aws-amplify';
import aws4 from "@aws-amplify/core/lib/Signer";

function App() {
  const history = useHistory();
  const location = useLocation();
  const {enqueueSnackbar} = useSnackbar();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const {login, logout} = useAuthContext();
  const [apolloClient, setApolloClient] = useState();
  const locationRef = useRef(location);

  function init() {
    const wsClient = new SubscriptionClient(
      config.websocket.URL,
      {
        reconnect: true,
        timeout: 30000
      },
      null,
      [],
    );

    const hasSubscriptionOperation = ({query: {definitions}}) => {
      return definitions.some(
        ({kind, operation}) =>
          kind === 'OperationDefinition' && operation === 'subscription',
      )
    }

    const websocketLink = new WebSocketLink(wsClient);
    websocketLink.subscriptionClient.maxConnectTimeGenerator.duration = () =>
      websocketLink.subscriptionClient.maxConnectTimeGenerator.max

    const awsGraphqlFetch = (uri, options) => {
      options = options || {};
      return Auth.currentCredentials().then((data) => {
        const request = {
          url: uri,
          data: options.body,
          ...options
        }
        const credentials = {
          'secret_key': data.secretAccessKey,
          'access_key': data.accessKeyId,
          'session_token': data.sessionToken
        };
        const service = {
          region: config.apiGateway.REGION,
          service: "execute-api"
        }
        aws4.sign(request, credentials, service);
        return fetch(uri, request);
      })
    }

    const httpLink = new HttpLink({
      uri: config.apiGateway.URL + "/graphql",
      fetch: awsGraphqlFetch
    });

    const link = ApolloLink.split(
      hasSubscriptionOperation,
      websocketLink,
      httpLink,
    )

    const apolloClient = new ApolloClient({
      cache: new InMemoryCache({
        dataIdFromObject: object => {
          switch (object.__typename) {
            case 'Pool':
              return object.poolId;
            case 'Stream':
              return object.streamId;
            case 'User':
              return object.userId
            default:
              return defaultDataIdFromObject(object);
          }
        }
      }),
      link
    });
    setApolloClient(apolloClient);
  }

  useEffect(() => {
    async function onLoad() {
      try {
        await login();
        init();
      } catch (e) {
        onError(e);
      }
      setIsAuthenticating(false);
    }
    onLoad();
  }, []);

  useEffect(() => {
    async function onLoad() {
      locationRef.current = location;
    }
    onLoad();
  }, [location]);

  function handleLogin() {
    history.push(`/login?redirect=${locationRef.current.pathname}${locationRef.current.search}`)
  }

  async function handleLogout() {
    await logout();
    enqueueSnackbar("Successfully logged out");
  }

  return (
    <>
      {apolloClient &&
      <ApolloProvider client={apolloClient}>
        <ErrorBoundary>
          <Bar login={handleLogin} logout={handleLogout}/>
          {isAuthenticating && <Loading/>}
          {!isAuthenticating && <Box my={2}>
            <Routes/>
          </Box>}
        </ErrorBoundary>
      </ApolloProvider>}
    </>
  );
}

export default App
