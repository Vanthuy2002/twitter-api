import { httpStatus } from '@/constants/httpStatus'
import { messResponse } from '@/constants/message'
import dbServices from '@/database'
import { Tweets } from '@/models/tweets'
import {
  HashtagQuery,
  MediaType,
  SearchQuery,
  TweetAudience,
  TweetType
} from '@/types'
import { ObjectId } from 'mongodb'

class SearchServices {
  async searchTweet(query: SearchQuery, id: string) {
    const page = Number(query.page)
    const limit = Number(query.limit)
    const mediaType = query.type
    const peopleFollow = query.people_follow
    const offset = (page - 1) * limit

    const $match: any = {
      $text: {
        $search: query.content
      }
    }
    if (mediaType) {
      if (mediaType === MediaType.Image) {
        $match['medias.type'] = MediaType.Image
      }
      if (mediaType === MediaType.Video) {
        $match['medias.type'] = MediaType.Video
      }
    }
    // if query params has people_follow  query -> get list user me follow -> add to $match cond
    if (peopleFollow) {
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
      $match['user_id'] = { $in: ids }
    }

    const [tweets, totalDocs] = await Promise.all([
      dbServices.tweets
        .aggregate<Tweets>([
          {
            $match
          },
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
                {
                  audience: TweetAudience.Everyone
                },
                {
                  $and: [
                    {
                      audience: TweetAudience.TwitterCircle
                    },
                    {
                      'user.tweeter_circle': {
                        $in: [new ObjectId(id)]
                      }
                    }
                  ]
                }
              ]
            }
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
              from: 'tweets',
              localField: '_id',
              foreignField: 'parent_id',
              as: 'retweets_user'
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
                $size: '$retweets_user'
              },
              user_retweets: {
                $size: {
                  $filter: {
                    input: '$retweets_user',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.Retweet]
                    }
                  }
                }
              },
              user_comment: {
                $size: {
                  $filter: {
                    input: '$retweets_user',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.Comment]
                    }
                  }
                }
              }
            }
          },
          {
            $unwind: {
              path: '$user_id'
            }
          },
          {
            $skip: offset
          },
          {
            $limit: limit
          },
          {
            $sort: {
              createdAt: -1
            }
          },
          {
            $project: {
              createdAt: 0,
              updatedAt: 0
            }
          }
        ])
        .toArray(),
      dbServices.tweets.countDocuments({ ...$match })
    ])

    await dbServices.tweets.updateMany(
      {
        $text: { $search: query.content }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updatedAt: new Date()
        }
      }
    )
    const totalPages = Math.ceil(totalDocs / limit)

    return {
      message: messResponse.searchTweet(totalDocs),
      status: httpStatus.OK,
      tweets,
      page,
      limit,
      totalPages
    }
  }

  async searchHashTags(query: HashtagQuery, id: string) {
    const page = Number(query.page)
    const limit = Number(query.limit)
    const offset = (page - 1) * limit

    const [tweets, totalDocs] = await Promise.all([
      dbServices.hashtags
        .aggregate<Tweets>([
          {
            $match: {
              $text: {
                $search: query.tags
              }
            }
          },
          {
            $lookup: {
              from: 'tweets',
              localField: '_id',
              foreignField: 'hashtags',
              as: 'tweets'
            }
          },
          { $unwind: { path: '$tweets' } },
          { $skip: offset },
          { $limit: limit },
          { $replaceRoot: { newRoot: '$tweets' } },
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
                {
                  audience: TweetAudience.Everyone
                },
                {
                  $and: [
                    {
                      audience: TweetAudience.TwitterCircle
                    },
                    {
                      'user.tweeter_circle': {
                        $in: [new ObjectId(id)]
                      }
                    }
                  ]
                }
              ]
            }
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
              from: 'tweets',
              localField: '_id',
              foreignField: 'parent_id',
              as: 'retweets_user'
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
                $size: '$retweets_user'
              },
              user_retweets: {
                $size: {
                  $filter: {
                    input: '$retweets_user',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.Retweet]
                    }
                  }
                }
              },
              user_comment: {
                $size: {
                  $filter: {
                    input: '$retweets_user',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.Comment]
                    }
                  }
                }
              }
            }
          },
          { $unwind: { path: '$user_id' } },
          {
            $project: {
              createdAt: 0,
              updatedAt: 0
            }
          }
        ])
        .toArray(),
      dbServices.hashtags
        .aggregate([
          {
            $match: {
              $text: {
                $search: query.tags
              }
            }
          },
          {
            $lookup: {
              from: 'tweets',
              localField: '_id',
              foreignField: 'hashtags',
              as: 'tweets'
            }
          },
          { $unwind: { path: '$tweets' } },
          { $replaceRoot: { newRoot: '$tweets' } },
          {
            $match: {
              $or: [
                {
                  audience: TweetAudience.Everyone
                },
                {
                  $and: [
                    {
                      audience: TweetAudience.TwitterCircle
                    },
                    {
                      'user.tweeter_circle': {
                        $in: [new ObjectId(id)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])

    const total = totalDocs[0].total || 0
    const totalPages = Math.ceil(total / limit)

    return {
      message: messResponse.searchTweet(total),
      status: httpStatus.OK,
      tweets,
      page,
      limit,
      totalPages
    }
  }
}

const searchServices = new SearchServices()
export default searchServices
