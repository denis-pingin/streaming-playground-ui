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
    return session && publisher && true;
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

  function startSession(config, callback) {
    if (!config || !config.apiKey || !config.sessionId || !config.openTokToken) {
      throw new Error("Invalid session config: " + JSON.stringify(config));
    }
    let session = getSession();
    if (session) {
      if (session.sessionId !== config.sessionId) {
        stopSession();
      } else {
        if (session.isConnected()) {
          if (typeof(callback) === 'function') {
            callback({
              type: "sessionConnected",
              session: session
            });
          }
          return;
        }
      }
    }
    session = doStartSession(config.apiKey, config.sessionId, config.openTokToken, callback)
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
        if (typeof(callback) === 'function') {
          callback(event);
        }
      },
      streamDestroyed: function (event) {
        if (typeof(callback) === 'function') {
          callback(event);
        }
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

  session.on('streamCreated', function (event) {
    if (typeof(callback) === 'function') {
      callback(event);
    }
  });

  session.connect(token, function (error) {
    if (error) {
      console.log("Session connection error", error);
      if (typeof(callback) === 'function') {
        callback({
          type: "sessionConnectionError",
          session: session,
          error: error
        });
      }
    } else {
      if (typeof(callback) === 'function') {
        callback({
          type: "sessionConnected",
          session: session
        });
      }
    }
  });

  return session;
}

export function doDisconnectFromSession(session) {
  session.disconnect();
}

export function doSubscribeToStream(elementId, session, stream) {
  session.subscribe(stream, elementId, {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  }, handleError);
}

export function doStartPublishing(session) {
  const publisher = OT.initPublisher('publisher', {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  }, handleError);
  session.publish(publisher, handleError);
  return publisher;
}

export function doStopPublishing(session, publisher) {
  session.unpublish(publisher);
  publisher.destroy();
}

export {OpenTokContext, OpenTokContextProvider, useOpenTokContext};