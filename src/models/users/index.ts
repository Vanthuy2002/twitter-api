import { UserType, VerifyUserStatus } from '@/types'
import { ObjectId } from 'mongodb'

export class User {
  public _id: ObjectId
  public email: string
  public password: string
  public username: string
  public date_birth: Date
  public email_token: string
  public reset_pass_token: string
  public verify: VerifyUserStatus
  public tweeter_circle: ObjectId[]
  public bio: string
  public location: string
  public avatar: string
  public cover_photo: string
  public createdAt: Date
  public updatedAt: Date

  constructor(user: UserType) {
    const date = new Date()
    this._id = user._id || new ObjectId()
    this.email = user.email
    this.password = user.password
    this.username = user.username || ''
    this.date_birth = user.date_birth || date
    this.email_token = user.email_token || ''
    this.reset_pass_token = user.reset_pass_token || ''
    this.verify = user.verify || VerifyUserStatus.Unveryfied
    this.tweeter_circle = user.tweeter_cricle || []
    this.bio = user.bio || ''
    this.location = user.location || ''
    this.avatar = user.avatar || ''
    this.cover_photo = user.cover_photo || ''
    this.createdAt = user.createdAt || date
    this.updatedAt = user.updatedAt || date
  }
}
