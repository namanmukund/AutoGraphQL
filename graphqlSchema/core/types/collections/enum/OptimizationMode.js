const OptimizationMode = `
  enum OptimizationMode {
    # Use Database Aggregation Pipeline Without Projection Stage.
    aggregation
    
    # Use Database Aggregation Pipeline With Projection Stage.
    projectedAggregation

    # Use Traditional Relation Directive Approach.
    cascade
  }`;

export default OptimizationMode;
