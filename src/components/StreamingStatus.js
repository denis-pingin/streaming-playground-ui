import React, {useEffect, useState} from "react";
import {logError, onError} from "../libs/errorLib";
import {API} from "aws-amplify";
import {useAuthContext} from "../libs/AuthContext";
import {useOpenTokContext} from "../libs/OpenTokContext";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Fab from "@material-ui/core/Fab";
import VideocamIcon from "@material-ui/icons/Videocam";
import VideocamOffIcon from "@material-ui/icons/VideocamOff";

const useStyles = makeStyles((theme) => ({
  videoPreview: {
    "z-index": 99999,
    position: "fixed",
    right: theme.spacing(3),
    bottom: theme.spacing(3),
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
  const {startSession, startPublishing, stopPublishing, subscribeToStream} = useOpenTokContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [myStreamingStatus, setMyStreamingStatus] = useState(streamingStatus);

  function handleError(error) {
    if (error) {
      logError(error);
    }
  }

  async function onLoad() {
    try {
      if (myStreamingStatus.streaming) {
        startOpenTokStreaming(pool.openTokSessionConfig, myStreamingStatus.openTokToken);
      } else {
        stopOpenTokStreaming();
      }
    } catch (e) {
      onError(e);
    }
  }

  useEffect(() => {
    onLoad();
    return function cleanup() {
      stopOpenTokStreaming();
    };
  }, [myStreamingStatus]);

  async function handlePublishingStarted(openTokStreamId) {
    if (!myStreamingStatus.streaming) {
      console.log("User is not streaming:", myStreamingStatus);
      return;
    }
    console.log("Updating stream with OpenTok streamId:", openTokStreamId);
    const stream = await updateStream(pool.poolId, myStreamingStatus.streamId, openTokStreamId);
    console.log("Updated stream with OpenTok sessionId:", stream);
  }

  function startOpenTokStreaming(openTokSessionConfig, openTokToken) {
    startSession(openTokSessionConfig.apiKey, openTokSessionConfig.sessionId, openTokToken, function (event) {
      switch (event.type) {
        case "sessionConnected":
          console.log("OpenTok session event:", event);
          startPublishing(event.session, function(event) {
            switch (event.type) {
              case "streamCreated":
                console.log("OpenTok publishing stream created:", event);
                handlePublishingStarted(event.stream.id);
                break;
              default:
                console.log("OpenTok publishing event:", event);
            }
          });
          break;
        case "streamCreated":
          console.log("New OpenTok stream created:", event);
          subscribeToStream(event.stream.id, event.target, event.stream)
          break;
      }
    });
  }

  function stopOpenTokStreaming() {
    stopPublishing()
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
    if (myStreamingStatus.streaming) {
      throw new Error("Already streaming");
    }

    try {
      setIsProcessing(true);
      const stream = await startStreaming(pool.poolId);
      setStreamingStatus({
        streaming: stream.streaming,
        streamId: stream.streamId,
        openTokToken: stream.openTokToken
      })
      await onLoad();
      setIsProcessing(false);
    } catch (e) {
      onError(e);
      setIsProcessing(false);
    }
  }

  function setStreamingStatus(streamingStatus) {
    console.log("New streaming status:", streamingStatus);
    setMyStreamingStatus(streamingStatus)
    streamingStatusCallback(streamingStatus);
  }

  async function handleStopStreaming(event) {
    event.preventDefault();

    if (!myStreamingStatus.streaming) {
      throw new Error("Not streaming");
    }

    try {
      setIsProcessing(true);
      await stopStreaming(pool.poolId, myStreamingStatus.streamId);
      const streamingStatus = {
        streaming: false,
        streamId: null,
        openTokToken: null
      }
      setStreamingStatus(streamingStatus);
      await onLoad()
      setIsProcessing(false);
    } catch (e) {
      onError(e);
      setIsProcessing(false);
    }
  }

  return (
    myStreamingStatus && myStreamingStatus.streaming ? (
      <>
        <Fab color="primary"
             aria-label="stop"
             size="medium"
             onClick={handleStopStreaming}
             disabled={isProcessing}>
          <VideocamOffIcon/>
        </Fab>
        <div className={classes.videoPreview}>
          <div id="publisher"/>
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