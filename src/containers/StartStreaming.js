import React, {useState} from "react";
import {API} from "aws-amplify";
import {useHistory} from "react-router-dom";
import {onError} from "../libs/errorLib";
import "./Settings.css";
import LoaderButton from "../components/LoaderButton";
import VideoPreview from "../components/VideoPreview";

export default function StartStreaming() {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);

  function handler() {
    this.setState({
      someVar: 'some value'
    })
  }

  function startStreaming() {
    return API.post("streaming", "/start", {
      body: {}
    });
  }

  async function handleCancel(event) {
    history.back();
  }

  async function handleStart(storage, {token, error}) {
    setIsLoading(true);

    try {
      await startStreaming();
      history.push("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  return (
    <div className="StartStreaming">
      <VideoPreview/>
      <LoaderButton
        block
        bsSize="large"
        bsStyle="danger"
        onClick={handleStart}
        isLoading={isLoading}
      >
        Start
      </LoaderButton>
      <LoaderButton
        block
        bsSize="large"
        bsStyle="primary"
        onClick={handleCancel}
      >
        Cancel
      </LoaderButton>
    </div>
  );
}
