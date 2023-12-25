import { httpStatus } from '@/constants/httpStatus'
import { messageValidator } from '@/constants/message'
import dbServices from '@/database'
import { ErrorWithStatus } from '@/models/Errors'
import { Tweets } from '@/models/tweets'
import { TweetAudience, TweetType, MediaType, VerifyUserStatus } from '@/types'
import { enumToArray } from '@/utils/handlers'
import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'

const tweetTypes = enumToArray(TweetType)
const tweetAudience = enumToArray(TweetAudience)

export const createTweetValidate = checkSchema({
  type: {
    isIn: {
      options: [tweetTypes],
      errorMessage: `Must be one of [${tweetTypes}]`
    }
  },
  audience: {
    isIn: {
      options: [tweetAudience],
      errorMessage: `Must be one of ${tweetAudience}`
    }
  },
  parent_id: {
    custom: {
      options: (value, { req }) => {
        const type = req.body.type as TweetType
        // type is [comment, qoute, retweet] and parent_id NOT is ObjectId
        if (
          [TweetType.Comment, TweetType.QuoteTweet, TweetType.Retweet].includes(
            type
          ) &&
          !ObjectId.isValid(value)
        ) {
          throw new Error(messageValidator.tweetParentId)
        }

        // type is tweets and parent_id NOT NULL
        if (TweetType.Tweet === type && value !== null) {
          throw new Error(messageValidator.nomalTweet)
        }
        return true
      }
    }
  },

  content: {
    custom: {
      options: (value, { req }) => {
        const type = req.body.type as TweetType
        const hashtags = req.body.hashtags as string[]
        const mentions = req.body.mentions as string[]

        // type is [tweet, comment, qoute] and NO hashtags, mentions
        // content must be string
        if (
          [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(
            type
          ) &&
          isEmpty(hashtags) &&
          isEmpty(mentions) &&
          value === ''
        ) {
          throw new Error(messageValidator.mustBeString)
        }

        // type is retweet -> content must be empty string ""
        if (type === TweetType.Retweet && value !== '') {
          throw new Error(messageValidator.reTweetContent)
        }
        return true
      }
    }
  },

  hashtags: {
    isArray: true,
    custom: {
      options: (values: any[]) => {
        if (!values.every((el) => typeof el === 'string')) {
          throw new Error(messageValidator.tweetHashTag)
        }
        return true
      }
    }
  },
  mentions: {
    isArray: true,
    custom: {
      options: (values) => {
        if (!values.every((el: any) => ObjectId.isValid(el))) {
          throw new Error(messageValidator.tweetMetions)
        }
        return true
      }
    }
  },

  medias: {
    isArray: true,
    custom: {
      options: (value) => {
        const mediaTypes = enumToArray(MediaType)
        // one of element is Media Obj
        if (
          value.some((el: any) => {
            return typeof el.path !== 'string' || !mediaTypes.includes(el.type)
          })
        ) {
          throw new Error(messageValidator.tweetMedia)
        }
        return true
      }
    }
  }
})

export const tweetIdValidate = checkSchema(
  {
    tweet_id: {
      isMongoId: true,
      custom: {
        options: async (value, { req }) => {
          const [tweet] = await dbServices.tweets
            .aggregate<Tweets>([
              {
                $match: {
                  _id: new ObjectId(value)
                }
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
                $lookup: {
                  from: 'bookmarks',
                  localField: '_id',
                  foreignField: 'tweet_id',
                  as: 'bookmarks'
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
                  bookmarks: {
                    $size: '$bookmarks'
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
                          $eq: ['$$item.type', 'retweet']
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
                          $eq: ['$$item.type', 'comment']
                        }
                      }
                    }
                  },
                  views: {
                    $add: ['$user_views', '$guest_views']
                  }
                }
              },
              {
                $project: {
                  retweets_user: 0,
                  createdAt: 0,
                  updatedAt: 0
                }
              }
            ])
            .toArray()
          if (!tweet) {
            throw new ErrorWithStatus({
              message: messageValidator.tweetNotFound,
              status: httpStatus.NOT_FOUND
            })
          }
          req.tweet = tweet
          return true
        }
      }
    }
  },
  ['params', 'body']
)

export const audianceValidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { tweet }: any = req
  if (tweet.audience === TweetAudience.TwitterCircle) {
    // check user login
    if (!req.headers.authorization) {
      throw new ErrorWithStatus({
        message: messageValidator.notLogin,
        status: httpStatus.UNAUTHOURIZED
      })
    }

    // check account user status
    const {
      decoded: { id }
    }: any = req
    const author = await dbServices.users.findOne({
      _id: new ObjectId(id)
    })
    if (!author || author.verify === VerifyUserStatus.Banner) {
      throw new ErrorWithStatus({
        message: messageValidator.notVerified,
        status: httpStatus.UNAUTHOURIZED
      })
    }

    // if you are not author and not in tweet_circle -> throw error
    const isInTweetCricle = author.tweeter_circle.some((viewer_id) =>
      viewer_id.equals(id)
    )
    const isAuthor = author._id.equals(id)
    if (!isAuthor && !isInTweetCricle) {
      throw new ErrorWithStatus({
        message: messageValidator.tweetNotPublic,
        status: httpStatus.UNAUTHOURIZED
      })
    }
  }
  next()
}

export const getChildTweetValidate = checkSchema(
  {
    type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: `Type must be one of ${tweetTypes}`
      }
    }
  },
  ['params']
)

export const paginationValidate = checkSchema(
  {
    limit: {
      isNumeric: {
        errorMessage: messageValidator.pageValidate
      },
      custom: {
        options: (value) => {
          const num = Number(value)
          const MAX_LIMIT = 20
          if (num > MAX_LIMIT) {
            throw new Error(`Limit maximum is ${MAX_LIMIT}`)
          }

          return true
        }
      }
    },

    page: {
      isNumeric: {
        errorMessage: messageValidator.pageValidate
      }
    }
  },
  ['query']
)
