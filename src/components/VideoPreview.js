import React from "react";
import { Button, Glyphicon } from "react-bootstrap";
import "./LoaderButton.css";
import {logError} from "../libs/errorLib";

export default class VideoPreview extends React.Component {

  componentDidCatch(error, errorInfo) {
    logError(error, errorInfo);
  }

  componentDidMount() {
    // Grab elements, create settings, etc.
    const video = document.getElementById('videoPreview');

    // Get access to the camera!
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Not adding `{ audio: true }` since we only want video now
      navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
        //video.src = window.URL.createObjectURL(stream);
        video.srcObject = stream;
        video.play();
      });
    }
  }

  render() {
    return (
      <div className="VideoPreview">
        <video id="videoPreview" width="640" height="480" autoPlay/>
      </div>
    );
  }
}
