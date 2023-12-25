import { HashtagContructor } from '@/types'
import { ObjectId } from 'mongodb'

export class Hashtags {
  _id?: ObjectId
  title: string
  createdAt: Date
  updatedAt: Date

  constructor(hashtag: HashtagContructor) {
    this._id = hashtag._id || new ObjectId()
    this.title = hashtag.title
    this.createdAt = hashtag.createdAt || new Date()
    this.updatedAt = hashtag.updatedAt || new Date()
  }
}
