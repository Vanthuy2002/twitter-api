import { checkSchema } from 'express-validator'
import { messageValidator } from '@/constants/message'
import dbServices from '@/database'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '@/models/Errors'
import { httpStatus } from '@/constants/httpStatus'

export const receiverIdValidate = checkSchema(
  {
    receiver_id: {
      isMongoId: {
        errorMessage: messageValidator.objectIdValid
      }
    }
  },
  ['params']
)

export const messageIdValidate = checkSchema(
  {
    message_id: {
      isMongoId: {
        errorMessage: messageValidator.objectIdValid
      },
      custom: {
        options: async (value: string) => {
          const message = await dbServices.conversation.findOne({
            _id: new ObjectId(value)
          })
          if (!message) {
            throw new ErrorWithStatus({
              message: messageValidator.notFoundMessage,
              status: httpStatus.NOT_FOUND
            })
          }
          return true
        }
      }
    }
  },
  ['params']
)

export const updateMessageValidate = checkSchema(
  {
    content: {
      notEmpty: {
        errorMessage: messageValidator.notEmpty
      }
    }
  },
  ['body']
)
