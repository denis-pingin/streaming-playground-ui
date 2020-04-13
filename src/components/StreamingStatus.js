import React, {useEffect, useState} from "react";
import "./LoaderButton.css";
import {logError, onError} from "../libs/errorLib";
import {API} from "aws-amplify";
import "./StreamingStatus.css";
import {IconContext} from "react-icons";
import LoaderButton from "./LoaderButton";
import {FaDotCircle, FaStopCircle, FaVideo} from "react-icons/all";
import {useAuthContext} from "../libs/AuthContext";
import {useOpenTokContext} from "../libs/OpenTokContext";

export default function StreamingStatus({pool, streamingStatus, streamingStatusCallback, ...props}) {
  const {cognitoUserSession} = useAuthContext();
  const {openTokContext, startSession, startPublishing, stopPublishing, subscribeToStream} = useOpenTokContext();
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
  }, [pool, streamingStatus, streamingStatusCallback]);

  function startOpenTokStreaming(openTokSessionConfig, openTokToken) {
    startSession(openTokSessionConfig.apiKey, openTokSessionConfig.sessionId, openTokToken, function (event) {
      switch (event.eventType) {
        case "sessionConnected":
          startPublishing(event.session);
          break;
        case "streamCreated":
          subscribeToStream(event.session, event.event.stream)
          break;
      }
    });
  }

  function stopOpenTokStreaming() {
    stopPublishing()
  }

  async function startStreaming(poolId) {
    return API.post("pools", `/${poolId}/streams`, {
      body: {
        name: cognitoUserSession.name
      }
    });
  }

  async function stopStreaming(poolId, streamId) {
    return API.del("pools", `/${poolId}/streams/${streamId}`);
  }

  async function handleStartStreaming() {
    try {
      if (!myStreamingStatus.streaming) {
        setIsProcessing(true);
        const stream = await startStreaming(pool.poolId);
        const streamingStatus = {
          streaming: stream.streaming,
          streamId: stream.streamId,
          openTokToken: stream.openTokToken
        }
        setMyStreamingStatus(streamingStatus)
        streamingStatusCallback(streamingStatus);
        await onLoad();
        setIsProcessing(false);
      }
    } catch (e) {
      onError(e);
      setIsProcessing(false);
    }
  }

  async function handleStopStreaming(event) {
    event.preventDefault();
    try {
      if (myStreamingStatus.streaming) {
        setIsProcessing(true);
        await stopStreaming(pool.poolId, myStreamingStatus.streamId);
        const streamingStatus = {
          streaming: false,
          streamId: null,
          openTokToken: null
        }
        setMyStreamingStatus(streamingStatus)
        streamingStatusCallback(streamingStatus);
        await onLoad()
        setIsProcessing(false);
      }
    } catch (e) {
      onError(e);
      setIsProcessing(false);
    }
  }

  return (
    <div className="StreamingStatus">
      {myStreamingStatus && myStreamingStatus.streaming ? (
        <div className="StreamingStatus">
          <IconContext.Provider value={{size: "2em"}}>
            <LoaderButton
              className="icon-button"
              onClick={handleStopStreaming}
              disabled={isProcessing}>
              <FaStopCircle/>
            </LoaderButton>
          </IconContext.Provider>
          <IconContext.Provider value={{color: "red", size: "2em"}}>
            <div className="icon-status">
              <FaDotCircle/>
            </div>
          </IconContext.Provider>
          <div className="VideoPreview">
            <div id="publisher"/>
          </div>
        </div>
      ) : (
        <IconContext.Provider value={{color: "red", size: "2em"}}>
          <LoaderButton
            className="icon-button"
            onClick={handleStartStreaming}
            disabled={isProcessing}>
            <FaVideo/>
          </LoaderButton>
        </IconContext.Provider>
      )}
    </div>
  )
}