import React, {createRef, useEffect, useRef, useState} from "react";
import {API} from "aws-amplify";
import {useHistory, useParams} from "react-router-dom";
import {onError} from "../libs/errorLib";
import StreamView from "../components/StreamView";
import Container from "@material-ui/core/Container";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Fab from "@material-ui/core/Fab";
import DeleteIcon from "@material-ui/icons/Delete";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import StreamingStatus from "../components/StreamingStatus";
import {useAuthContext} from "../contexts/AuthContext";
import {useOpenTokContext} from "../contexts/OpenTokContext";
import {useWebsocketContext} from "../contexts/WebsocketContext";
import ConfirmationDialog from "../components/ConfirmationDialog";

const useStyles = makeStyles((theme) => ({
  card: {
    minWidth: 250,
  }
}));

export default function Pool() {
  const classes = useStyles();
  const {poolId} = useParams();
  const history = useHistory();
  const {userInfo} = useAuthContext();
  const {websocketSend, websocketSubscribe, websocketUnsubscribe, websocketIsConnected, websocketOn, websocketOff,} = useWebsocketContext();
  const {openTokStartSession, openTokStopSession} = useOpenTokContext();
  const [streamingStatus, setStreamingStatus] = useState(null);
  const [pool, setPool] = useState(null);
  const [streams, setStreams] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMyPool, setIsMyPool] = useState(false);
  const isInPool = useRef(false);
  const isOpenTokSessionConnected = useRef(false);
  const [isOpenTokSessionConnectedState, setIsOpenTokSessionConnectedState] = useState(false);
  const [openTokStreams, setOpenTokStreams] = useState({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [, setResizeState] = useState(null);
  const gridItemRefs = useRef([]);
  const streamingStatusRef = useRef(streamingStatus);

  if (streams) {
    if (gridItemRefs.current.length !== streams.length) {
      gridItemRefs.current = Array(streams.length).fill().map((_, i) => gridItemRefs.current[i] || createRef());
    }
  }

  function getIsInPool() {
    return isInPool.current;
  }

  function setIsInPool(value) {
    isInPool.current = value;
  }

  function getIsOpenTokSessionConnected() {
    console.log("Current session connected state:", isOpenTokSessionConnected.current);
    return isOpenTokSessionConnected.current;
  }

  function setIsOpenTokSessionConnected(value) {
    console.log("Setting session connected state");
    isOpenTokSessionConnected.current = value;
    setIsOpenTokSessionConnectedState(value);
  }

  function loadUserProfile() {
    return API.get("user", `/profile`);
  }

  function loadPool() {
    return API.get("pools", `/${poolId}`);
  }

  function loadStreams() {
    return API.get("pools", `/${poolId}/streams`);
  }

  function startOpenTokSession(openTokSessionConfig, openTokToken) {
    openTokStartSession(openTokSessionConfig.apiKey, openTokSessionConfig.sessionId, openTokToken, function (event) {
      console.log("Received OpenTok event:", event);
      switch (event.type) {
        case "sessionConnected":
          console.log("OpenTok session connected:", event);
          setIsOpenTokSessionConnected(true);
          break;
        case "streamCreated":
          console.log("New OpenTok stream created:", event);
          openTokStreams[event.stream.id] = event.stream;
          setOpenTokStreams(openTokStreams => ({...openTokStreams, [event.stream.id]: event.stream}));
          break;
        case "streamDestroyed":
          console.log("New OpenTok stream destroyed:", event);
          setOpenTokStreams(openTokStreams => ({...openTokStreams, [event.stream.id]: null}));
          break;
      }
    });
  }

  function stopOpenTokSession() {
    openTokStopSession();
  }

  function getStreamingStatus() {
    return streamingStatusRef.current;
  }

  function updateStreamingStatus(streamingStatus) {
    console.log("Got updated streaming status:", streamingStatus);
    streamingStatusRef.current = streamingStatus;
    setStreamingStatus(streamingStatus);
  }

  function updateStreams(event) {
    loadStreams().then((streams) => {
      const streamingStatus = getStreamingStatus();
      console.log("Loaded streams:", streams, streamingStatus);
      if (streamingStatus && streamingStatus.streaming) {
        streams.forEach((stream) => {
          stream.own = stream.streamId === streamingStatus.streamId;
        });
      }
      setStreams(streams)
    });
  }

  function handleUserProfileUpdated(event) {
    console.log("Received userProfileUpdated event:", event);
    if (event.data && event.data.streamingStatus) {
      updateStreamingStatus(event.data.streamingStatus);
    }
  }

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

  useEffect(() => {
    function tryEnterPool() {
      console.log("Try enter pool:", getIsInPool(), pool, websocketIsConnected())
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
      console.log("Try exit pool:", getIsInPool(), pool, websocketIsConnected())
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
      console.log("Websocket callback:", pool, websocketIsConnected());
      tryEnterPool();
    }

    websocketOn(websocketCallback);
    tryEnterPool();

    return function cleanup() {
      websocketOff(websocketCallback);
      tryExitPool();
    }
  }, [pool]);

  useEffect(() => {
    async function onLoad() {
      console.log("Pool load starting");
      try {
        const pool = await loadPool();
        console.log("Loaded pool:", pool);
        setPool(pool);

        const streamingStatus = (await loadUserProfile()).streamingStatus;
        console.log("Loaded streaming status:", streamingStatus);
        updateStreamingStatus(streamingStatus);

        if (pool.openTokSessionConfig && streamingStatus.openTokToken) {
          console.log("Starting OpenTok session");
          startOpenTokSession(pool.openTokSessionConfig, streamingStatus.openTokToken);
        }

        updateStreams();
        console.log("Pool load done");
      } catch (e) {
        onError(e);
      }
    }

    onLoad();
    return function cleanup() {
      if (getIsOpenTokSessionConnected()) {
        console.log("About to stop OpenTok session");
        stopOpenTokSession();
      }
    };
  }, []);

  function deletePool() {
    return API.del("pools", `/${poolId}`);
  }

  async function handleDelete(event) {
    setShowDeleteConfirmation(true);
  }

  async function handleDeleteConfirmation(result) {
    setShowDeleteConfirmation(false);
    if (result) {
      setIsDeleting(true);
      try {
        await deletePool();
        history.push("/");
      } catch (e) {
        onError(e);
        setIsDeleting(false);
      }
    }
  }

  function renderStreamsList(streams) {
    return streams
      .filter((stream) => !stream.own)
      .map((stream, i) => {
        function getStreamViewWidth() {
          if (gridItemRefs.current && gridItemRefs.current[i] && gridItemRefs.current[i].current) {
            const parentElement = gridItemRefs.current[i].current
            const computedStyle = getComputedStyle(parentElement);
            return parentElement.clientWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight);
          } else {
            return 0;
          }
        }

        function getStreamViewHeight() {
          if (stream.openTokStreamId &&
            openTokStreams[stream.openTokStreamId] &&
            openTokStreams[stream.openTokStreamId].videoDimensions) {

            const streamViewWidth = getStreamViewWidth();
            const videoDimensions = openTokStreams[stream.openTokStreamId].videoDimensions;
            const aspect = videoDimensions.width / videoDimensions.height;
            return streamViewWidth / aspect;
          } else {
            return 0;
          }
        }

        return (
          <Grid item key={stream.streamId} xs={12} sm={6} md={4} lg={3} xl={2}>
            <Card className={classes.card}>
              {/*<Link component={RouterLink} to={`/pools/${stream.poolId}/streams/${stream.streamId}`} underline="none">*/}
              <CardContent ref={gridItemRefs.current[i]}>
                <Typography component="h1" variant="h5" color="textPrimary" gutterBottom>
                  {stream.name}
                </Typography>
                <Typography component="h1" variant="h6" color="textSecondary">
                  {"Created: " + new Date(stream.createdAt).toLocaleString()}
                </Typography>
                {/*{console.log("Rendering:", gridItemRefs.current[i] ? gridItemRefs.current[i].offsetWidth : "no parent", gridItemRefs.current[i] ? gridItemRefs.current[i].offsetHeight : "no parent")}*/}
                {gridItemRefs.current[i] && stream.openTokStreamId && openTokStreams[stream.openTokStreamId] &&
                <StreamView id={stream.openTokStreamId} width={getStreamViewWidth()} height={getStreamViewHeight()}
                            stream={openTokStreams[stream.openTokStreamId]}/>}
              </CardContent>
              {/*</Link>*/}
            </Card>
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
        {isOpenTokSessionConnectedState && pool && streamingStatus && <Grid item>
          <StreamingStatus
            pool={pool}
            streamingStatus={streamingStatus}
            streamingStatusCallback={updateStreamingStatus}/>
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
