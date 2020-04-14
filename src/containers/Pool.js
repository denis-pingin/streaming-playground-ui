import React, {useEffect, useRef, useState} from "react";
import {API} from "aws-amplify";
import {Link as RouterLink, useHistory, useParams} from "react-router-dom";
import {onError} from "../libs/errorLib";
import StreamView from "../components/StreamView";
import Container from "@material-ui/core/Container";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import Fab from "@material-ui/core/Fab";
import DeleteIcon from "@material-ui/icons/Delete";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import StreamingStatus from "../components/StreamingStatus";
import {useAuthContext} from "../libs/AuthContext";
import {useOpenTokContext} from "../libs/OpenTokContext";
import {useWebsocketContext} from "../libs/WebsocketContext";

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
  const {openTokGetSession, openTokStartSession, openTokStopSession, openTokSubscribeToStream} = useOpenTokContext();
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
          // openTokSubscribeToStream(event.stream.id, event.stream);
          break;
        case "streamDestroyed":
          console.log("New OpenTok stream destroyed:", event);
          // delete openTokStreams[event.stream.id];
          setOpenTokStreams(openTokStreams => ({...openTokStreams, [event.stream.id]: null}));
          break;
      }
    });
  }

  function stopOpenTokSession() {
    openTokStopSession();
  }

  function updateStreamingStatus(streamingStatus) {
    console.log("Got updated streaming status:", streamingStatus);
    setStreamingStatus(streamingStatus);
  }

  function updateStreams(event) {
    console.log("Received streamCreated event:", event);
    loadStreams().then((streams) => {
      console.log("Loaded streams:", streams);
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
    function checkPoolOwnership(pool, userInfo) {
      const ownPool = userInfo && pool && pool.ownerUserId === userInfo.id;
      setIsMyPool(ownPool);
    }

    checkPoolOwnership(pool, userInfo);
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

        setStreams(await loadStreams());
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
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this pool?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await deletePool();
      history.push("/");
    } catch (e) {
      onError(e);
      setIsDeleting(false);
    }
  }

  function renderStreamsList(streams) {
    return streams
      .filter((stream) => {
        return stream.streamId !== streamingStatus.streamId;
      })
      .map((stream) => {
        return (
          <Grid item key={stream.streamId}>
            <Card className={classes.card}>
              {/*<Link component={RouterLink} to={`/pools/${stream.poolId}/streams/${stream.streamId}`} underline="none">*/}
                <CardContent>
                  <Typography color="textPrimary" variant="h5" gutterBottom>
                    {stream.name}
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    {"Created: " + new Date(stream.createdAt).toLocaleString()}
                  </Typography>
                  {console.log("Rendering:", stream.openTokStreamId, stream.openTokStreamId && openTokStreams[stream.openTokStreamId])}
                  {stream.openTokStreamId && openTokStreams[stream.openTokStreamId] &&
                  <StreamView id={stream.openTokStreamId} size="small" stream={openTokStreams[stream.openTokStreamId]}/>}
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
        <Grid item>
          <Fab color="primary"
               aria-label="delete"
               size="medium"
               onClick={handleDelete}
               disabled={isLoading}>
            <DeleteIcon/>
          </Fab>
        </Grid>}
        {isOpenTokSessionConnectedState && pool && streamingStatus && <Grid item>
          <StreamingStatus
            pool={pool}
            streamingStatus={streamingStatus}
            streamingStatusCallback={updateStreamingStatus}/>
        </Grid>}
        <Grid item>
          <Typography variant="h3">
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
