import {logError} from "./errorLib";

const OT = require('@opentok/client');

function handleError(error) {
  if (error) {
    logError(error);
  }
}

export function openTokStartSession(apiKey, sessionId, token, callback) {
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

export function openTokDisconnectFromSession(session) {
  session.disconnect();
}

export function openTokSubscribeToStream(elementId, session, stream) {
  session.subscribe(stream, elementId, {
    insertMode: 'append'
  }, handleError);
  console.log("Subscribed to stream:", stream);
}

export function openTokStartPublishing(session) {
  const publisher = OT.initPublisher('publisher', {
    insertMode: 'append'
  }, handleError);
  session.publish(publisher, handleError);
  console.log("Started publishing");
  return publisher;
}

export function openTokStopPublishing(session, publisher) {
  session.unpublish(publisher);
  publisher.destroy();
  console.log("Stopped publishing");
}