import { Request, Response } from 'express'
import conversationServices from '@/services/conversation'

export class ConversationController {
  async getMessByReceiverId(req: Request, res: Response) {
    const {
      decoded: { id }
    }: any = req
    const { receiver_id } = req.params
    const { limit, page } = req.query
    const data = await conversationServices.getPrivateMessage({
      sender_id: id,
      receiver_id,
      limit: Number(limit),
      page: Number(page)
    })
    res.status(data.status).json(data)
  }

  async deletePrivateMessage(req: Request, res: Response) {
    const { message_id } = req.params
    const data = await conversationServices.removeMessage(message_id)
    res.status(data.status).json(data)
  }

  async updatePrivateMessage(req: Request, res: Response) {
    const { message_id } = req.params
    const { content } = req.body
    const data = await conversationServices.updateMessage({
      id: message_id,
      content
    })
    res.status(data.status).json(data)
  }
}
