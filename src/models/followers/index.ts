import { FollowersType } from '@/types'
import { ObjectId } from 'mongodb'

export class Followers {
  _id: ObjectId
  user_id: ObjectId
  follow_user_id: ObjectId
  createdAt: Date

  constructor(follow: FollowersType) {
    const date = new Date()
    this._id = follow._id || new ObjectId()
    this.user_id = follow.user_id
    this.follow_user_id = follow.follow_user_id
    this.createdAt = follow.createdAt || date
  }
}
