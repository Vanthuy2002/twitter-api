import { configEnvs } from '@/config'
import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'
import path from 'path'

const s3 = new S3({
  region: configEnvs.awsRegion,
  credentials: {
    secretAccessKey: configEnvs.awsSecretKey as string,
    accessKeyId: configEnvs.awsAccessKey as string
  }
})

export const UploadFileToS3 = ({
  filename,
  filepath,
  contentype = 'application/octet-stream'
}: {
  filename: string
  filepath: string
  contentype?: string
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: {
      Bucket: 'twitter-app-ap-southeast-1', //bucket name
      ContentType: contentype, // stop auto download to use content-type
      Key: filename, // name default after upload
      Body: fs.readFileSync(path.resolve(filepath)) // file need upload
    },

    tags: [], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size, max is 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  })
  return parallelUploads3.done()
}
