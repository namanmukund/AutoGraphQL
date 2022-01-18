const SenseiMentorTeam = `
  type SenseiMentorTeam @model 
  {
    name: String!
    teamProfilePic: File @relation(name: "SenseiMentorTeamTeamProfilePic", direction: "OneWay")
    mentors: [MentorProfile] @relation(name:"MentorProfileSenseiMentorTeam", direction: "OneWay")
    senseiProfile: SenseiProfile @relation(name: "SenseiProfileSenseiMentorTeam")
  }
`;

export default [SenseiMentorTeam];
