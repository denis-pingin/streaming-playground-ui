import React, {useState} from "react";
import "./LoaderButton.css";
import {onError} from "../libs/errorLib";
import LoaderButton from "./LoaderButton";
import {API} from "aws-amplify";
import "./StreamingStatus.css";

export default function StreamingStatus({...props}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  async function getStreamingStatus() {
    return API.get("streaming", "/status", {});
  }

  async function startStreaming() {
    return API.post("streaming", "/start", {
      body: {}
    });
  }

  async function stopStreaming(id) {
    return API.post("streaming", `/stop/${id}`, {
      body: {}
    });
  }

  async function handleStartStreaming(event) {
    event.preventDefault();
    setIsProcessing(true);
    try {
      const streamingStatus = await getStreamingStatus();
      if (!streamingStatus.streaming) {
        await startStreaming();
      }
      setIsStreaming(true);
      setIsProcessing(false);
    } catch (e) {
      onError(e);
      setIsProcessing(false);
    }
  }

  async function handleStopStreaming(event) {
    event.preventDefault();
    setIsProcessing(true);
    try {
      const streamingStatus = await getStreamingStatus();
      if (streamingStatus.streaming) {
        await stopStreaming(streamingStatus.streamId);
      }
      setIsStreaming(false);
      setIsProcessing(false);
    } catch (e) {
      onError(e);
      setIsProcessing(false);
    }
  }

  getStreamingStatus().then(streamingStatus => {
    setIsStreaming(streamingStatus.streaming);
  });

  return isStreaming ? (
    <div>
      <div className="Recording"/>
      <LoaderButton
        bsStyle="primary"
        bsSize="small"
        onClick={handleStopStreaming}
        disabled={isProcessing}
      >
        Stop Streaming
      </LoaderButton>
    </div>
  ) : (
    <LoaderButton
      block
      bsStyle="primary"
      bsSize="small"
      onClick={handleStartStreaming}
      disabled={isProcessing}
    >
      Start Streaming
    </LoaderButton>
  );
}