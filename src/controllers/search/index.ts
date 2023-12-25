import searchServices from '@/services/search'
import { Request, Response } from 'express'

export class SearchController {
  async searchByTweets(req: Request, res: Response) {
    const {
      decoded: { id }
    }: any = req
    const results = await searchServices.searchTweet(req.query as any, id)
    res.status(results.status).json(results)
  }

  async searchByHashtags(req: Request, res: Response) {
    const {
      decoded: { id }
    }: any = req

    const results = await searchServices.searchHashTags(req.query as any, id)
    res.status(results.status).json(results)
  }
}
