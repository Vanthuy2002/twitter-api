import { httpStatus } from '@/constants/httpStatus'
import { messResponse } from '@/constants/message'
import tweetServices from '@/services/tweets'
import { Request, Response } from 'express'

export class TweetController {
  async createTweet(req: Request, res: Response) {
    const {
      decoded: { id }
    }: any = req
    const data = await tweetServices.handleCreateTweet(id, req.body)
    res.status(data.status).json(data)
  }

  async getAllTweets(req: Request, res: Response) {
    const data = await tweetServices.getTweets(req)
    res.status(data.status).json(data)
  }

  async getDetailTweet(req: Request, res: Response) {
    const {
      tweet,
      decoded: { id }
    }: any = req
    const { tweet_id } = req.params
    const views = await tweetServices.increaseViewTweet(tweet_id, id)
    const data = { ...tweet, ...views }
    res
      .status(httpStatus.OK)
      .json({ message: messResponse.getTweetOk, tweet: data })
  }

  async getTweetChildren(req: Request, res: Response) {
    const results = await tweetServices.getTweetChild(req)
    res.status(results.status).json(results)
  }

  async getNewFeeds(req: Request, res: Response) {
    const data = await tweetServices.getTweetNewFeed(req)
    res.status(data.status).json(data)
  }
}
