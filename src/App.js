import React, {useEffect, useState} from "react";
import {useHistory} from "react-router-dom";
import {onError} from "./libs/errorLib";
import {useAuthContext} from "./contexts/AuthContext";
import Box from "@material-ui/core/Box";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Bar from "./components/common/Bar";
import Routes from "./Routes";
import {SnackbarProvider} from 'notistack';
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
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const {login, logout} = useAuthContext();
  const [apolloClient, setApolloClient] = useState();

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
        if (e !== 'No current user') {
          onError(e);
        }
      }

      setIsAuthenticating(false);
    }

    onLoad();
  }, []);

  async function handleLogout() {
    logout();
    history.push("/login");
  }

  return (
    <>
      {apolloClient &&
      <ApolloProvider client={apolloClient}>
        <ErrorBoundary>
          <SnackbarProvider maxSnack={4}>
            <Bar logout={handleLogout}/>
            {isAuthenticating && <Loading/>}
            {!isAuthenticating && <Box my={2}>
              <Routes/>
            </Box>}
          </SnackbarProvider>
        </ErrorBoundary>
      </ApolloProvider>}
    </>
  );
}

export default App
