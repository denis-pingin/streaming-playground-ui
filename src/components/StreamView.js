import React, {useEffect, useState} from "react";
import {useOpenTokContext} from "../contexts/OpenTokContext";
import makeStyles from "@material-ui/core/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
  video: props => ({
    width: props.width,
    height: props.height,
    "& div": {
      margin: "auto"
    }
  }),
}));

export default function StreamView(props) {
  const {stream, width, height, ...other} = props;
  const classes = useStyles(props);
  const {openTokSubscribeToStream} = useOpenTokContext();
  const [, setDimensions] = useState({});

  useEffect(() => {
    setDimensions({
      width: width,
      height: height
    });
  }, [width, height]);

  useEffect(() => {
    openTokSubscribeToStream(stream.id, stream);
  }, [stream]);

  return (
    <div id={stream.id} className={classes.video}/>
  );
}