import React from "react";
import "./LoaderButton.css";
import "./StreamingStatus.css";
import {PageHeader} from "react-bootstrap";
import {useAuthContext} from "../libs/AuthContext";
import {useOpenTokContext} from "../libs/OpenTokContext";
import {logError} from "../libs/errorLib";

export default function StreamView({size, ...props}) {
  const {openTokContext, startSession, startPublishing, stopPublishing} = useOpenTokContext();

  function handleError(error) {
    if (error) {
      logError(error);
    }
  }

  return (
    <div>
      <div id="subscriber"/>
    </div>
  );
}