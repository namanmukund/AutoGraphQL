# 📁 File Management & Storage Guide in AutoGraphQL

This guide explains AutoGraphQL's integrated **File Management Architecture**, covering GraphQL multipart uploads, AWS S3 / CloudFront storage, automatic image resizing, file validation, and attaching files to database entities.

---

## 📑 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [The `File` Model Schema](#2-the-file-model-schema)
3. [Storage Provider Configuration (Local & AWS S3)](#3-storage-provider-configuration)
4. [The `uploadFile` Mutation & Entity Linking](#4-the-uploadfile-mutation--entity-linking)
5. [Automatic Image Resizing & Processing](#5-automatic-image-resizing--processing)
6. [Validation & Security Safeguards](#6-validation--security-safeguards)
7. [Client Upload Examples (cURL, JavaScript & Apollo Client)](#7-client-upload-examples)

---

## 1. Architecture Overview

AutoGraphQL provides a unified file handling pipeline following the official **[GraphQL Multipart Request Specification](https://github.com/jaydenseric/graphql-multipart-request-spec)**:

```
[ Client / Browser ]
        │  (multipart/form-data)
        ▼
[ graphqlUpload Middleware ] ──► [ Extension & Size Validation ]
        │
        ├──► [ Temporary Disk Buffer / Local Storage ]
        ├──► [ Optional Image Resizing (Sharp) ]
        └──► [ AWS S3 Upload (uploadToS3) ]
        │
        ▼
[ Database Resolver ] ──► Creates `File` document & connects to target model (e.g. User.avatar)
```

---

## 2. The `File` Model Schema

AutoGraphQL provides a built-in `File` entity with rich metadata:

```graphql
type File @model {
  id: ID!
  name: String!                       # Original filename (e.g. "profile.png")
  size: Int                           # File size in bytes
  usageCount: Int @defaultValue(value: 0) # Reference counter
  uri: String! @unique                # S3 Key or storage path
  signedUri: String                   # Pre-signed URL for private buckets
  fileBucket: FileBucket!             # Configured storage bucket
  type: FileType!                     # File category: image, video, pdf, document, audio
  usageKind: FileUsageKind            # avatar, thumbnail, banner, attachment
  mimeType: String!                   # MIME type: image/jpeg, application/pdf
  createdAt: Date!
  updatedAt: Date!
}
```

### Supported Enums:
- **`FileType`**: `image`, `video`, `pdf`, `document`, `audio`, `apk`, `other`
- **`FileUsageKind`**: `avatar`, `coverPhoto`, `attachment`, `thumbnail`, `hero`, `content`

---

## 3. Storage Provider Configuration

Configure storage credentials in `.env`:

```bash
# Storage Provider Configuration
FILE_STORAGE_PROVIDER=s3              # Options: 's3' or 'local'
UPLOAD_DIR=/tmp/uploads               # Local buffer directory

# AWS S3 & CloudFront CDN
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=my-autographql-bucket
CLOUDFRONT_DOMAIN=https://cdn.example.com

# File Limits & Extensions
MAX_FILE_SIZE_MB=25                   # Maximum allowed file size
ALLOWED_FILE_EXTENSIONS=jpg,jpeg,png,webp,pdf,mp4,zip
```

---

## 4. The `uploadFile` Mutation & Entity Linking

AutoGraphQL exposes a dedicated `uploadFile` mutation that uploads the binary file, records its metadata in the `File` collection, and **automatically links it to the target entity**:

```graphql
mutation UploadAndConnectAvatar($file: Upload!, $connectInput: FileConnectInput!) {
  uploadFile(file: $file, connectInput: $connectInput) {
    id
    name
    uri
    signedUri
    size
    mimeType
  }
}
```

### `FileConnectInput` Structure:
```json
{
  "connectInput": {
    "type": "User",              // Target Model Name
    "typeId": "usr_clx123abc456", // Target Record ID
    "typeField": "avatar",       // Target Field on the Model
    "fileId": "file_existing_id" // Optional: replace an existing file ID
  }
}
```

---

## 5. Automatic Image Resizing & Processing

For image uploads, AutoGraphQL can automatically generate optimized dimensions (thumbnails, medium, large) using Sharp / Canvas:

```
Original Upload (2000x2000)
    │
    ├──► S3: /uploads/files/original.jpg
    ├──► S3: /uploads/files/thumb_150x150.jpg
    └──► S3: /uploads/files/medium_800x800.jpg
```

---

## 6. Validation & Security Safeguards

1. **Size Limits**: Rejects uploads exceeding `MAX_FILE_SIZE_MB` with `InvalidFileUploadSizeError`.
2. **MIME & Extension Whitelisting**: Rejects disallowed file types with `InvalidFileUploadExtensionError`.
3. **Target Record Verification**: Verifies that the target entity (`typeId`) exists in the database before uploading to S3, preventing orphan files.
4. **Pre-Signed URLs**: Private files in restricted buckets generate secure, time-limited pre-signed S3 URLs (`signedUri`).

---

## 7. Client Upload Examples

### A. Uploading with cURL (GraphQL Multipart Spec)

```bash
curl http://localhost:3000/graphql/core \
  -F operations='{ "query": "mutation ($file: Upload!, $connectInput: FileConnectInput!) { uploadFile(file: $file, connectInput: $connectInput) { id uri name } }", "variables": { "file": null, "connectInput": { "type": "User", "typeId": "usr_123", "typeField": "avatar" } } }' \
  -F map='{ "0": ["variables.file"] }' \
  -F 0=@/path/to/my-avatar.png \
  -H "Authorization: Bearer <USER_JWT_TOKEN>"
```

---

### B. Uploading with JavaScript & Axios / Fetch

```javascript
const formData = new FormData();

const operations = {
  query: `
    mutation UploadUserAvatar($file: Upload!, $connectInput: FileConnectInput!) {
      uploadFile(file: $file, connectInput: $connectInput) {
        id
        uri
        size
      }
    }
  `,
  variables: {
    file: null,
    connectInput: {
      type: 'User',
      typeId: 'usr_clx123abc456',
      typeField: 'avatar',
    },
  },
};

formData.append('operations', JSON.stringify(operations));
formData.append('map', JSON.stringify({ 0: ['variables.file'] }));
formData.append('0', fileInputElement.files[0]);

const response = await fetch('http://localhost:3000/graphql/core', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
console.log('Uploaded File:', result.data.uploadFile);
```

---

### C. Uploading with Apollo Client (`apollo-upload-client`)

```javascript
import { createUploadLink } from 'apollo-upload-client';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  link: createUploadLink({ uri: 'http://localhost:3000/graphql/core' }),
  cache: new InMemoryCache(),
});

const UPLOAD_FILE_MUTATION = gql`
  mutation UploadFile($file: Upload!, $connectInput: FileConnectInput!) {
    uploadFile(file: $file, connectInput: $connectInput) {
      id
      uri
      mimeType
    }
  }
`;

await client.mutate({
  mutation: UPLOAD_FILE_MUTATION,
  variables: {
    file: myFileObject,
    connectInput: {
      type: 'Post',
      typeId: 'post_789',
      typeField: 'featuredImage',
    },
  },
});
```
