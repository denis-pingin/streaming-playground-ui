import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import StreamView from "./StreamView";
import CardHeader from "@material-ui/core/CardHeader";
import React, {useRef, useState} from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
  card: {
    minWidth: 250,
  },
  videoHeader: {
    paddingTop: 0
  }
}));

export default function StreamingCard({stream, openTokStream, ...props}) {
  const classes = useStyles();
  const gridItemRef = useRef();

  function getStreamViewWidth() {
    if (gridItemRef.current) {
      const parentElement = gridItemRef.current
      const computedStyle = getComputedStyle(parentElement);
      return parentElement.clientWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight);
    } else {
      return 0;
    }
  }

  function getStreamViewHeight() {
    if (openTokStream && openTokStream.videoDimensions) {
      const streamViewWidth = getStreamViewWidth();
      const videoDimensions = openTokStream.videoDimensions;
      const aspect = videoDimensions.width / videoDimensions.height;
      return streamViewWidth / aspect;
    } else {
      return 0;
    }
  }

  return (
    <Card className={classes.card}>
      {/*<Link component={RouterLink} to={`/pools/${stream.poolId}/streams/${stream.streamId}`} underline="none">*/}
      <CardContent ref={gridItemRef}>
        {/*{console.log("Rendering:", gridItemRefs.current[i] ? gridItemRefs.current[i].offsetWidth : "no parent", gridItemRefs.current[i] ? gridItemRefs.current[i].offsetHeight : "no parent")}*/}
        {gridItemRef.current && openTokStream &&
        <StreamView id={openTokStream.id}
                    width={getStreamViewWidth()}
                    height={getStreamViewHeight()}
                    stream={openTokStream}
        />}
      </CardContent>
      <CardHeader className={classes.videoHeader}
                  title={stream.name}
                  subheader={"Created: " + new Date(stream.createdAt).toLocaleString()}
      />
      {/*</Link>*/}
    </Card>
  )
}
