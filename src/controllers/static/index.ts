import { UPLOAD_DIR } from '@/utils/uploads'
import { Request, Response } from 'express'
import path from 'path'

export default class StaticController {
  async getStaticImage(req: Request, res: Response) {
    const { name } = req.params
    res.sendFile(path.resolve(UPLOAD_DIR, name), (error) => {
      if (error) {
        res
          .status((error as any).status)
          .json({ message: 'Not found resources' })
      }
    })
  }
}
