import React, {useEffect, useRef, useState} from "react";
import {onError} from "../libs/errorLib";
import {useAuthContext} from "../contexts/AuthContext";
import {useOpenTokContext} from "../contexts/OpenTokContext";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Fab from "@material-ui/core/Fab";
import VideocamIcon from "@material-ui/icons/Videocam";
import VideocamOffIcon from "@material-ui/icons/VideocamOff";
import {useSnackbar} from "notistack";
import {useMutation} from 'react-apollo';
import {
  START_STREAMING_MUTATION,
  STOP_STREAMING_MUTATION,
  UPDATE_STREAM_OPEN_TOK_STREAM_ID_MUTATION
} from "../graphql/stream";

const useStyles = makeStyles((theme) => ({
  videoPreview: {
    "z-index": 99999,
    position: "fixed",
    right: theme.spacing(2),
    bottom: theme.spacing(2)
  },
  video: {
    width: "100%",
    height: "100%"
  }
}));

export default function StreamingStatus({pool, enabled, streamIdUpdated, ...props}) {
  const classes = useStyles();
  const {enqueueSnackbar} = useSnackbar();
  const {getUserInfo} = useAuthContext();
  const {openTokStartPublishing, openTokStopPublishing, openTokIsSessionConnected, openTokIsPublishing} = useOpenTokContext();
  const [videoDimensions, setVideoDimensions] = useState(null);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [currentStreamId, setCurrentStreamId] = useState(null);
  const currentStreamIdRef = useRef(currentStreamId);
  const [startStreaming, { startStreamingLoading }] = useMutation(START_STREAMING_MUTATION, {
    onCompleted: (data) => {
      updateCurrentStreamId(data.startStreaming.streamId);
      setupStreaming(data.startStreaming.streamId);
    }
  });
  const [stopStreaming, { stopStreamingLoading }] = useMutation(STOP_STREAMING_MUTATION, {
    onCompleted: (data) => {
      updateCurrentStreamId(null);
      setupStreaming(null);
    }
  });
  const [updateStreamOpenTokStreamId, { updateStreamOpenTokStreamIdLoading }] = useMutation(UPDATE_STREAM_OPEN_TOK_STREAM_ID_MUTATION);

  function getCurrentStreamId() {
    return currentStreamIdRef.current;
  }

  function updateCurrentStreamId(currentStreamId) {
    console.log("StreamingStatus: updated currentStreamId:", currentStreamId);
    currentStreamIdRef.current = currentStreamId;
    setCurrentStreamId(currentStreamId);
    streamIdUpdated(currentStreamId)
  }

  function setupStreaming(currentStreamId) {
    try {
      console.log("Setup streaming:", currentStreamId, openTokIsPublishing())
      if (currentStreamId && !openTokIsPublishing()) {
        console.log("Streaming is on, starting publishing");
        startOpenTokPublishing();
      } else if (!currentStreamId && openTokIsPublishing()) {
        console.log("Streaming is off, stopping publishing");
        stopOpenTokPublishing();
      }
    } catch (e) {
      onError(e);
    }
  }

  useEffect(() => {
    return function cleanup() {
      if (openTokIsPublishing()) {
        stopOpenTokPublishing();
      }
    };
  }, []);

  useEffect(() => {
    function handleResize() {
      setWindowDimensions({
        height: window.innerHeight,
        width: window.innerWidth
      });
    }

    window.addEventListener('resize', handleResize)
    return function cleanup() {
      window.removeEventListener('resize', handleResize);
    }
  });

  async function handlePublishingStarted(openTokStreamId) {
    const currentStreamId = getCurrentStreamId();
    if (!currentStreamId) {
      console.log("User is not streaming");
      return;
    }
    updateStreamOpenTokStreamId({
      variables: {
        poolId: pool.poolId,
        streamId: currentStreamId,
        openTokStreamId: openTokStreamId
      }
    });
  }

  function startOpenTokPublishing() {
    openTokStartPublishing(function (event) {
      switch (event.type) {
        case "streamCreated":
          console.log("OpenTok publishing stream created:", event);
          setVideoDimensions(event.stream.videoDimensions);
          enqueueSnackbar("You are now LIVE!");
          handlePublishingStarted(event.stream.id);
          break;
        default:
          console.log("OpenTok publishing event:", event);
      }
    });
  }

  function stopOpenTokPublishing() {
    openTokStopPublishing()
    enqueueSnackbar("Streaming stopped");
  }

  async function handleStartStreaming() {
    const currentStreamId = getCurrentStreamId();
    if (currentStreamId) {
      throw new Error("Already streaming");
    }

    try {
      startStreaming({
        variables: {
          poolId: pool.poolId,
          name: getUserInfo().attributes.name
        }
      });
    } catch (e) {
      onError(e);
    }
  }

  async function handleStopStreaming() {
    const currentStreamId = getCurrentStreamId();
    if (!currentStreamId) {
      throw new Error("Not streaming");
    }

    try {
      stopStreaming({
        variables: {
          poolId: pool.poolId,
          streamId: currentStreamId
        }
      });
    } catch (e) {
      onError(e);
    }
  }

  function getPreviewStyle(windowDimensions, videoDimensions) {
    let aspect = 4 / 3;
    let previewWidth = 0;
    if (windowDimensions) {
      previewWidth = windowDimensions.width / 4
    }
    if (videoDimensions) {
      aspect = videoDimensions.width / videoDimensions.height;
    }
    return {
      width: previewWidth,
      height: previewWidth / aspect,
    };
  }

  function isLoading() {
    return startStreamingLoading || stopStreamingLoading || updateStreamOpenTokStreamIdLoading;
  }

  return (
    currentStreamId ? (
      <>
        <Fab color="primary"
             aria-label="stop"
             size="medium"
             onClick={handleStopStreaming}
             disabled={isLoading()}>
          <VideocamOffIcon/>
        </Fab>
        <div className={classes.videoPreview} style={getPreviewStyle(windowDimensions, videoDimensions)}>
          <div id="publisher" className={classes.video}/>
        </div>
      </>
    ) : (
      <Fab color="primary"
           aria-label="start"
           size="medium"
           onClick={handleStartStreaming}
           disabled={!enabled || isLoading()}>
        <VideocamIcon/>
      </Fab>
    )
  );
}