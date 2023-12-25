import { httpStatus } from '@/constants/httpStatus'
import { messResponse } from '@/constants/message'
import dbServices from '@/database'
import { ObjectId } from 'mongodb'

type FindConversation = {
  sender_id: string
  receiver_id: string
  limit: number
  page: number
}

class ConversationServices {
  async getPrivateMessage({
    sender_id,
    receiver_id,
    limit,
    page
  }: FindConversation) {
    const offset = (page - 1) * limit
    const payloadFilter = [
      {
        sender_id: new ObjectId(sender_id), // user is sender
        receiver_id: new ObjectId(receiver_id)
      },
      {
        sender_id: new ObjectId(receiver_id), // user is receiver
        receiver_id: new ObjectId(sender_id)
      }
    ]
    const [conversations, totalDocs] = await Promise.all([
      dbServices.conversation
        .find({
          $or: payloadFilter
        })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      dbServices.conversation.countDocuments({
        $or: payloadFilter
      })
    ])

    const totalPages = Math.ceil(totalDocs / limit)
    return {
      message: messResponse.getPrivateConversation,
      status: httpStatus.OK,
      conversations,
      page,
      limit,
      totalDocs,
      totalPages
    }
  }

  async removeMessage(id: string) {
    await dbServices.conversation.deleteOne({ _id: new ObjectId(id) })
    return {
      message: messResponse.deleteMessage,
      status: httpStatus.OK
    }
  }

  async updateMessage({ id, content }: { id: string; content: string }) {
    const currentDate = new Date()
    const newMessage = await dbServices.conversation.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { content, updatedAt: currentDate }
      },
      { returnDocument: 'after' }
    )

    return {
      message: messResponse.updateMessage,
      status: httpStatus.OK,
      results: newMessage
    }
  }
}

const conversationServices = new ConversationServices()
export default conversationServices
