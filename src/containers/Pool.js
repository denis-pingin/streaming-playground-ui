import React, {useEffect, useRef, useState} from "react";
import {API} from "aws-amplify";
import {useHistory, useParams} from "react-router-dom";
import {onError} from "../libs/errorLib";
import Container from "@material-ui/core/Container";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Fab from "@material-ui/core/Fab";
import DeleteIcon from "@material-ui/icons/Delete";
import StreamingStatus from "../components/StreamingStatus";
import {useAuthContext} from "../contexts/AuthContext";
import {useOpenTokContext} from "../contexts/OpenTokContext";
import {useWebsocketContext} from "../contexts/WebsocketContext";
import ConfirmationDialog from "../components/ConfirmationDialog";
import StreamCard from "../components/StreamCard";
import {useSnackbar} from 'notistack';

const useStyles = makeStyles((theme) => ({}));

export default function Pool() {
  const classes = useStyles();
  const {poolId} = useParams();
  const history = useHistory();
  const {enqueueSnackbar} = useSnackbar();
  const {userInfo} = useAuthContext();
  const {websocketSend, websocketSubscribe, websocketUnsubscribe, websocketIsConnected, websocketOn, websocketOff} = useWebsocketContext();
  const {openTokStartSession, openTokStopSession, openTokIsSessionConnected} = useOpenTokContext();
  const [pool, setPool] = useState(null);
  const [streams, setStreams] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMyPool, setIsMyPool] = useState(false);
  const isInPool = useRef(false);
  const [isOpenTokSessionConnected, setIsOpenTokSessionConnected] = useState(openTokIsSessionConnected());
  const [openTokStreams, setOpenTokStreams] = useState({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [, setResizeState] = useState(null);
  const [currentStreamId, setCurrentStreamId] = useState(null);
  const currentStreamIdRef = useRef(currentStreamId);

  function getIsInPool() {
    return isInPool.current;
  }

  function setIsInPool(value) {
    isInPool.current = value;
  }

  function loadUserProfile() {
    return API.get("user", `/profile`);
  }

  function loadPool() {
    return API.get("pools", `/${poolId}`);
  }

  function deletePool() {
    return API.del("pools", `/${poolId}`);
  }

  function loadStreams() {
    return API.get("pools", `/${poolId}/streams`);
  }

  function startOpenTokSession(openTokSessionConfig, openTokToken) {
    console.log("Pool: starting new OpenTok session");
    openTokStartSession(openTokSessionConfig.apiKey, openTokSessionConfig.sessionId, openTokToken, function (event) {
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

  function updateStreams(event) {
    loadStreams().then((streams) => {
      const currentStreamId = getCurrentStreamId();
      console.log("Loaded streams:", streams);
      if (currentStreamId) {
        streams.forEach((stream) => {
          stream.own = stream.streamId === currentStreamId;
        });
      }
      setStreams(streams)
    });
  }

  function handleUserProfileUpdated(event) {
    if (event.data && event.data.streamingStatus) {
      updateCurrentStreamId(event.data.streamingStatus.streamId);
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
      const ownPool = userInfo && pool && pool.ownerUserId === userInfo.id;
      setIsMyPool(ownPool);
    }

    checkPoolOwnership(pool, userInfo);
    window.addEventListener('resize', handleResize)
    return function cleanup() {
      window.removeEventListener('resize', handleResize);
    }
  });

  // Pool registration / unregistration
  useEffect(() => {
    function tryEnterPool() {
      if (!getIsInPool() && pool && websocketIsConnected()) {
        console.log("Entering pool");
        websocketSubscribe("streamCreated", updateStreams);
        websocketSubscribe("streamUpdated", updateStreams);
        websocketSubscribe("streamDeleted", updateStreams);
        websocketSubscribe("userProfileUpdated", handleUserProfileUpdated);
        websocketSend("enterPool", {
          poolId: pool.poolId
        });
        setIsInPool(true);
      }
    }

    function tryExitPool() {
      if (getIsInPool() && pool && websocketIsConnected()) {
        console.log("Exiting pool");
        websocketUnsubscribe("streamCreated", updateStreams);
        websocketUnsubscribe("streamUpdated", updateStreams);
        websocketUnsubscribe("streamDeleted", updateStreams);
        websocketUnsubscribe("userProfileUpdated", handleUserProfileUpdated);
        websocketSend("exitPool", {
          poolId: pool.poolId
        });
        setIsInPool(false);
      }
    }

    function websocketCallback() {
      tryEnterPool();
    }

    websocketOn(websocketCallback);
    tryEnterPool();

    return function cleanup() {
      websocketOff(websocketCallback);
      tryExitPool();
    }
  }, [pool]);

  // Init / cleanup once
  useEffect(() => {
    async function onLoad() {
      console.log("Pool load starting");
      try {
        // Load pool
        const pool = await loadPool();
        console.log("Loaded pool:", pool);
        setPool(pool);

        // Load streaming status
        const streamingStatus = (await loadUserProfile()).streamingStatus;
        console.log("Loaded streaming status:", streamingStatus);
        updateCurrentStreamId(streamingStatus.streamId);

        // Create OpenTok session
        if (pool.openTokSessionConfig && streamingStatus.openTokToken) {
          console.log("Starting OpenTok session");
          startOpenTokSession(pool.openTokSessionConfig, streamingStatus.openTokToken);
        }

        // Load streams
        updateStreams();
        console.log("Pool load done");
      } catch (e) {
        onError(e);
      }
    }

    onLoad();
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
      setIsLoading(true);
      try {
        await deletePool();
        enqueueSnackbar(`Pool ${pool.name} deleted`, 'success');
        history.push("/");
      } catch (e) {
        onError(e);
        setIsLoading(false);
      }
    }
  }

  function renderStreamsList(streams) {
    return streams
      .filter((stream) => !stream.own)
      .map((stream, i) => {
        return (
          <Grid item key={stream.streamId} xs={12} sm={6} md={4} lg={3} xl={2}>
            <StreamCard stream={stream} openTokStream={openTokStreams[stream.openTokStreamId]}/>
          </Grid>
        )
      });
  }

  return (
    pool &&
    <Container component="main" maxWidth="xl">
      <Grid container spacing={3}>
        {isMyPool &&
        <>
          {showDeleteConfirmation &&
          <ConfirmationDialog
            title="Delete pool?"
            text={`Are you sure you want to delete pool ${pool.name}?`}
            result={handleDeleteConfirmation}/>}
          <Grid item>
            <Fab color="primary"
                 aria-label="delete"
                 size="medium"
                 onClick={handleDelete}
                 disabled={isLoading}>
              <DeleteIcon/>
            </Fab>
          </Grid>
        </>}
        {isOpenTokSessionConnected && pool && <Grid item>
          <StreamingStatus
            pool={pool}
            streamId={currentStreamId}
            streamIdUpdated={updateCurrentStreamId}
            disabled={isLoading}
          />
        </Grid>}
        <Grid item>
          <Typography component="h1" variant="h3" color="textPrimary" gutterBottom>
            {pool.name}
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        {streams && renderStreamsList(streams)}
      </Grid>
    </Container>
  );
}
