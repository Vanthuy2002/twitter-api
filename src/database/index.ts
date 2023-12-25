import { MongoClient, Db, Collection } from 'mongodb'
import { User } from '@/models/users'
import { TokenSchema } from '@/models/tokens'
import { Followers } from '@/models/followers'
import { Tweets } from '@/models/tweets'
import { Hashtags } from '@/models/hashtags'
import { BookMark } from '@/models/bookmark'
import { collection } from '@/constants/statics'
import { Conversation } from '@/models/conversation'
import { configEnvs } from '@/config'

const uri = configEnvs.hostMongo?.replace(
  '<password>',
  configEnvs.passMongo as string
)

class DatabaseServices {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri as string)
    this.db = this.client.db(configEnvs.dbMongo)
  }

  async connectMongo() {
    await this.client.connect()
    await this.db.command({ ping: 1 })
    console.log('Successfully connected to MongoDB!')
  }

  async createIndexUsers() {
    const existIndex = await this.users.indexExists([
      'email_1_password_1',
      'email_1',
      'username_1'
    ])
    if (!existIndex) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
    }
  }

  async createIndexTweets() {
    const existIndex = await this.tweets.indexExists(['content_text'])
    if (!existIndex) {
      this.tweets.createIndex({ content: 'text' }, { default_language: 'none' })
    }
  }

  get users(): Collection<User> {
    return this.db.collection(collection.USERS)
  }

  get refreshToken(): Collection<TokenSchema> {
    return this.db.collection(collection.REFRESHTOKEN)
  }

  get followers(): Collection<Followers> {
    return this.db.collection(collection.FOLLOWERS)
  }

  get tweets(): Collection<Tweets> {
    return this.db.collection(collection.TWEETS)
  }

  get hashtags(): Collection<Hashtags> {
    return this.db.collection(collection.HASHTAGS)
  }

  get bookmark(): Collection<BookMark> {
    return this.db.collection(collection.BOOKMARKS)
  }

  get conversation(): Collection<Conversation> {
    return this.db.collection(collection.CONVERSATION)
  }
}

const dbServices = new DatabaseServices()
export default dbServices
