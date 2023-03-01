const ProjectInteractivePanel = `
  enum ProjectInteractivePanel {
    smartBoard
    projector
    smartTV
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
const PowerBackupType = `
  enum PowerBackupType {
    centralised
    individual
    none
  }
`;
const InternetConnectionEnum = `
  enum InternetConnectionEnum {
    hotspot
    lan
    wifi
    none
  }
`;

const ServiceProviderTypeEnum = `
  enum ServiceProviderTypeEnum {
    broadband
    leasedLine
    fiberOpticConnection
    simDongle
    none
  }
`;

const LabConfiguration = `
  type LabConfiguration {
    totalNumberOfComputers: Int
    totalNumberOfWorkingComputers: Int
    projectInteractivePanel: ProjectInteractivePanel @defaultValue(value: "none")
    speakers: LabSpeaker @defaultValue(value: "none")
    powerBackupType: PowerBackupType
    powerBackup: PowerBackup @defaultValue(value: "no")
    internetConnection: InternetConnectionEnum @defaultValue(value: "lan")
    serviceProviderType: ServiceProviderTypeEnum
    internetSpeed: Int
    inspectionDate: Date
  }
`;

const LabInspection = `
  type LabInspection @model @databaseController(mode: "aggregation") {
    labName: String
    labNo: Int
    description: String
    inspectionBy: User @relation(name: "LabInspectionByUser", direction: "OneWay")
    inspectionDate: Date
    schoolCoordinator: User @relation(name: "LabInspectionSchoolCoordinator", direction: "OneWay")
    labConfiguration: LabConfiguration
    media: [File] @relation(name: "LabConfigurationMedia", direction: "OneWay")
    systems: [LabInspectedDevice] @relation(name: "LabInspectedDevices")
    school: School @relation(name:"LabInspectionLab")
    comment: String
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
  type LabInspectedDevice @model @databaseController(mode: "aggregation") {
    serialNo: Int
    uniqueDeviceId: String
    status: String
    inspectionMode: String @defaultValue(value: "online")
    inspectionChecks: [LabInspectionChecks]
    systemInformation: String
    inspectionDate: Date
    comment: String
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
  PowerBackupType,
  InternetConnectionEnum,
  ServiceProviderTypeEnum,
];
