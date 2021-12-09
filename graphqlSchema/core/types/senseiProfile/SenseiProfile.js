const SenseiProfile = `
  type SenseiProfile @model {
    user: User! @relation(name: "SenseiProfileUser")
    mentors: [MentorProfile] @relation(name: "SenseiProfileMentorProfile")
    mentorTeam: [MentorTeam] @relation(name: "SenseiProfileMentorTeam")
}`;

export default [SenseiProfile];
