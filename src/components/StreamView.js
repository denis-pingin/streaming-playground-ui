import React from "react";
import {useOpenTokContext} from "../libs/OpenTokContext";
import {logError} from "../libs/errorLib";

export default function StreamView({id, size, ...props}) {
  // const {openTokContext, startSession, startPublishing, stopPublishing} = useOpenTokContext();

  function handleError(error) {
    if (error) {
      logError(error);
    }
  }

  return (
    <div>
      <div id={id}/>
    </div>
  );
}