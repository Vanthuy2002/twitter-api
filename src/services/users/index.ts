import { httpStatus } from '@/constants/httpStatus'
import { messResponse } from '@/constants/message'
import { ignoreField } from '@/constants/statics'
import dbServices from '@/database'
import { ErrorWithStatus } from '@/models/Errors'
import { Followers } from '@/models/followers'
import { UpdateMeBody } from '@/types'
import { ObjectId } from 'mongodb'

export class MeServices {
  async getUser(id: string) {
    const me = await dbServices.users.findOne(
      { _id: new ObjectId(id) },
      { projection: ignoreField }
    )
    return {
      message: messResponse.getMyInfo,
      status: httpStatus.OK,
      user: me
    }
  }

  async updateUser(id: string, payload: Partial<UpdateMeBody>) {
    const user = await dbServices.users.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...payload
        },
        $currentDate: {
          updatedAt: true
        }
      },
      { returnDocument: 'after', projection: ignoreField }
    )

    return {
      message: messResponse.updatedProfile,
      status: httpStatus.OK,
      user
    }
  }

  async getClient(username: string) {
    const client = await dbServices.users.findOne(
      { username },
      { projection: ignoreField }
    )
    if (!client) {
      throw new ErrorWithStatus({
        message: messResponse.notFoundUser,
        status: httpStatus.NOT_FOUND
      })
    }

    return {
      message: messResponse.getMyInfo,
      status: httpStatus.OK,
      user: client
    }
  }

  async followUser(id: string, follow_user_id: ObjectId) {
    const payload = new Followers({
      user_id: new ObjectId(id),
      follow_user_id
    })
    const follow_user = await dbServices.followers.findOne({
      user_id: payload.user_id,
      follow_user_id: payload.follow_user_id
    })
    if (follow_user === null) {
      await dbServices.followers.insertOne(payload)
      return {
        message: messResponse.followOK,
        status: httpStatus.OK
      }
    }
    return {
      message: messResponse.followED,
      status: httpStatus.OK
    }
  }

  async unfollowUser(id: string, follow_user: string) {
    // find docs
    const follower = await dbServices.followers.findOne({
      user_id: new ObjectId(id),
      follow_user_id: new ObjectId(follow_user)
    })

    // if not found -> not follow -> return
    if (follower === null) {
      return {
        message: messResponse.NotFollow,
        status: httpStatus.OK
      }
    }
    // found -> delete doc -> return
    await dbServices.followers.deleteOne({
      user_id: new ObjectId(id),
      follow_user_id: new ObjectId(follow_user)
    })
    return {
      message: messResponse.unfollowOK,
      status: httpStatus.OK
    }
  }
}

const meServices = new MeServices()
export default meServices
