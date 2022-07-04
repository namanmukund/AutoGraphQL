const DatabaseControllerMode = `
  enum DatabaseControllerMode {
    # Use Database Aggregation Pipeline.
    aggregation

    # Use Traditional Relation Directive Approach.
    cascade
  }`;

export default DatabaseControllerMode;
