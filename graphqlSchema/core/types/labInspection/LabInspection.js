const ProjectInteractivePanel = `
  enum ProjectInteractivePanel {
    smartBoard
    projector
    none
  }
`;

const LabSpeaker = `
  enum LabSpeaker {
    centralisedSpeaker
    headphones
    none
  }
`;
const PowerBackup = `
  enum PowerBackup {
    yes
    no
    partial
  }
`;

const LabConfiguration = `
  type LabConfiguration {
    totalNumberOfComputers: Int
    avgNumberOfStudents: Int
    projectInteractivePanel: ProjectInteractivePanel @defaultValue(value: "none")
    speakers: LabSpeaker @defaultValue(value: "none")
    powerBackup: PowerBackup @defaultValue(value: "no")
  }
`;

const LabInspection = `
  type LabInspection @model {
    labName: String
    description: String
    inspectionBy: User @relation(name: "LabInspectionByUser", direction: "OneWay")
    inspectionDate: Date
    schoolCoordinator: User @relation(name: "LabInspectionSchoolCoordinator", direction: "OneWay")
    labConfiguration: LabConfiguration
    systems: [LabInspectedDevice] @relation(name: "LabInspectedDevices")
    school: School @relation(name:"LabInspectionLab")
  }
`;

const LabInspectionChecks = `
  type LabInspectionChecks {
    name: String
    type: String
    status: String
    spec: String
  }
`;

const LabInspectedDevice = `
  type LabInspectedDevice @model {
    serialNo: Int
    uniqueDeviceId: String
    status: String
    inspectionMode: String @defaultValue(value: "online")
    basicChecks: [LabInspectionChecks]
    applicationChecks: [LabInspectionChecks]
    firewallChecks: [LabInspectionChecks]
    systemInformation: String
    previousLogs: [String]
    inspection: LabInspection @relation(name: "LabInspectedDevices")
    school: School @relation(name: "SchoolLabInspectedDevice")
  }
`;

export default [
  ProjectInteractivePanel,
  LabInspectionChecks,
  LabConfiguration,
  PowerBackup,
  LabSpeaker,
  LabInspection,
  LabInspectedDevice,
];
