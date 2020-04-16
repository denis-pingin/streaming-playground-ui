import React, {useEffect, useRef, useState} from "react";
import {onError} from "../libs/errorLib";
import {API} from "aws-amplify";
import {useAuthContext} from "../contexts/AuthContext";
import {useOpenTokContext} from "../contexts/OpenTokContext";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Fab from "@material-ui/core/Fab";
import VideocamIcon from "@material-ui/icons/Videocam";
import VideocamOffIcon from "@material-ui/icons/VideocamOff";
import {useSnackbar} from "notistack";

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

export default function StreamingStatus({pool, streamId, streamIdUpdated, ...props}) {
  const classes = useStyles();
  const {enqueueSnackbar} = useSnackbar();
  const {userInfo} = useAuthContext();
  const {openTokStartPublishing, openTokStopPublishing, openTokIsSessionConnected, openTokIsPublishing} = useOpenTokContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState(null);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [currentStreamId, setCurrentStreamId] = useState(streamId);
  const currentStreamIdRef = useRef(currentStreamId);

  function getCurrentStreamId() {
    return currentStreamIdRef.current;
  }

  function updateCurrentStreamId(currentStreamId) {
    console.log("Pool: updated currentStreamId:", currentStreamId);
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
    function init() {
      updateCurrentStreamId(currentStreamId);
      setupStreaming(currentStreamId);
    }
    init();
  }, [currentStreamId, openTokIsSessionConnected()]);

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
    await updateStream(pool.poolId, currentStreamId, openTokStreamId);
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

  async function startStreaming(poolId) {
    console.log("Starting streaming", userInfo);
    return API.post("pools", `/${poolId}/streams`, {
      body: {
        name: userInfo.attributes.name
      }
    });
  }

  async function stopStreaming(poolId, streamId) {
    console.log("Stopping streaming");
    return API.del("pools", `/${poolId}/streams/${streamId}`);
  }

  async function updateStream(poolId, streamId, openTokStreamId) {
    console.log("Updating stream with OpenTok streamId:", openTokStreamId);
    return API.put("pools", `/${poolId}/streams/${streamId}`, {
      body: {
        openTokStreamId: openTokStreamId
      }
    });
  }

  async function handleStartStreaming() {
    const currentStreamId = getCurrentStreamId();
    if (currentStreamId) {
      throw new Error("Already streaming");
    }

    try {
      setIsProcessing(true);
      const stream = await startStreaming(pool.poolId);
      updateCurrentStreamId(stream.streamId);
      setupStreaming(stream.streamId);
    } catch (e) {
      onError(e);
    }
    setIsProcessing(false);
  }

  async function handleStopStreaming(event) {
    const currentStreamId = getCurrentStreamId();
    if (!currentStreamId) {
      throw new Error("Not streaming");
    }

    try {
      setIsProcessing(true);
      await stopStreaming(pool.poolId, currentStreamId);
      updateCurrentStreamId(null);
      setupStreaming(null);
    } catch (e) {
      onError(e);
    }
    setIsProcessing(false);
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

  return (
    currentStreamId ? (
      <>
        <Fab color="primary"
             aria-label="stop"
             size="medium"
             onClick={handleStopStreaming}
             disabled={isProcessing}>
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
           disabled={isProcessing}>
        <VideocamIcon/>
      </Fab>
    )
  );
}