import React, {useEffect, useRef, useState} from "react";
import {onError} from "../../libs/errorLib";
import {useAuthContext} from "../../contexts/AuthContext";
import {useOpenTokContext} from "../../contexts/OpenTokContext";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Fab from "@material-ui/core/Fab";
import VideocamIcon from "@material-ui/icons/Videocam";
import VideocamOffIcon from "@material-ui/icons/VideocamOff";
import {useSnackbar} from "notistack";
import {useMutation} from 'react-apollo';
import {
  StartStreamingMutation,
  StopStreamingMutation,
  UpdateStreamOpenTokStreamIdMutation
} from "../../graphql/stream";
import {useHistory, useRouteMatch} from "react-router-dom";

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

export default function StreamingStatus({pool, disabled, start, streamIdUpdated, ...props}) {
  const classes = useStyles();
  const match = useRouteMatch();
  const history = useHistory();
  const {enqueueSnackbar} = useSnackbar();
  const {getUserInfo} = useAuthContext();
  const {openTokStartPublishing, openTokStopPublishing, openTokIsPublishing} = useOpenTokContext();
  const [videoDimensions, setVideoDimensions] = useState(null);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [currentStreamId, setCurrentStreamId] = useState(null);
  const currentStreamIdRef = useRef(currentStreamId);
  const [startStreaming, { startStreamingLoading }] = useMutation(StartStreamingMutation, {
    onCompleted(data) {
      updateCurrentStreamId(data.startStreaming.streamId);
      setupStreaming();
    },
    onError(error) {
      console.log("Failed to start streaming", error);
      enqueueSnackbar("Failed to start straming: " + error.message);
    }
  });
  const [stopStreaming, { stopStreamingLoading }] = useMutation(StopStreamingMutation, {
    onCompleted: (data) => {
      updateCurrentStreamId(null);
      setupStreaming();
    },
    onError(error) {
      console.log("Failed to stop streaming", error);
      enqueueSnackbar("Failed to stop straming: " + error.message);
    }
  });
  const [updateStreamOpenTokStreamId, { updateStreamOpenTokStreamIdLoading }] = useMutation(UpdateStreamOpenTokStreamIdMutation);

  function getCurrentStreamId() {
    return currentStreamIdRef.current;
  }

  function updateCurrentStreamId(currentStreamId) {
    currentStreamIdRef.current = currentStreamId;
    setCurrentStreamId(currentStreamId);
    streamIdUpdated(currentStreamId)
  }

  function setupStreaming() {
    try {
      const currentStreamId = getCurrentStreamId();
      if (currentStreamId && !openTokIsPublishing()) {
        console.log("Streaming is on, starting publishing");
        openTokStartPublishing(openTokCallback);
      } else if (!currentStreamId && openTokIsPublishing()) {
        console.log("Streaming is off, stopping publishing");
        openTokStopPublishing();
      }
    } catch (e) {
      onError(e);
    }
  }

  function openTokCallback(event) {
    switch (event.type) {
      case "streamCreated":
        console.log("OpenTok publishing stream created:", event);
        setVideoDimensions(event.stream.videoDimensions);
        enqueueSnackbar("You are now LIVE!");
        handlePublishingStarted(event.stream.id);
        break;
      case "streamDestroyed":
        console.log("OpenTok publishing stream destroyed:", event);
        enqueueSnackbar("Streaming stopped");
        break;
      default:
        console.log("OpenTok publishing event:", event);
    }
  }

  function handlePublishingStarted(openTokStreamId) {
    const currentStreamId = getCurrentStreamId();
    if (!currentStreamId) {
      console.log("User is not streaming");
      return;
    }
    return updateStreamOpenTokStreamId({
      variables: {
        poolId: pool.poolId,
        streamId: currentStreamId,
        openTokStreamId: openTokStreamId
      }
    });
  }

  useEffect(() => {
    return function cleanup() {
      if (openTokIsPublishing()) {
        openTokStopPublishing();
      }
    };
  }, []);

  useEffect(() => {
    async function init() {
      if (start) {
        console.log("Starting streaming");
        const currentStreamId = getCurrentStreamId();
        if (currentStreamId) {
          throw new Error("Already streaming");
        }

        await startStreaming({
          variables: {
            poolId: pool.poolId,
            name: getUserInfo().attributes.name
          }
        });
      }
    }

    init();
  }, [start])

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

  async function handleStartStreaming() {
    history.push(`${match.url}/start`);
  }

  async function handleStopStreaming() {
    const currentStreamId = getCurrentStreamId();
    if (!currentStreamId) {
      throw new Error("Not streaming");
    }

    await stopStreaming({
      variables: {
        poolId: pool.poolId,
        streamId: currentStreamId
      }
    });
    history.push(`/pools/${pool.poolId}`);
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
           disabled={disabled || isLoading()}>
        <VideocamIcon/>
      </Fab>
    )
  );
}