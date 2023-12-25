import { MediaRaw, MediaType } from '@/types'
import { UploadFileToS3 } from '@/utils/aws'
import {
  UPLOAD_DIR,
  handleUploadImage,
  handleUploadVideo,
  removeExt
} from '@/utils/uploads'
import { Request } from 'express'
import sharp from 'sharp'
import mime from 'mime'
import fsPromise from 'fs/promises'

class MediaServices {
  async uploadImage(req: Request): Promise<MediaRaw[]> {
    const files = await handleUploadImage(req)

    const results = await Promise.all(
      files.map(async (file: any) => {
        const newName = removeExt(file.newFilename)
        await sharp(file.filepath)
          .jpeg()
          .toFile(`${UPLOAD_DIR}/${newName}.jpeg`)

        const uploadInfo = await UploadFileToS3({
          filename: `images/${newName}.jpeg`,
          filepath: `${UPLOAD_DIR}/${newName}.jpeg`,
          contentype: mime.getType(`${UPLOAD_DIR}/${newName}.jpeg`) as string
        })

        await fsPromise.unlink(`${UPLOAD_DIR}/${newName}.jpeg`)
        return {
          message: 'Upload image to S3 success',
          filename: uploadInfo.Key as string,
          type: MediaType.Image,
          path: uploadInfo.Location as string
        }
      })
    )

    return results
  }

  async uploadVd(req: Request): Promise<any[]> {
    const files = await handleUploadVideo(req)

    const results = Promise.all(
      files.map(async (file) => {
        const uploadInfo = await UploadFileToS3({
          filename: `videos/${file.newFilename}`,
          filepath: file.filepath,
          contentype: mime.getType(file.filepath) as string
        })

        await fsPromise.unlink(file.filepath)

        return {
          message: 'Upload video success',
          filename: uploadInfo.Key as string,
          type: file.mimetype,
          path: uploadInfo.Location as string
        }
      })
    )
    return results
  }
}

const mediaServices = new MediaServices()
export default mediaServices
