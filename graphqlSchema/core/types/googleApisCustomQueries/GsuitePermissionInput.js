const GsuitePermissionRole = `
enum Role{
    owner
    organizer
    fileOrganizer
    writer
    commenter
    reader
}
`;

const GsuitePermissionType = `
enum GsuitePermissionType {
    user
    group
    domain
    anyone
}
`;

// When creating a permission, if type is user or group, you must provide an emailAddress for the user or group.
// When type is domain, you must provide a domain. There isn't extra information required for a anyone type.
/**
 * example input -
 * {
 *      role: 'owner' ....
 *      type: 'user',
 *      email: 'xyz@gmail.com',
 *      domain: 'tekie.in'
 * }
 */
const GsuitePermissionInput = `
input GsuitePermissionInput{
        role: GsuitePermissionRole!
        type: GsuitePermissionType
        email: String
        domain: String
    }`;

export default [GsuitePermissionInput, GsuitePermissionRole, GsuitePermissionType];
