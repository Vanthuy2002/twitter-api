import { messageValidator } from '@/constants/message'
import { Request } from 'express'
import { File } from 'formidable'
import path from 'path'

export const UPLOAD_DIR = path.resolve('uploads/static')
const maxSize = 500 * 1024 // max is 500kb
const maxFiles = 4

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_DIR,
    maxFiles,
    keepExtensions: true,
    maxFieldsSize: maxSize,
    maxTotalFileSize: 4 * maxSize,
    filter: ({ name, mimetype }): boolean => {
      const isImage = name === 'image' && Boolean(mimetype?.includes('image'))
      if (!isImage) {
        form.emit(
          'error' as any,
          new Error(messageValidator.imageUpload) as any
        )
      }
      return isImage
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.image as unknown as File[])
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_DIR,
    maxFiles: 1,
    keepExtensions: true,
    maxFieldsSize: 50 * 1024 * 1024 // 50M
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.video as unknown as File[])
    })
  })
}

export const removeExt = (filename: string) => {
  const ext = filename.split('.')
  ext.pop()
  return ext.join(' ')
}
