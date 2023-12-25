import { ParamSchema, checkSchema } from 'express-validator'
import { messResponse, messageValidator } from '@/constants/message'
import { ObjectId } from 'mongodb'
import dbServices from '@/database'
import { ErrorWithStatus } from '@/models/Errors'
import { httpStatus } from '@/constants/httpStatus'

const userIdFollowSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: messageValidator.objectIdValid,
          status: httpStatus.SERVER_ERROR
        })
      }

      const follow_user = await dbServices.users.findOne({
        _id: new ObjectId(value)
      })

      if (!follow_user) {
        throw new ErrorWithStatus({
          message: messResponse.notFoundUser,
          status: httpStatus.NOT_FOUND
        })
      }
      req.body.followed_id = new ObjectId(value)
      return true
    }
  }
}

export const followValidator = checkSchema(
  { follow_user_id: userIdFollowSchema },
  ['body']
)

export const unFollowValidate = checkSchema({ user_id: userIdFollowSchema }, [
  'params'
])
