import FileType from '../collections/enum/FileType';
import FileUsageKind from '../collections/enum/FileUsageKind';

const File = `
  type File @model {
    name: String!
    size: Int
    usageCount: Int @defaultValue(value: 0)
    uri: String! @unique
    signedUri: String
    fileBucket: FileBucket! @defaultValue(value: "python")
    type: FileType!
    usageKind: FileUsageKind
    mimeType: String!
  }`;

export default [File, FileType, FileUsageKind];
