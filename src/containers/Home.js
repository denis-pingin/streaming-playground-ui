import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import { Link } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { PageHeader, ListGroup, ListGroupItem } from "react-bootstrap";
import { useAppContext } from "../libs/contextLib";
import { onError } from "../libs/errorLib";
import "./Home.css";


export default function Home() {
  const [streams, setStreams] = useState([]);
  const { isAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
        return;
      }

      try {
        const streams = await loadStreams();
        setStreams(streams);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, [isAuthenticated]);

  function loadStreams() {
    return API.get("streams", "/streams");
  }

  function renderStreamsList(streams) {
    return [{}].concat(streams).map((stream, i) =>
      i !== 0 ? (
        <LinkContainer key={stream.streamId} to={`/streams/${stream.streamId}`}>
          <ListGroupItem header={stream.streamId}>
            {"Created: " + new Date(stream.createdAt).toLocaleString()}
          </ListGroupItem>
        </LinkContainer>
      ) : (
        <LinkContainer key="new" to="/streams/new">
          <ListGroupItem>
            <h4>
              <b>{"\uFF0B"}</b> Create a new stream
            </h4>
          </ListGroupItem>
        </LinkContainer>
      )
    );
  }

  function renderLander() {
    return (
      <div className="lander">
        <h1>Streaming playground</h1>
        <p>Let's play!</p>
        <div>
          <Link to="/login" className="btn btn-info btn-lg">
            Login
          </Link>
          <Link to="/signup" className="btn btn-success btn-lg">
            Signup
          </Link>
        </div>
      </div>
    );
  }

  function renderStreams() {
    return (
      <div className="streams">
        <PageHeader>Your Streams</PageHeader>
        <ListGroup>
          {!isLoading && renderStreamsList(streams)}
        </ListGroup>
      </div>
    );
  }

  return (
    <div className="Home">
      {isAuthenticated ? renderStreams() : renderLander()}
    </div>
  );
}
