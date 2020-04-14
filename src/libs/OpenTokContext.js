import React, {useContext, useState} from 'react';
import {
  openTokStartPublishing,
  openTokStartSession,
  openTokStopPublishing,
  openTokSubscribeToStream
} from "./openTokLib";

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

  function setSession(session) {
    setOpenTokContext(openTokContext => ({...openTokContext, session: session}));
  }

  function setPublisher(publisher) {
    setOpenTokContext(openTokContext => ({...openTokContext, publisher: publisher}));
  }

  function startSession(apiKey, sessionId, token, callback) {
    if (openTokContext.session) {
      if (openTokContext.session.sessionId !== sessionId) {
        console.log("SessionId has changed, disconnecting previous session");
        openTokContext.session.disconnect();
      } else {
        if (openTokContext.session.isConnected()) {
          console.log("Session is already connected");
          callback({
            type: "sessionConnected",
            session: openTokContext.session
          });
          return;
        }
      }
    }
    const session = openTokStartSession(apiKey, sessionId, token, callback)
    setSession(session);
  }

  function startPublishing(session, callback) {
    if (openTokContext.publisher) {
      console.log("Already publishing");
      return;
    }
    const publisher = openTokStartPublishing(session);
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
    if (openTokContext.session && openTokContext.publisher) {
      openTokStopPublishing(openTokContext.session, openTokContext.publisher)
      setPublisher(null);
    }
  }

  function subscribeToStream(elementId, session, stream) {
    openTokSubscribeToStream(elementId, session, stream);
  }

  return {
    openTokContext: openTokContext,
    startSession,
    startPublishing,
    stopPublishing,
    subscribeToStream,
    setSession,
    setPublisher
  }
};

export {OpenTokContext, OpenTokContextProvider, useOpenTokContext};