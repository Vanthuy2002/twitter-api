import bookMarkServices from '@/services/bookmark'
import { Request, Response } from 'express'

export class BookMarkController {
  async createNewBookMark(req: Request, res: Response) {
    const {
      decoded: { id }
    }: any = req
    const data = await bookMarkServices.createBookMark(id, req.body)
    res.status(data.status).json(data)
  }

  async unBookMark(req: Request, res: Response) {
    const {
      decoded: { id }
    }: any = req
    const { tweet } = req.params
    const data = await bookMarkServices.removeBookMark(id, tweet)
    res.status(data.status).json(data)
  }
}
