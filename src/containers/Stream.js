import React, {useEffect, useState} from "react";
import {API} from "aws-amplify";
import {useParams} from "react-router-dom";
import {PageHeader} from "react-bootstrap";
import {logError, onError} from "../libs/errorLib";
import "./Stream.css";

const OT = require('@opentok/client');

export default function Stream() {
  const {poolId, streamId} = useParams();
  const [stream, setStream] = useState(null);
  const [pool, setPool] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleError(error) {
    if (error) {
      logError(error);
    }
  }

  function startOpenTokSession(apiKey, sessionId, token) {
    // connect to session
    const session = OT.initSession(apiKey, sessionId);
    console.log("Initialized OpenTok session:", session);

    //create a subscriber
    session.on('streamCreated', function(event) {
      console.log("OpenTok event:", event)
      session.subscribe(event.stream, 'subscriber', {
        insertMode: 'append',
        width: '100%',
        height: '100%'
      }, handleError);
    });

    session.connect(token, function(error) {
      if (error) {
        console.log(error.message);
      } else {
        // You have connected to the session. You could publish a stream now.
      }
    });

    return session;
  }

  async function loadStream(poolId, streamId) {
    return API.get("pools", `/${poolId}/streams/${streamId}`);
  }

  async function loadPool(poolId) {
      return API.get("pools", `/${poolId}`);
  }

  async function loadUserProfile() {
    return API.get("user", `/profile`);
  }

  useEffect(() => {
    async function onLoad() {
      try {
        const userProfile = await loadUserProfile();
        setUserProfile(userProfile);
        const pool = await loadPool(poolId);
        setPool(pool);
        const stream = await loadStream(poolId, streamId);
        setStream(stream);
        startOpenTokSession(
          pool.openTokSessionConfig.apiKey,
          pool.openTokSessionConfig.sessionId,
          userProfile.streamingStatus.openTokToken
        );
      } catch (e) {
        onError(e);
      }
    }

    onLoad();
  });

  return (
    <div className="Stream">
      <PageHeader>Username</PageHeader>
      <div className="VideoStream">
        <div id="subscriber"/>
      </div>
    </div>
  );
}
