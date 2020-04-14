import React, {useEffect} from "react";
import {useOpenTokContext} from "../contexts/OpenTokContext";
import {logError} from "../libs/errorLib";
import makeStyles from "@material-ui/core/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
  video: {
  },
}));

export default function StreamView({stream, size, ...props}) {
  const classes = useStyles(useStyles);
  const {openTokSubscribeToStream} = useOpenTokContext();

  useEffect(() => {
    function init() {
      openTokSubscribeToStream(stream.id, stream);
    }
    init();
  }, [stream]);

  function handleError(error) {
    if (error) {
      logError(error);
    }
  }

  return (
    <div>
      <div id={stream.id} className={classes.video}/>
    </div>
  );
}