const RoleDetails = `
enum Role{
    owner
    organizer
    fileOrganizer
    writer
    commenter
    reader
}
`;

const TypeDetails = `
enum Type{
    user
    group
    domain
    anyone
}
`;

const PermissionInput = `
input PermissionInput{
        role: Role!
        type: Type
        email: String
        domain: String
    }`;

export default [PermissionInput, RoleDetails, TypeDetails];
