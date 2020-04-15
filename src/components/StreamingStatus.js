import React, {useEffect, useState} from "react";
import {logError, onError} from "../libs/errorLib";
import {API} from "aws-amplify";
import {useAuthContext} from "../contexts/AuthContext";
import {useOpenTokContext} from "../contexts/OpenTokContext";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Fab from "@material-ui/core/Fab";
import VideocamIcon from "@material-ui/icons/Videocam";
import VideocamOffIcon from "@material-ui/icons/VideocamOff";

const useStyles = makeStyles((theme) => ({
  videoPreview: {
    "z-index": 99999,
    position: "fixed",
    right: theme.spacing(3),
    bottom: theme.spacing(3)
  },
  small: {
    width: "320px",
    height: "240px",
  },
  medium: {
    width: "640px",
    height: "480px",
  }
}));

export default function StreamingStatus({pool, streamingStatus, streamingStatusCallback, ...props}) {
  const classes = useStyles();
  const {userInfo} = useAuthContext();
  const {openTokStartPublishing, openTokStopPublishing, openTokIsSessionConnected, openTokIsPublishing} = useOpenTokContext();
  const [isProcessing, setIsProcessing] = useState(false);

  function setupStreaming(streamingStatus) {
    try {
      console.log("Setup streaming:", streamingStatus, openTokIsPublishing())
      if (streamingStatus.streaming && !openTokIsPublishing()) {
        console.log("Streaming is on, starting publishing");
        startOpenTokPublishing();
      } else if (!streamingStatus.streaming && openTokIsPublishing()) {
        console.log("Streaming is off, stopping publishing");
        stopOpenTokPublishing();
      }
    } catch (e) {
      onError(e);
    }
  }

  useEffect(() => {
    setupStreaming(streamingStatus);
  }, [streamingStatus, streamingStatus.streaming, openTokIsSessionConnected()]);

  useEffect(() => {
    return function cleanup() {
      stopOpenTokPublishing();
    };
  }, []);

  async function handlePublishingStarted(openTokStreamId) {
    if (!streamingStatus.streaming) {
      console.log("User is not streaming:", streamingStatus);
      return;
    }
    console.log("Updating stream with OpenTok streamId:", openTokStreamId);
    const stream = await updateStream(pool.poolId, streamingStatus.streamId, openTokStreamId);
    console.log("Updated stream with OpenTok sessionId:", stream);
  }

  function startOpenTokPublishing() {
    openTokStartPublishing(function(event) {
      switch (event.type) {
        case "streamCreated":
          console.log("OpenTok publishing stream created:", event);
          handlePublishingStarted(event.stream.id);
          break;
        default:
          console.log("OpenTok publishing event:", event);
      }
    });
  }

  function stopOpenTokPublishing() {
    openTokStopPublishing()
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
    return API.del("pools", `/${poolId}/streams/${streamId}`);
  }

  async function updateStream(poolId, streamId, openTokStreamId) {
    return API.put("pools", `/${poolId}/streams/${streamId}`, {
      body: {
        openTokStreamId: openTokStreamId
      }
    });
  }

  async function handleStartStreaming() {
    if (streamingStatus.streaming) {
      throw new Error("Already streaming");
    }

    try {
      setIsProcessing(true);
      const stream = await startStreaming(pool.poolId);
      streamingStatus.streaming = stream.streaming;
      streamingStatus.streamId = stream.streamId;
      streamingStatus.openTokToken = stream.openTokToken;
      setStreamingStatus(streamingStatus);
      setupStreaming(streamingStatus);
      setIsProcessing(false);
    } catch (e) {
      onError(e);
      setIsProcessing(false);
    }
  }

  function setStreamingStatus(streamingStatus) {
    console.log("New streaming status:", streamingStatus);
    streamingStatusCallback(streamingStatus);
  }

  async function handleStopStreaming(event) {
    event.preventDefault();

    if (!streamingStatus.streaming) {
      throw new Error("Not streaming");
    }

    try {
      setIsProcessing(true);
      await stopStreaming(pool.poolId, streamingStatus.streamId);
      streamingStatus.streaming = false;
      streamingStatus.streamId = null;
      setStreamingStatus(streamingStatus);
      setupStreaming(streamingStatus);
      setIsProcessing(false);
    } catch (e) {
      onError(e);
      setIsProcessing(false);
    }
  }

  return (
    streamingStatus.streaming ? (
      <>
        <Fab color="primary"
             aria-label="stop"
             size="medium"
             onClick={handleStopStreaming}
             disabled={isProcessing}>
          <VideocamOffIcon/>
        </Fab>
        <div className={classes.videoPreview}>
          <div id="publisher" className={classes.small}/>
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