const BDEProfile = `
  type BDEProfile @model {
    user: User! @relation(name: "BDEProfileUser")
    schools: [School] @relation(name: "BDEProfileSchool")
}`;

export default [BDEProfile];
