import { Bookmarks } from '@/types'
import { ObjectId } from 'mongodb'

export class BookMark {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  createdAt: Date
  updatedAt: Date

  constructor(bookmark: Bookmarks) {
    this._id = bookmark._id || new ObjectId()
    this.user_id = bookmark.user_id
    this.tweet_id = bookmark.tweet_id
    this.createdAt = bookmark.createdAt || new Date()
    this.updatedAt = bookmark.updatedAt || new Date()
  }
}
