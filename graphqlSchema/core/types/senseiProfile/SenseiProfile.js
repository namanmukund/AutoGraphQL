const SenseiProfile = `
  type SenseiProfile @model {
    user: User! @relation(name: "SenseiProfileUser")
    mentors: [MentorProfile] @relation(name: "SenseiProfileMentorProfile")
    SenseiMentorTeam: [SenseiMentorTeam] @relation(name: "SenseiProfileSenseiMentorTeam")
}`;

export default [SenseiProfile];
