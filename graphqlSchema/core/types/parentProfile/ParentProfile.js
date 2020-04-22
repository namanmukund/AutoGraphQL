const ParentProfile = `
  type ParentProfile @model {
    user: User! @relation(name: "ParentProfileUser")
    children: [StudentProfile] @relation(name: "StudentProfileParentProfile")
    hasLaptopOrDesktop: Boolean
}`;

export default [ParentProfile];
