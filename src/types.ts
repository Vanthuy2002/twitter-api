import { ObjectId } from 'mongodb'
import { Request } from 'express'
import { User } from './models/users'
interface Timestamp {
  createdAt?: Date
  updatedAt?: Date
}

export enum VerifyUserStatus {
  Unveryfied = 'unverified',
  Veryfied = 'verified',
  Banner = 'banner'
}
export interface UserType extends Timestamp {
  _id?: ObjectId
  email: string
  password: string
  username?: string
  date_birth?: Date
  email_token?: string
  tweeter_cricle?: ObjectId[]
  reset_pass_token?: string
  verify?: VerifyUserStatus
  bio?: string
  location?: string
  avatar?: string
  cover_photo?: string
}

export interface RefeshToken extends Timestamp {
  _id?: ObjectId
  tokens: string
  user_id: ObjectId
}

export interface FollowersType extends Timestamp {
  _id?: ObjectId
  user_id: ObjectId // user
  follow_user_id: ObjectId // id của người được user_id follow
}

export interface TweetsContructor extends Timestamp {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string //  chỉ null khi tweet gốc
  hashtags?: ObjectId[]
  mentions?: string[]
  medias?: Media[]
  guest_views?: number
  user_views?: number
}

export interface MediaRaw {
  message: string
  filename: string
  format?: string
  type?: MediaType // video, image
  path: string
}

export interface Media {
  path: string
  type: MediaType
}

export enum MediaType {
  Image = 'image',
  Video = 'video'
}
export enum TweetAudience {
  Everyone = 'public', // 0
  TwitterCircle = 'private' // 1
}
export enum TweetType {
  Tweet = 'tweet',
  Retweet = 'retweet',
  Comment = 'comment',
  QuoteTweet = 'quote'
}

export interface Bookmarks extends Timestamp {
  _id?: ObjectId
  user_id: ObjectId // ai bookmark
  tweet_id: ObjectId // tweet được bookmark
}

export interface Like extends Timestamp {
  _id: ObjectId
  user_id: ObjectId // ai là người like
  tweet_id: ObjectId // tweet được like
}

export interface HashtagContructor extends Timestamp {
  _id?: ObjectId
  title: string
}

export interface PayloadToken {
  id: string
  tokenType?: TokenType
  verify?: VerifyUserStatus
}

export interface ConversationProperty extends Timestamp {
  _id?: ObjectId
  content: any
  sender_id: ObjectId
  receiver_id: ObjectId
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgetPasswordToken,
  VerifyToken
}

declare module 'express' {
  interface Request {
    user?: User
  }
}

export interface UpdateMeBody {
  username: string
  bio: string
  avatar: string
  cover_photo: string
  date_birth: Date
  location: string
  website: string
}

export interface UserGoogle {
  id: string
  email: string
  verified_email: string
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}

export interface TweetReq {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id?: null | ObjectId
  hashtags?: string[]
  mentions?: string[]
  medias?: Media[]
}

interface Pagination {
  page: string
  limit: string
}
export interface SearchQuery extends Pagination {
  content: string
  type?: MediaType
  people_follow?: string
}

export interface HashtagQuery extends Pagination {
  tags: string
}

export interface EmailFormat {
  fromAddress: string
  toAddresses: string | string[]
  ccAddresses?: string[]
  body: any
  subject: string
  replyToAddresses?: string[]
}
