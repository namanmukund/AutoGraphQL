import FileType from '../collections/enum/FileType';
import FileUsageKind from '../collections/enum/FileUsageKind';

const File = `
  type File @model {
    name: String! @unique
    size: Int
    usageCount: Int @defaultValue(value: 0)
    uri: String! @unique
    fileKind: FileKind! @defaultValue(value: "content")
    type: FileType!
    usageKind: FileUsageKind
    mimeType: String!
  }`;

export default [File, FileType, FileUsageKind];
