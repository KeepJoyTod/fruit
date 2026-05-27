const events = {};

function on(eventName, handler) {
  if (!eventName || typeof handler !== "function") {
    return function noop() {};
  }

  if (!events[eventName]) {
    events[eventName] = [];
  }

  events[eventName].push(handler);

  return function offHandler() {
    off(eventName, handler);
  };
}

function once(eventName, handler) {
  if (typeof handler !== "function") {
    return function noop() {};
  }

  const offHandler = on(eventName, function onceHandler(payload) {
    offHandler();
    handler(payload);
  });

  return offHandler;
}

function off(eventName, handler) {
  if (!eventName || !events[eventName]) {
    return;
  }

  if (!handler) {
    delete events[eventName];
    return;
  }

  events[eventName] = events[eventName].filter((item) => item !== handler);

  if (events[eventName].length === 0) {
    delete events[eventName];
  }
}

function emit(eventName, payload) {
  if (!eventName || !events[eventName]) {
    return;
  }

  events[eventName].slice().forEach((handler) => {
    try {
      handler(payload);
    } catch (error) {
      console.error(`event handler failed: ${eventName}`, error);
    }
  });
}

module.exports = {
  on,
  once,
  off,
  emit
};
