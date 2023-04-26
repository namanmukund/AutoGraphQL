const SessionComponentTrackerStatus = `
    type SessionComponentTrackerStatus {
        componentId: ID
        visited: Boolean
        submitted: Boolean
        user: User @relation(name: "SessionComponentTrackerStatusUser", direction: "OneWay")
    }
`;

const ComponentStatus = `
    type ComponentStatus {
        componentName: String
        componentStatus: Boolean
    }
`;

const SessionComponentTracker = `
    type SessionComponentTracker @model {
        batchSession: BatchSession @relation(name: "SessionComponentTrackerBatchSession")
        video: [SessionComponentTrackerStatus]
        assignments: [SessionComponentTrackerStatus]
        learningObjective: [SessionComponentTrackerStatus]
        practice: [SessionComponentTrackerStatus]
        componentStatus: [ComponentStatus]
    }
`;

export default [SessionComponentTrackerStatus, ComponentStatus, SessionComponentTracker];
