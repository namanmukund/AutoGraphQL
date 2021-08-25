const BDProfile = `
  type BDProfile @model {
    user: User! @relation(name: "BDProfileUser")
    schools: [School] @relation(name: "BDProfileSchool")
}`;

export default [BDProfile];
