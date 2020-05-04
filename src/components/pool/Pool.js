import React, {useEffect, useRef, useState} from "react";
import {useHistory, useParams} from "react-router-dom";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Fab from "@material-ui/core/Fab";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import StreamingStatus from "./StreamingStatus";
import {useAuthContext} from "../../contexts/AuthContext";
import {useOpenTokContext} from "../../contexts/OpenTokContext";
import ConfirmationDialog from "../dialog/ConfirmationDialog";
import StreamCard from "../stream/StreamCard";
import {useSnackbar} from 'notistack';
import {useMutation, useQuery} from 'react-apollo';
import Loading from "../common/Loading";
import Error from "../common/Error";
import {DeletePoolMutation, PoolDeletedSubscription, GetPoolQuery, PoolUpdatedSubscription} from "../../graphql/pool";
import {
  StreamUpdatedSubscription,
  StreamingStartedSubscription,
  StreamingStoppedSubscription
} from "../../graphql/stream";
import EditPoolDialog from "./EditPoolDialog";

export default function Pool() {
  const history = useHistory();
  const {poolId} = useParams();
  const {enqueueSnackbar} = useSnackbar();
  const {getUserInfo} = useAuthContext();
  const {openTokStartSession, openTokStopSession, openTokIsSessionConnected} = useOpenTokContext();
  const [isMyPool, setIsMyPool] = useState(false);
  const [isOpenTokSessionConnected, setIsOpenTokSessionConnected] = useState(openTokIsSessionConnected());
  const [openTokStreams, setOpenTokStreams] = useState({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editPoolDialogOpen, setEditPoolDialogOpen] = useState(false);
  const [, setResizeState] = useState(null);
  const myStreamId = useRef();

  // Get pool query
  const {loading, error, data, subscribeToMore} = useQuery(GetPoolQuery, {
    variables: {
      poolId: poolId
    },
    onCompleted: (data) => {
      console.log("Loaded pool data:", data);

      // Create OpenTok session
      if (data.pool.openTokSessionConfig && data.pool.openTokSessionConfig.openTokToken) {
        openTokStartSession(data.pool.openTokSessionConfig, openTokSessionCallback);
      }
    },
    onError: (error) => {
      console.log(error);
      enqueueSnackbar(`Failed to retrieve pool: ${error}`, 'error');
    }
  });

  // Delete pool mutation
  const [deletePool, {loading: deletePoolLoading}] = useMutation(DeletePoolMutation, {
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

  function getMyStreamId() {
    return myStreamId.current;
  }

  function setMyStreamId(streamId) {
    myStreamId.current = streamId;
  }

  function openTokSessionCallback(event) {
    switch (event.type) {
      case "sessionConnected":
        console.log("OpenTok session connected:", event);
        setIsOpenTokSessionConnected(openTokIsSessionConnected());
        break;
      case "streamCreated":
        console.log("New OpenTok stream created:", event);
        openTokStreams[event.stream.id] = event.stream;
        setOpenTokStreams(openTokStreams => ({...openTokStreams, [event.stream.id]: event.stream}));
        break;
      case "streamDestroyed":
        console.log("OpenTok stream destroyed:", event);
        setOpenTokStreams(openTokStreams => ({...openTokStreams, [event.stream.id]: null}));
        break;
      default:
        console.log("Received unexpected OpenTok event:", event);
    }
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
      setIsMyPool(userInfo && pool && pool.ownerUserId === userInfo.id);
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
      document: PoolUpdatedSubscription,
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("PoolUpdatedSubscription", subscriptionData)
        if (!subscriptionData.data) {
          return prevData;
        }
        return {
          pool: subscriptionData.data.poolUpdated
        };
      }
    });
    subscribeToMore({
      document: PoolDeletedSubscription,
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("PoolDeletedSubscription", subscriptionData)
        enqueueSnackbar(`Pool ${subscriptionData.data.poolDeleted.name} was deleted`, 'success');
        history.push("/");
      }
    });
    subscribeToMore({
      document: StreamingStartedSubscription,
      variables: {
        poolId: poolId
      },
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("StreamingStartedSubscription", subscriptionData)
        if (!subscriptionData.data) {
          return prevData;
        }
        const stream = subscriptionData.data.streamingStarted;

        let streams;
        const index = prevData.pool.streams.findIndex((item) => item.streamId === stream.streamId);
        if (index === -1) {
          streams = [...prevData.pool.streams, stream];
        } else {
          streams = prevData.pool.streams.map(item=> item.streamId === stream.streamId ? stream : item)
        }

        return {
          pool: {
            ...prevData.pool,
            streams: streams
          }
        };
      }
    });
    subscribeToMore({
      document: StreamingStoppedSubscription,
      variables: {
        poolId: poolId
      },
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("StreamingStoppedSubscription", subscriptionData)
        if (!subscriptionData.data) {
          return prevData;
        }
        const stream = subscriptionData.data.streamingStopped;

        return {
          pool: {
            ...prevData.pool,
            streams: prevData.pool.streams.filter(item => item.streamId !== stream.streamId)
          }
        };
      }
    });
    subscribeToMore({
      document: StreamUpdatedSubscription,
      variables: {
        poolId: poolId
      },
      updateQuery: (prevData, { subscriptionData }) => {
        console.log("StreamUpdatedSubscription", subscriptionData)
        if (!subscriptionData.data) {
          return prevData;
        }
        const stream = subscriptionData.data.streamUpdated;

        return {
          pool: {
            ...prevData.pool,
            streams: prevData.pool.streams.map(item=> item.streamId === stream.streamId ? stream : item)
          }
        };
      }
    });

    return function cleanup() {
      // Cleanup OpenTok session
      if (openTokIsSessionConnected()) {
        openTokStopSession();
      }
    };
  }, []);

  function handleDelete(event) {
    setShowDeleteConfirmation(true);
  }

  function handleDeleteConfirmation(result) {
    setShowDeleteConfirmation(false);
    if (result) {
      return deletePool();
    }
  }

  function handleEditPool() {
    setEditPoolDialogOpen(true);
  }

  function isLoading() {
    return loading || deletePoolLoading;
  }

  function renderStreams(streams) {
    return (
      <Grid container spacing={3}>
        {streams
          .filter((stream) => stream.streamId !== getMyStreamId())
          .map(stream => (
            <Grid item key={stream.streamId} xs={12} sm={6} md={4} lg={3} xl={2}>
              <StreamCard stream={stream} openTokStream={openTokStreams[stream.openTokStreamId]}/>
            </Grid>
          ))}
      </Grid>
    );
  }

  return (<>
      {loading && <Loading/>}
      {!loading && error && <Error error={error}/>}
      {!loading && !error &&
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
                   onClick={handleEditPool}
                   disabled={isLoading()}>
                <EditIcon/>
              </Fab>
            </Grid>
          </>}
          <Grid item>
            <StreamingStatus
              pool={data.pool}
              streamIdUpdated={setMyStreamId}
              disabled={!isOpenTokSessionConnected || isLoading()}
            />
          </Grid>
          <Grid item>
            <Typography component="h1" variant="h3" color="textPrimary" gutterBottom>
              {data.pool.name}
            </Typography>
          </Grid>
        </Grid>
        {data.pool.streams && renderStreams(data.pool.streams)}
      </Container>}
    </>
  )
}
