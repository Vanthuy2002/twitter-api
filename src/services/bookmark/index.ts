import { httpStatus } from '@/constants/httpStatus'
import { messResponse } from '@/constants/message'
import dbServices from '@/database'
import { BookMark } from '@/models/bookmark'
import { Bookmarks } from '@/types'
import { ObjectId } from 'mongodb'

class BookMarkServices {
  async createBookMark(id: string, body: Omit<Bookmarks, '_id'>) {
    const payload = new BookMark({
      user_id: new ObjectId(id),
      tweet_id: new ObjectId(body.tweet_id)
    })

    const result = await dbServices.bookmark.findOneAndUpdate(
      { user_id: payload.user_id, tweet_id: payload.tweet_id },
      { $setOnInsert: new BookMark(payload) },
      { upsert: true, returnDocument: 'after' }
    )
    return {
      message: messResponse.createBookMark,
      status: httpStatus.CREATED,
      result
    }
  }

  async removeBookMark(id: string, tweet: string) {
    const payload = new BookMark({
      user_id: new ObjectId(id),
      tweet_id: new ObjectId(tweet)
    })

    await dbServices.bookmark.findOneAndDelete({
      user_id: payload.user_id,
      tweet_id: payload.tweet_id
    })

    return {
      message: 'Delete bookmark ok!',
      status: httpStatus.OK
    }
  }
}

const bookMarkServices = new BookMarkServices()
export default bookMarkServices
