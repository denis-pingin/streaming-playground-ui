import React, {useEffect, useRef, useState} from "react";
import {useHistory, useParams} from "react-router-dom";
import {onError} from "../libs/errorLib";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Fab from "@material-ui/core/Fab";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import StreamingStatus from "../components/StreamingStatus";
import {useAuthContext} from "../contexts/AuthContext";
import {useOpenTokContext} from "../contexts/OpenTokContext";
import ConfirmationDialog from "../components/ConfirmationDialog";
import StreamCard from "../components/StreamCard";
import {useSnackbar} from 'notistack';
import {useMutation, useQuery} from 'react-apollo';
import Loading from "../components/Loading";
import Error from "../components/Error";
import {DELETE_POOL_MUTATION, POOL_DELETED_SUBSCRIPTION, POOL_QUERY, POOL_UPDATED_SUBSCRIPTION} from "../graphql/pool";
import {
  STREAM_UPDATED_SUBSCRIPTION,
  STREAMING_STARTED_SUBSCRIPTION,
  STREAMING_STOPPED_SUBSCRIPTION
} from "../graphql/stream";
import {STREAMING_STATUS_UPDATED_SUBSCRIPTION} from "../graphql/user";
import EditPoolDialog from "../components/EditPoolDialog";

export default function Pool() {
  const {poolId} = useParams();
  const history = useHistory();
  const {enqueueSnackbar} = useSnackbar();
  const {getUserInfo} = useAuthContext();
  const {openTokStartSession, openTokStopSession, openTokIsSessionConnected} = useOpenTokContext();
  const [isMyPool, setIsMyPool] = useState(false);
  const [isOpenTokSessionConnected, setIsOpenTokSessionConnected] = useState(openTokIsSessionConnected());
  const [openTokStreams, setOpenTokStreams] = useState({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [, setResizeState] = useState(null);
  const [currentStreamId, setCurrentStreamId] = useState(null);
  const currentStreamIdRef = useRef(currentStreamId);
  const [editPoolDialogOpen, setEditPoolDialogOpen] = useState(false);

  // Pool query
  const {loading, error, data, subscribeToMore} = useQuery(POOL_QUERY, {
    variables: {
      poolId: poolId
    },
    onCompleted: (data) => {
      console.log("Loaded pool data:", data);

      // Create OpenTok session
      if (data.pool.openTokSessionConfig && data.pool.openTokSessionConfig.openTokToken) {
        console.log("Starting OpenTok session");
        startOpenTokSession(data.pool.openTokSessionConfig);
      }
    },
    onError: (error) => {
      console.log(error);
      enqueueSnackbar(`Failed to retrieve pool: ${error}`, 'error');
    }
  });

  // Delete pool mutation
  const [deletePool, {loading: deletePoolLoading}] = useMutation(DELETE_POOL_MUTATION, {
    variables: {
      poolId: poolId
    },
    onCompleted: (data) => {
      enqueueSnackbar(`Pool ${data.deletePool.name} deleted`, 'success');
      history.push("/");
    },
    onError: (error) => {
      console.log(error);
      enqueueSnackbar(`Failed to delete pool ${data.deletePool.name}: ${error}`, 'error');
    }
  });

  function startOpenTokSession(openTokSessionConfig) {
    console.log("Pool: starting new OpenTok session");
    openTokStartSession(openTokSessionConfig.apiKey, openTokSessionConfig.sessionId, openTokSessionConfig.openTokToken, function (event) {
      switch (event.type) {
        case "sessionConnected":
          console.log("Pool: OpenTok session connected:", event);
          setIsOpenTokSessionConnected(openTokIsSessionConnected());
          break;
        case "streamCreated":
          console.log("Pool: new OpenTok stream created:", event);
          openTokStreams[event.stream.id] = event.stream;
          setOpenTokStreams(openTokStreams => ({...openTokStreams, [event.stream.id]: event.stream}));
          break;
        case "streamDestroyed":
          console.log("Pool: OpenTok stream destroyed:", event);
          setOpenTokStreams(openTokStreams => ({...openTokStreams, [event.stream.id]: null}));
          break;
        default:
          console.log("Pool: received unexpected OpenTok event:", event);
      }
    });
  }

  function getCurrentStreamId() {
    return currentStreamIdRef.current;
  }

  function updateCurrentStreamId(currentStreamId) {
    console.log("Pool: updated currentStreamId:", currentStreamId);
    currentStreamIdRef.current = currentStreamId;
    setCurrentStreamId(currentStreamId);
  }

  // Resize listener and pool ownership update
  useEffect(() => {
    function handleResize() {
      setResizeState({
        height: window.innerHeight,
        width: window.innerWidth
      });
    }

    function checkPoolOwnership(pool, userInfo) {
      const ownPool = userInfo && pool && pool.ownerUserId === userInfo.id;
      setIsMyPool(ownPool);
    }

    if (!loading && !error) {
      checkPoolOwnership(data.pool, getUserInfo());
    }
    window.addEventListener('resize', handleResize)
    return function cleanup() {
      window.removeEventListener('resize', handleResize);
    }
  });

  // Init / cleanup once
  useEffect(() => {
    subscribeToMore({
      document: POOL_UPDATED_SUBSCRIPTION,
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("POOL_UPDATED_SUBSCRIPTION", prevData, subscriptionData)
        if (!subscriptionData.data) {
          return prevData;
        }
        return {
          pool: subscriptionData.data.poolUpdated
        };
      }
    });
    subscribeToMore({
      document: POOL_DELETED_SUBSCRIPTION,
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("POOL_DELETED_SUBSCRIPTION", prevData, subscriptionData)
        enqueueSnackbar(`Pool ${subscriptionData.data.poolDeleted.name} was deleted`, 'success');
        history.push("/");
      }
    });
    subscribeToMore({
      document: STREAMING_STARTED_SUBSCRIPTION,
      variables: {
        poolId: poolId
      },
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("STREAMING_STARTED_SUBSCRIPTION", prevData, subscriptionData)
        if (!subscriptionData.data) {
          return prevData;
        }
        const stream = subscriptionData.data.streamingStarted;

        const result = {
          pool: {
            ...prevData.pool,
            streams: [...prevData.pool.streams, stream]
          },
          profile: prevData.profile
        };
        return result;
      }
    });
    subscribeToMore({
      document: STREAMING_STOPPED_SUBSCRIPTION,
      variables: {
        poolId: poolId
      },
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("STREAMING_STOPPED_SUBSCRIPTION", prevData, subscriptionData)
        if (!subscriptionData.data) {
          return prevData;
        }
        const stream = subscriptionData.data.streamingStopped;

        const result = {
          pool: {
            ...prevData.pool,
            streams: prevData.pool.streams.filter(item => item.streamId !== stream.streamId)
          },
          profile: prevData.profile
        };
        return result;
      }
    });
    subscribeToMore({
      document: STREAM_UPDATED_SUBSCRIPTION,
      variables: {
        poolId: poolId
      },
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("STREAM_UPDATED_SUBSCRIPTION", prevData, subscriptionData)
        if (!subscriptionData.data) {
          return prevData;
        }
        const stream = subscriptionData.data.streamUpdated;

        console.log("prevData", JSON.stringify(prevData))

        const result = {
          pool: {
            ...prevData.pool,
            streams: prevData.pool.streams.map(item=> item.streamId === stream.streamId ? stream : item)
          },
          profile: prevData.profile
        };

        console.log("result", JSON.stringify(result));

        return result;
      }
    });
    subscribeToMore({
      document: STREAMING_STATUS_UPDATED_SUBSCRIPTION,
      variables: {
        userId: getUserInfo().id
      },
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("STREAMING_STATUS_UPDATED", prevData, subscriptionData)
        if (!subscriptionData.data) {
          return prevData;
        }
        const streamingStatus = subscriptionData.data.streamingStatusUpdated;

        return {
          pool: prevData.pool,
          profile: {
            ...prevData.profile,
            streamingStatus: streamingStatus
          }
        };
      }
    });

    return function cleanup() {
      // Cleanup OpenTok session
      if (openTokIsSessionConnected()) {
        console.log("Cleaning up OpenTok session");
        openTokStopSession();
      }
    };
  }, []);

  async function handleDelete(event) {
    setShowDeleteConfirmation(true);
  }

  async function handleDeleteConfirmation(result) {
    setShowDeleteConfirmation(false);
    if (result) {
      try {
        deletePool();
      } catch (e) {
        onError(e);
      }
    }
  }

  function renderStreamsList(streams) {
    return streams
      .filter((stream) => stream.streamId !== getCurrentStreamId())
      .map(stream => (
          <Grid item key={stream.streamId} xs={12} sm={6} md={4} lg={3} xl={2}>
            <StreamCard stream={stream} openTokStream={openTokStreams[stream.openTokStreamId]}/>
          </Grid>
      ));
  }

  function handleEdit() {
    setEditPoolDialogOpen(true);
  }

  function isLoading() {
    return loading || deletePoolLoading;
  }

  return (<>
      {loading && <Loading/>}
      {!loading && error && <Error error={error}/>}
      {!loading && !error && data.pool &&
      <Container component="main" maxWidth="xl">
        <Grid container spacing={3}>
          {isMyPool &&
          <>
            {showDeleteConfirmation &&
            <ConfirmationDialog
              title="Delete pool?"
              text={`Are you sure you want to delete pool ${data.pool.name}?`}
              result={handleDeleteConfirmation}/>}
            <Grid item>
              <Fab color="primary"
                   aria-label="delete"
                   size="medium"
                   onClick={handleDelete}
                   disabled={isLoading()}>
                <DeleteIcon/>
              </Fab>
            </Grid>
            {editPoolDialogOpen && <EditPoolDialog open={editPoolDialogOpen} pool={data.pool} openStateChanged={setEditPoolDialogOpen}/>}
            <Grid item>
              <Fab color="primary"
                   aria-label="delete"
                   size="medium"
                   onClick={handleEdit}
                   disabled={isLoading()}>
                <EditIcon/>
              </Fab>
            </Grid>
          </>}
          <Grid item>
            <StreamingStatus
              pool={data.pool}
              enabled={isOpenTokSessionConnected}
              streamIdUpdated={updateCurrentStreamId}
              disabled={isLoading()}
            />
          </Grid>
          <Grid item>
            <Typography component="h1" variant="h3" color="textPrimary" gutterBottom>
              {data.pool.name}
            </Typography>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          {data.pool.streams && renderStreamsList(data.pool.streams)}
        </Grid>
      </Container>}
    </>
  )
}
