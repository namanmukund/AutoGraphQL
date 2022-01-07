const TaskStatus = `
  enum TaskStatus {
    failedToAssign
    unassigned
    assigned
    confirmed
    completed
    mentorUnavailable
    mentorRejected
    leadRejected
    leadNotInterested
  }`;

export default TaskStatus;
