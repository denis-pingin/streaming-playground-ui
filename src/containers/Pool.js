import React, {useEffect, useState} from "react";
import {API} from "aws-amplify";
import {useHistory, useParams} from "react-router-dom";
import {ListGroup, ListGroupItem, PageHeader} from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import {onError} from "../libs/errorLib";
import "./Pool.css";
import {LinkContainer} from "react-router-bootstrap";
import StreamingStatus from "../components/StreamingStatus";
import {IconContext} from "react-icons";
import {FaTrashAlt} from "react-icons/all";
import StreamView from "../components/StreamView";

export default function Pool() {
  const {poolId} = useParams();
  const history = useHistory();
  const [streamingStatus, setStreamingStatus] = useState(null);
  const [pool, setPool] = useState(null);
  const [streams, setStreams] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function loadUserProfile() {
    return API.get("user", `/profile`);
  }

  function loadPool() {
    return API.get("pools", `/${poolId}`);
  }

  function loadStreams() {
    return API.get("pools", `/${poolId}/streams`);
  }

  useEffect(() => {
    async function onLoad() {
      try {
        const streamingStatus = (await loadUserProfile()).streamingStatus;
        setStreamingStatus(streamingStatus);
        const pool = await loadPool();
        setPool(pool);
        const streams = await loadStreams();
        setStreams(streams);
      } catch (e) {
        onError(e);
      }
    }

    onLoad();
  }, [poolId]);

  function deletePool() {
    return API.del("pools", `/${poolId}`);
  }

  async function handleDelete(event) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this pool?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await deletePool();
      history.push("/");
    } catch (e) {
      onError(e);
      setIsDeleting(false);
    }
  }

  function renderStreamsList(streams) {
    return streams.map((stream, i) =>
      (
        <div key={stream.streamId}>
          <LinkContainer to={`/pools/${poolId}/streams/${stream.streamId}`}>
            <ListGroupItem header={stream.name}>
              {"Created: " + new Date(stream.createdAt).toLocaleString()}
            </ListGroupItem>
          </LinkContainer>
          <StreamView size="small"/>
        </div>
      )
    );
  }

  async function streamingStatusUpdated(streamingStatus) {
    console.log(streamingStatus);
    setStreamingStatus(streamingStatus)
    const streams = await loadStreams();
    console.log(streams);
    setStreams(streams);
  }

  return (
    <div className="Pool">
      <IconContext.Provider value={{color: "red", size: "2em"}}>
        {pool &&
        <PageHeader>
          <span>{pool.name}</span>
          <LoaderButton
            className={"icon-button"}
            onClick={handleDelete}
            disabled={isLoading}>
            <FaTrashAlt/>
          </LoaderButton>
          <StreamingStatus pool={pool} streamingStatus={streamingStatus} streamingStatusCallback={streamingStatusUpdated}/>
        </PageHeader>}
        <ListGroup>
          {!isLoading && streams && renderStreamsList(streams)}
        </ListGroup>
      </IconContext.Provider>
    </div>
  );
}
