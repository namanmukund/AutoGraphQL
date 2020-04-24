const options = {
  autoIndex: true,
  autoReconnect: true,
  reconnectTries: Number.MAX_SAFE_INTEGER, // Never stop trying to reconnect
  reconnectInterval: 500, // Reconnect every 500ms
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0,
  keepAlive: 120,
  bufferCommands: false,
  //  current URL string parser is deprecated, hence useNewUrlParser arg required
  useNewUrlParser: true,
};

export default options;
