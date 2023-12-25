import { messageValidator } from '@/constants/message'
import { MediaType } from '@/types'
import { enumToArray } from '@/utils/handlers'
import { checkSchema } from 'express-validator'

const mediaType = enumToArray(MediaType)

export const searchTweetValidate = checkSchema({
  content: {
    isString: {
      errorMessage: messageValidator.mustBeString
    }
  },
  type: {
    optional: true,
    isIn: {
      options: [mediaType],
      errorMessage: `Must be one of ${mediaType}`
    }
  },

  people_follow: {
    optional: true,
    isString: {
      errorMessage: messageValidator.mustBeString
    }
  }
})
