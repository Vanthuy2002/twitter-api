import dbServices from '@/database'
import { User } from '@/models/users'
import {
  MediaType,
  TweetAudience,
  TweetReq,
  TweetType,
  UserType,
  VerifyUserStatus
} from '@/types'
import { faker } from '@faker-js/faker'
import { ObjectId, WithId } from 'mongodb'
import { hashPassword } from './crypto'
import { Followers } from '@/models/followers'
import { Hashtags } from '@/models/hashtags'
import { Tweets } from '@/models/tweets'

interface Register extends UserType {
  confirm: string
}

// Password for all test users
const PASSWORD = 'thuy2002'
// My ID account , use to follow another users
const MYID = new ObjectId('65645647e4ac596b0a4182f7')

// Users was created , by default , one user will be has 2 tweets
const USER_COUNT = 200

const createRandomUser = () => {
  const userFake: Register = {
    username: faker.internet.displayName(),
    email: faker.internet.email(),
    password: PASSWORD,
    confirm: PASSWORD,
    date_birth: faker.date.birthdate(),
    bio: faker.person.bio(),
    avatar: faker.internet.avatar(),
    location: faker.location.city()
  }
  return userFake
}

const createRandomTweet = () => {
  const tweet: TweetReq = {
    type: TweetType.Tweet,
    audience: TweetAudience.Everyone,
    content: faker.lorem.paragraph({
      min: 10,
      max: 160
    }),
    hashtags: [
      'NodeJS',
      'MongoDB',
      'ExpressJS',
      'Swagger',
      'Docker',
      'Socket.io'
    ],
    medias: [
      {
        type: MediaType.Image,
        path: faker.image.url()
      }
    ],
    mentions: [],
    parent_id: null
  }
  return tweet
}
const users = faker.helpers.multiple(createRandomUser, {
  count: USER_COUNT
})

const insertMultipleUsers = async (users: Register[]) => {
  console.log('Creating users...')
  const result = await Promise.all(
    users.map(async (user) => {
      const user_id = new ObjectId()
      await dbServices.users.insertOne(
        new User({
          ...user,
          _id: user_id,
          password: hashPassword(user.password),
          verify: VerifyUserStatus.Veryfied,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      )
      return user_id
    })
  )
  console.log(`Created ${result.length} users`)
  return result
}

const followMultipleUsers = async (
  user_id: ObjectId,
  followed_user_ids: ObjectId[]
) => {
  console.log('Start following...')
  const result = await Promise.all(
    followed_user_ids.map((followed) =>
      dbServices.followers.insertOne(
        new Followers({
          user_id,
          follow_user_id: new ObjectId(followed)
        })
      )
    )
  )
  console.log(`Followed ${result.length} users`)
}

const checkAndCreateHashtags = async (hashtags: string[]) => {
  const hashtagDocuemts = await Promise.all(
    hashtags.map((tags) => {
      // Tìm hashtag trong database, nếu có thì lấy, không thì tạo mới
      return dbServices.hashtags.findOneAndUpdate(
        { title: tags },
        {
          $setOnInsert: new Hashtags({ title: tags })
        },
        {
          upsert: true,
          returnDocument: 'after'
        }
      )
    })
  )
  return hashtagDocuemts.map((hashtag) => (hashtag as WithId<Hashtags>)._id)
}

const insertTweet = async (user_id: ObjectId, body: TweetReq) => {
  const hashtags = await checkAndCreateHashtags(body.hashtags as string[])
  const result = await dbServices.tweets.insertOne(
    new Tweets({
      audience: body.audience,
      content: body.content,
      hashtags,
      mentions: body.mentions,
      medias: body.medias,
      parent_id: body.parent_id as any,
      type: body.type,
      user_id: new ObjectId(user_id)
    })
  )
  return result
}

const insertMultipleTweets = async (ids: ObjectId[]) => {
  console.log('Creating tweets...')
  console.log(`Counting...`)
  let count = 0
  const result = await Promise.all(
    ids.map(async (id) => {
      await Promise.all([
        insertTweet(id, createRandomTweet()),
        insertTweet(id, createRandomTweet())
      ])
      count += 2
      console.log(`Created ${count} tweets`)
    })
  )
  return result
}

insertMultipleUsers(users).then((ids) => {
  followMultipleUsers(new ObjectId(MYID), ids).catch((err) => {
    console.error('Error when following users')
    console.log(err)
  })
  insertMultipleTweets(ids).catch((err) => {
    console.error('Error when creating tweets')
    console.log(err)
  })
})
