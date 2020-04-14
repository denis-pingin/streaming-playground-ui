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
import config from "../config";

const useStyles = makeStyles((theme) => ({
  card: {
    minWidth: 275,
  }
}));

export default function Pool() {
  const classes = useStyles();
  const {poolId} = useParams();
  const history = useHistory();
  const {userInfo} = useAuthContext();
  const [streamingStatus, setStreamingStatus] = useState(null);
  const [pool, setPool] = useState(null);
  const [myStreams, setMyStreams] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMyPool, setIsMyPool] = useState(false);
  const [websocket, setWebsocket] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = useRef(isClosing);

  function loadUserProfile() {
    return API.get("user", `/profile`);
  }

  function loadPool() {
    return API.get("pools", `/${poolId}`);
  }

  function loadStreams() {
    return API.get("pools", `/${poolId}/streams`);
  }

  function connectWebsocket(poolId) {
    let ws = new WebSocket(`${config.websocket.URL}?poolId=${poolId}`);
    ws.onopen = () => {
      console.log('Websocket connected');
    }
    ws.onmessage = event => {
      console.log('Websocket message:', event);
      loadStreams().then((streams) => {
        console.log("Loaded streams:", streams);
        setMyStreams(streams)
      });
    }
    ws.onclose = () => {
      console.log('Websocket disconnected');
      // automatically try to reconnect on connection loss
      if (!isClosingRef.current) {
        console.log('Reconnecting websocket');
        connectWebsocket(poolId);
      }
    }
    setWebsocket(ws);
  }

  useEffect(() => {
    function checkPoolOwnership(pool, userInfo) {
      const ownPool = userInfo && pool && pool.ownerUserId === userInfo.id;
      setIsMyPool(ownPool);
    }

    async function onLoad() {
      if (isInitialized) {
        checkPoolOwnership(pool, userInfo);
        return;
      }
      setIsInitialized(true);

      console.log("Pool load starting");
      try {
        setStreamingStatus((await loadUserProfile()).streamingStatus);

        const pool = await loadPool();
        console.log("Got pool:", pool);
        setPool(pool);
        checkPoolOwnership(pool, userInfo);

        connectWebsocket(pool.poolId);

        setMyStreams(await loadStreams());
        console.log("Pool load done");
      } catch (e) {
        onError(e);
      }
    }

    onLoad();
    return function cleanup() {
      if (websocket) {
        console.log("Closing websocket");
        isClosingRef.current = true;
        websocket.close();
        setWebsocket(null);
      }
    };
  }, [userInfo, pool, websocket, isClosing]);

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
              <Link component={RouterLink} to={`/pools/${stream.poolId}/streams/${stream.streamId}`} underline="none">
                <CardContent>
                  <Typography color="textPrimary" variant="h5" gutterBottom>
                    {stream.name}
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    {"Created: " + new Date(stream.createdAt).toLocaleString()}
                  </Typography>
                  <StreamView id={stream.openTokStreamId} size="small"/>
                </CardContent>
              </Link>
            </Card>
          </Grid>
        )
      });
  }

  async function streamingStatusUpdated(streamingStatus) {
    console.log("Got updated streaming status:", streamingStatus);
    setStreamingStatus(streamingStatus)
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
        <Grid item>
          <StreamingStatus pool={pool} streamingStatus={streamingStatus}
                           streamingStatusCallback={streamingStatusUpdated}/>
        </Grid>
        <Grid item>
          <Typography variant="h3">
            {pool.name}
          </Typography>
        </Grid>
      </Grid>
      {myStreams && renderStreamsList(myStreams)}
    </Container>
  )
}
