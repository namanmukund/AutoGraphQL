const MentorTeam = `
  type MentorTeam @model 
  {
    name: String!
    profilePic: File @relation(name: "MentorTeamprofilePic", direction: "OneWay")
    mentors: [MentorProfile] @relation(name:"MentorProfileMentorTeam", direction: "OneWay")
    senseiProfile: SenseiProfile @relation(name: "SenseiProfileMentorTeam")
  }
`;

export default [MentorTeam];
