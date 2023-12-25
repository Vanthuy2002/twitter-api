import { ConversationProperty } from '@/types'
import { ObjectId } from 'mongodb'

export class Conversation {
  _id: ObjectId
  content: any // string | file
  sender_id: ObjectId
  receiver_id: ObjectId
  createdAt: Date
  updatedAt: Date

  constructor(conversation: ConversationProperty) {
    const date = new Date()
    this._id = conversation._id as ObjectId
    this.content = conversation.content
    this.sender_id = conversation.sender_id
    this.receiver_id = conversation.receiver_id
    this.createdAt = conversation.createdAt || date
    this.updatedAt = conversation.updatedAt || date
  }
}
