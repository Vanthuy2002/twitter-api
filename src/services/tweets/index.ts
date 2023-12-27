import { httpStatus } from '@/constants/httpStatus'
import { messResponse } from '@/constants/message'
import dbServices from '@/database'
import { Hashtags } from '@/models/hashtags'
import { Tweets } from '@/models/tweets'
import { TweetAudience, TweetReq } from '@/types'
import { Request } from 'express'
import { ObjectId, WithId } from 'mongodb'

class TweetServices {
  async checkAndCreateHashtag(hashtags: string[]) {
    const hashtagsDocs = await Promise.all(
      hashtags.map((tag) => {
        return dbServices.hashtags.findOneAndUpdate(
          { title: tag },
          { $setOnInsert: new Hashtags({ title: tag }) },
          { upsert: true, returnDocument: 'after' }
        )
      })
    )
    return hashtagsDocs.map((tag) => (tag as WithId<Hashtags>)._id)
  }

  async handleCreateTweet(id: string, body: TweetReq) {
    const hashtags = await this.checkAndCreateHashtag(body.hashtags as string[])
    const payload = new Tweets({
      audience: body.audience,
      content: body.content,
      hashtags,
      mentions: body.mentions,
      medias: body.medias,
      parent_id: body.parent_id as any,
      type: body.type,
      user_id: new ObjectId(id)
    })

    await dbServices.tweets.insertOne(payload)
    return {
      message: messResponse.createTweet,
      status: httpStatus.CREATED
    }
  }

  async getTweets() {
    const tweets = dbServices.tweets.find({}).toArray()
    return {
      message: 'Get all tweets',
      status: 200,
      tweets
    }
  }
  async increaseViewTweet(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const tweet = await dbServices.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweet_id) },
      { $inc: inc, $currentDate: { updatedAt: true } },
      {
        returnDocument: 'after',
        projection: { guest_views: 1, user_views: 1, _id: 0, updatedAt: 1 }
      }
    )

    return tweet
  }
  async getTweetChild(req: Request) {
    const { tweet_id, type } = req.params
    const page = Number(req.query.page as string)
    const limit = Number(req.query.limit as string)
    const {
      decoded: { id }
    }: any = req
    const offset = (page - 1) * limit

    const filterCond = {
      parent_id: new ObjectId(tweet_id),
      type
    }

    const tweets = await dbServices.tweets
      .aggregate<Tweets>([
        { $match: filterCond },
        {
          $lookup: {
            from: 'hashtags',
            localField: 'hashtags',
            foreignField: '_id',
            as: 'hashtags'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_id'
          }
        },
        {
          $addFields: {
            hashtags: {
              $map: {
                input: '$hashtags',
                as: 'tags',
                in: {
                  _id: '$$tags._id',
                  title: '$$tags.title'
                }
              }
            },
            user_id: {
              $map: {
                input: '$user_id',
                as: 'user',
                in: {
                  _id: '$$user._id',
                  email: '$$user.email',
                  username: '$$user.username',
                  avatar: '$$user.avatar'
                }
              }
            }
          }
        },
        {
          $project: {
            createdAt: 0,
            updatedAt: 0,
            type: 0,
            parent_id: 0
          }
        }
      ])
      .skip(offset)
      .limit(limit)
      .toArray()

    const listId = tweets.map((item) => item._id as ObjectId)
    const inc = id ? { user_views: 1 } : { guest_views: 1 }

    const [totalDocs] = await Promise.all([
      dbServices.tweets.countDocuments(filterCond),
      dbServices.tweets.updateMany(
        {
          _id: {
            $in: listId
          }
        },
        {
          $inc: inc,
          $set: {
            updatedAt: new Date()
          }
        }
      )
    ])
    const totalPage = Math.ceil(totalDocs / limit)
    // updateMany not return docs after updated -> 1 . query again, 2 . mutate array
    tweets.forEach((tweet) => {
      tweet.updatedAt = new Date()
      if (id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })
    return {
      message: `Get ${type} of tweet succedd!!`,
      status: httpStatus.OK,
      data: tweets,
      type,
      page,
      limit,
      totalPage
    }
  }

  async getTweetNewFeed(req: Request) {
    const page = Number(req.query.page as string)
    const limit = Number(req.query.limit as string)
    const {
      decoded: { id }
    }: any = req

    const offset = (page - 1) * limit

    const listUserFollows = await dbServices.followers
      .find(
        {
          user_id: new ObjectId(id)
        },
        { projection: { follow_user_id: 1 } }
      )
      .toArray()

    const ids = listUserFollows.map((item) => item.follow_user_id)
    ids.push(new ObjectId(id))
    const [tweets, totalDocs] = await Promise.all([
      dbServices.tweets
        .aggregate<Tweets>([
          { $match: { user_id: { $in: ids } } },
          {
            $lookup: {
              from: 'hashtags',
              localField: 'hashtags',
              foreignField: '_id',
              as: 'hashtags'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user_id'
            }
          },
          {
            $match: {
              $or: [
                { audience: TweetAudience.Everyone },
                {
                  $and: [
                    { audience: TweetAudience.TwitterCircle },
                    { 'user.tweeter_circle': { $in: [new ObjectId(id)] } }
                  ]
                }
              ]
            }
          },
          {
            $skip: offset
          },
          {
            $limit: limit
          },
          {
            $lookup: {
              from: 'users',
              localField: 'mentions',
              foreignField: '_id',
              as: 'mentions'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: 'parent_id',
              as: 'retweets'
            }
          },
          {
            $addFields: {
              hashtags: {
                $map: {
                  input: '$hashtags',
                  as: 'tags',
                  in: {
                    _id: '$$tags._id',
                    title: '$$tags.title'
                  }
                }
              },
              user_id: {
                $map: {
                  input: '$user_id',
                  as: 'user',
                  in: {
                    _id: '$$user._id',
                    email: '$$user.email',
                    username: '$$user.username',
                    avatar: '$$user.avatar'
                  }
                }
              },
              tweetchildren: {
                $size: '$retweets'
              },
              user_retweets: {
                $size: {
                  $filter: {
                    input: '$retweets',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', 'retweet']
                    }
                  }
                }
              },
              user_comment: {
                $size: {
                  $filter: {
                    input: '$retweets',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', 'comment']
                    }
                  }
                }
              }
            }
          },
          { $unwind: { path: '$user_id' } },
          { $sort: { createdAt: -1 } },
          { $project: { createdAt: 0, updatedAt: 0 } }
        ])
        .toArray(),
      dbServices.tweets
        .aggregate([
          { $match: { user_id: { $in: ids } } },
          {
            $lookup: {
              from: 'hashtags',
              localField: 'hashtags',
              foreignField: '_id',
              as: 'hashtags'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user_id'
            }
          },
          {
            $match: {
              $or: [
                { audience: TweetAudience.Everyone },
                {
                  $and: [
                    { audience: TweetAudience.TwitterCircle },
                    { 'user.tweeter_circle': { $in: [new ObjectId(id)] } }
                  ]
                }
              ]
            }
          },
          {
            $count: 'totalTweets'
          }
        ])
        .toArray()
    ])

    const tweetIds = tweets.map((tweet) => tweet._id as ObjectId)
    await dbServices.tweets.updateMany(
      {
        _id: {
          $in: tweetIds
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updatedAt: new Date()
        }
      }
    )
    const totals = totalDocs[0].totalTweets || 0
    const totalPages = Math.ceil(totals / limit)

    return {
      message: messResponse.getNewFeed,
      status: 200,
      tweets,
      page,
      limit,
      totalPages
    }
  }
}

const tweetServices = new TweetServices()
export default tweetServices
