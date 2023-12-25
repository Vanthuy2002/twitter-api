import meServices from '@/services/users'
import { UpdateMeBody } from '@/types'
import { Request, Response } from 'express'

export default class MeController {
  async getMe(req: Request, res: Response) {
    const {
      decoded: { id }
    }: any = req
    const data = await meServices.getUser(id)
    res.status(data.status).json({ ...data })
  }

  async updateMe(req: Request, res: Response) {
    const payload = req.body as Partial<UpdateMeBody>
    const {
      decoded: { id }
    }: any = req
    const data = await meServices.updateUser(id, payload)

    res.status(data.status).json({ ...data })
  }

  async getUserProfile(req: Request, res: Response) {
    const { username } = req.params
    const data = await meServices.getClient(username)
    res.status(data.status).json({ ...data })
  }

  async followSomeOne(req: Request, res: Response) {
    const {
      decoded: { id }
    }: any = req
    const { followed_id } = req.body

    const data = await meServices.followUser(id, followed_id)
    res.status(data.status).json({ ...data })
  }

  async unFollowSomeOne(req: Request, res: Response) {
    const {
      decoded: { id }
    }: any = req
    const { user_id: follow_user_id } = req.params

    const data = await meServices.unfollowUser(id, follow_user_id)
    res.status(data.status).json({ ...data })
  }
}
