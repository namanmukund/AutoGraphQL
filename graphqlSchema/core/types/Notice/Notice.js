const NoticeAttachment = `
  type NoticeAttachment @model{
    fileName: String
    attachedFile: File @relation(name: "NoticeAttachmentFile", direction: "OneWay")
  }
`;

const Notice = `
  type Notice @model
  {
    type: NoticeType!
    sentBy: User! @relation(name: "NoticeSentByUser", direction: "OneWay")
    sentTo: [User]! @relation(name: "NoticeSentToUser", direction: "OneWay")
    attachedFiles: [NoticeAttachment] @relation(name: "NoticeAttachmentAttachedFile", direction: "OneWay")
    messgae: String!
    scheduledAt: Date
    batch: Batch @relation(name: "BatchNotice")
  }
`;

export default [Notice, NoticeAttachment];
