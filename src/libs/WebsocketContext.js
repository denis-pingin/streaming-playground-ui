import React, {useContext, useRef, useState} from "react";

const WebsocketContext = React.createContext([
  {
    websocket: null,
    subscriptions: {},
    callbacks: new Set()
  },
  () => {}
]);

const WebsocketContextProvider = (props) => {
  const [websocketContext, setWebsocketContext] = useState({
    websocket: null,
    subscriptions: {},
    callbacks: new Set()
  });
  return (
    <WebsocketContext.Provider value={[websocketContext, setWebsocketContext]}>
      {props.children}
    </WebsocketContext.Provider>
  );
}

const useWebsocketContext = () => {
  const [websocketContext, setWebsocketContext] = useContext(WebsocketContext);
  const webSocketContextRef = useRef(websocketContext)

  function websocketOn(callback) {
    const callbacks = getCallbacks();
    callbacks.add(callback);
    setCallbacks(callbacks);
  }

  function websocketOff(callback) {
    const callbacks = getCallbacks();
    callbacks.delete(callback);
    setCallbacks(callbacks);
  }

  function getCallbacks() {
    return webSocketContextRef.current.callbacks || new Set();
  }

  function setCallbacks(callbacks) {
    webSocketContextRef.current.callbacks = callbacks;
    setWebsocketContext(websocketContext => ({...websocketContext, callbacks: callbacks}));
  }

  function invokeCallbacks() {
    getCallbacks().forEach(callback => callback(websocketContext));
  }

  function websocketIsConnected() {
    const websocket = getWebsocket();
    return websocket && websocket.readyState === WebSocket.OPEN;
  }

  function getWebsocket() {
    return webSocketContextRef.current.websocket;
  }

  function setWebsocket(websocket) {
    webSocketContextRef.current.websocket = websocket;
    setWebsocketContext(websocketContext => ({...websocketContext, websocket: websocket}));
  }

  function getSubscriptions() {
    return webSocketContextRef.current.subscriptions;
  }

  function setSubscriptions(subscriptions) {
    webSocketContextRef.current.subscriptions = subscriptions;
    setWebsocketContext(websocketContext => ({...websocketContext, subscriptions: subscriptions}));
  }

  function websocketConnect(url) {
    console.log("Connecting websocket using URL:", url);
    let ws = new WebSocket(url);
    ws.onopen = () => {
      console.log('Websocket connected');
    }
    ws.onmessage = event => {
      event = JSON.parse(event.data)
      console.log('Websocket message:', event);
      const subscriptions = websocketContext.subscriptions;
      let callbacks = subscriptions[event.type];
      if (callbacks) {
        callbacks.forEach((callback) => {
          callback(event);
        });
      }
    }
    ws.onclose = () => {
      console.log('Websocket disconnected, reconnecting...');
      websocketConnect(url);
    }
    setWebsocket(ws);
    invokeCallbacks();
  }

  function websocketDisconnect() {
    console.log("Disconnecting websocket");
    const websocket = websocketContext.websocket;
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      throw new Error("Websocket is not connected");
    }
    websocket.close();
    setWebsocket(null);
  }

  function websocketSend(eventType, message) {
    const websocket = getWebsocket();
    console.log("Sending websocket event:", eventType, message, websocket);
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      throw new Error("Websocket is not connected");
    }
    websocket.send(JSON.stringify({
      action: eventType,
      data: message
    }));
  }

  function websocketSubscribe(eventType, callback) {
    console.log("Subscribing to websocket event:", eventType, websocketContext);
    const subscriptions = getSubscriptions();
    let callbacks = subscriptions[eventType];
    if (!callbacks) {
      callbacks = new Set();
      subscriptions[eventType] = callbacks;
    }
    callbacks.add(callback);
    setSubscriptions(subscriptions);
  }

  function websocketUnsubscribe(eventType, callback) {
    console.log("Unsubscribing from websocket event:", eventType);
    const subscriptions = websocketContext.subscriptions;
    let callbacks = subscriptions[eventType];
    if (callbacks) {
      callbacks.delete(callback);
      setSubscriptions(subscriptions);
    }
  }

  return {
    websocketOn,
    websocketOff,
    websocketIsConnected,
    websocketConnect,
    websocketDisconnect,
    websocketSend,
    websocketSubscribe,
    websocketUnsubscribe
  }
};

export {WebsocketContext, WebsocketContextProvider, useWebsocketContext};