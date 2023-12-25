import { httpStatus } from '@/constants/httpStatus'
import { messResponse } from '@/constants/message'
import { ErrorWithStatus } from '@/models/Errors'
import mediaServices from '@/services/media'
import { MediaRaw } from '@/types'
import { UPLOAD_DIR } from '@/utils/uploads'
import { Request, Response } from 'express'
import fs from 'node:fs'
import mime from 'mime'

export class MediaController {
  async uploadImage(req: Request, res: Response) {
    const result: MediaRaw[] = await mediaServices.uploadImage(req)
    const urls = result.map((media) => {
      return {
        name: media.filename,
        path: media.path,
        type: media.type
      }
    })
    res.json({ message: messResponse.uploadFile, urls })
  }

  async uploadVideos(req: Request, res: Response) {
    const info = await mediaServices.uploadVd(req)
    const urls = info.map((media) => {
      return {
        message: media.message,
        name: media.filename,
        path: media.path,
        type: media.type
      }
    })
    res.json(urls)
  }

  async streamingVideos(req: Request, res: Response) {
    const { range } = req.headers
    if (!range) {
      throw new ErrorWithStatus({
        message: 'Require range headers',
        status: httpStatus.BAD_REQUEST
      })
    }

    const { name } = req.params
    const videoPath = `${UPLOAD_DIR}/${name}`

    // Dung lượng file
    const videoSize = fs.statSync(videoPath).size
    // Dung lượng video cho mỗi phâm đoạn stream
    const chunkSize = 10 ** 6
    // Lấy giá trị byte bắt đầu từ range 'bytes=104548-'
    const start = Number(range.replace(/\D/g, ''))
    // Lấy byte kết thúc vượt quá thì lấy video size
    const end = Math.min(start + chunkSize, videoSize - 1)

    // Dung lượng thưc tế mỗi đoạn stream
    // chunkSize -> ngoại trừ đoạn cuối

    const contentLength = end - start + 1
    const contentType = mime.getType(videoPath) || 'video/*'
    const headers = {
      'Content-Range': `bytes ${start} - ${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': contentType
    }
    res.writeHead(httpStatus.PARTIAL_CONTENT, headers)
    const videoStream = fs.createReadStream(videoPath, { start, end })
    videoStream.pipe(res)
  }
}
