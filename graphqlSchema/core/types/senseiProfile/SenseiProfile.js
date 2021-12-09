const SenseiProfile = `
  type SenseiProfile @model {
    user: User! @relation(name: "SenseiProfileUser")
    mentors: [MentorProfile] @relation(name: "SenseiProfileMentorProfile")
    senseiMentorTeams: [SenseiMentorTeam] @relation(name: "SenseiProfileSenseiMentorTeam")
}`;

export default [SenseiProfile];
