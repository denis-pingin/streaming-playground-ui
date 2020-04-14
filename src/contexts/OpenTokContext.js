import React, {useContext, useRef, useState} from 'react';
import {logError} from "../libs/errorLib";
const OT = require('@opentok/client');

function handleError(error) {
  if (error) {
    logError(error);
  }
}

const OpenTokContext = React.createContext([
  {
    session: null,
    publisher: null
  }, () => {
  }]);

const OpenTokContextProvider = (props) => {
  const [openTokContext, setOpenTokContext] = useState({
    session: null,
    publisher: null
  });
  return (
    <OpenTokContext.Provider value={[openTokContext, setOpenTokContext]}>
      {props.children}
    </OpenTokContext.Provider>
  );
}

const useOpenTokContext = () => {
  const [openTokContext, setOpenTokContext] = useContext(OpenTokContext);
  const openTokContextRef = useRef(openTokContext)

  function isSessionConnected() {
    const session = getSession();
    return session && session.isConnected();
  }

  function isPublishing() {
    const session = getSession();
    const publisher = getPublisher();
    return session && publisher;
  }

  function getSession() {
    return openTokContextRef.current.session;
  }

  function getPublisher() {
    return openTokContextRef.current.publisher;
  }

  function setSession(session) {
    openTokContextRef.current.session = session
    setOpenTokContext(openTokContext => ({...openTokContext, session: session}));
  }

  function setPublisher(publisher) {
    openTokContextRef.current.publisher = publisher
    setOpenTokContext(openTokContext => ({...openTokContext, publisher: publisher}));
  }

  function startSession(apiKey, sessionId, token, callback) {
    let session = getSession();
    if (session) {
      if (session.sessionId !== sessionId) {
        console.log("SessionId has changed, disconnecting previous session");
        stopSession();
      } else {
        if (session.isConnected()) {
          console.log("Session is already connected");
          callback({
            type: "sessionConnected",
            session: session
          });
          return;
        }
      }
    }
    session = doStartSession(apiKey, sessionId, token, callback)
    setSession(session);
  }

  function stopSession() {
    const session = getSession();
    if (session) {
      doDisconnectFromSession(session);
      setSession(null);
    }
  }

  function startPublishing(callback) {
    const session = getSession();
    if (!session) {
      throw new Error("OpenTok session is not started");
    }
    if (getPublisher()) {
      throw new Error("OpenTok is already publishing");
    }
    const publisher = doStartPublishing(session);
    publisher.on({
      streamCreated: function (event) {
        console.log("Publisher started streaming", event);
        callback(event);
      },
      streamDestroyed: function (event) {
        console.log("Publisher stopped streaming. Reason: " + event.reason);
        callback(event);
      }
    });
    setPublisher(publisher);
  }

  function stopPublishing() {
    const session = getSession();
    const publisher = getPublisher();
    if (session && publisher) {
      doStopPublishing(session, publisher)
      setPublisher(null);
    }
  }

  function subscribeToStream(elementId, stream) {
    if (!isSessionConnected()) {
      throw new Error("OpenTok session is not connected");
    }
    doSubscribeToStream(elementId, getSession(), stream);
  }

  return {
    openTokStartSession: startSession,
    openTokStopSession: stopSession,
    openTokStartPublishing: startPublishing,
    openTokStopPublishing: stopPublishing,
    openTokSubscribeToStream: subscribeToStream,
    openTokGetSession: getSession,
    openTokIsSessionConnected: isSessionConnected,
    openTokIsPublishing: isPublishing
  }
};

export function doStartSession(apiKey, sessionId, token, callback) {
  const session = OT.initSession(apiKey, sessionId);
  console.log("Initialized OpenTok session:", session);

  session.on('streamCreated', function (event) {
    console.log("Stream created:", event)
    callback(event);
  });

  session.connect(token, function (error) {
    if (error) {
      console.log(error.message);
      callback({
        type: "sessionConnectionError",
        session: session,
        error: error
      });
    } else {
      console.log("Session connected");
      callback({
        type: "sessionConnected",
        session: session
      });
      // You have connected to the session. You could publish a stream now.
    }
  });

  return session;
}

export function doDisconnectFromSession(session) {
  console.log("Disconnecting OpenTok session");
  session.disconnect();
}

export function doSubscribeToStream(elementId, session, stream) {
  session.subscribe(stream, elementId, {
    insertMode: 'append'
  }, handleError);
  console.log("Subscribed to stream:", stream);
}

export function doStartPublishing(session) {
  console.log("Starting publishing");
  const publisher = OT.initPublisher('publisher', {
    insertMode: 'append'
  }, handleError);
  session.publish(publisher, handleError);
  console.log("Started publishing");
  return publisher;
}

export function doStopPublishing(session, publisher) {
  console.log("Stopping publishing");
  session.unpublish(publisher);
  publisher.destroy();
  console.log("Stopped publishing");
}

export {OpenTokContext, OpenTokContextProvider, useOpenTokContext};