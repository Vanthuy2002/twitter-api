import { httpStatus } from '@/constants/httpStatus'
import { messResponse, messageValidator } from '@/constants/message'
import { regexUsername } from '@/constants/statics'
import dbServices from '@/database'
import { ErrorWithStatus } from '@/models/Errors'
import userService from '@/services/auth'
import { VerifyUserStatus } from '@/types'
import { hashPassword } from '@/utils/crypto'
import { verifyAccessTokens } from '@/utils/handlers'
import { verifyToken } from '@/utils/tokens'
import { NextFunction, Request, Response } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

const {
  minLength,
  isEmail,
  isExistEmail,
  notEmpty,
  notMatch,
  notFound,
  notLogin,
  tokenNotValid,
  notFoundToken,
  notVerified,
  mustBeString,
  maxLengthBio,
  maxLengthURL,
  usernameExist,
  regexString
} = messageValidator

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: notEmpty
  },
  isLength: {
    options: {
      max: 20,
      min: 5
    },
    errorMessage: minLength
  },
  isString: true,
  trim: true
}

const comfirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: notEmpty
  },
  isString: true,
  trim: true,
  isLength: {
    options: {
      max: 20,
      min: 5
    },
    errorMessage: minLength
  },
  custom: {
    options: (value: string, { req }) => {
      if (value !== req.body.password) {
        return false
      }
      return true
    },
    errorMessage: notMatch
  }
}

const userNameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: notEmpty
  },
  isString: {
    errorMessage: mustBeString
  },
  isLength: {
    options: {
      max: 100,
      min: 5
    },
    errorMessage: minLength
  }
}

export const registerValidator = checkSchema(
  {
    username: userNameSchema,
    email: {
      notEmpty: {
        errorMessage: notEmpty
      },
      isEmail: true,
      trim: true,
      errorMessage: isEmail,
      custom: {
        options: async (value) => {
          const isExist = await userService.checkEmailExist(value)
          if (isExist) {
            throw new ErrorWithStatus({ message: isExistEmail, status: 401 })
          }
          return true
        }
      }
    },
    password: passwordSchema,
    confirm: comfirmPasswordSchema
  },
  ['body']
)

export const loginValidate = checkSchema(
  {
    email: {
      notEmpty: {
        errorMessage: notEmpty
      },
      isEmail: {
        errorMessage: isEmail
      },
      trim: true,
      custom: {
        options: async (email, { req }) => {
          const user = await dbServices.users.findOne({
            email,
            password: hashPassword(req.body.password)
          })
          if (user === null) {
            throw new ErrorWithStatus({ message: notFound, status: 404 })
          }
          req.user = user
          return true
        }
      }
    },
    password: passwordSchema
  },
  ['body']
)

export const accessTokenValidate = checkSchema(
  {
    Authorization: {
      notEmpty: {
        errorMessage: notLogin
      },

      custom: {
        options: async (value: string, { req }) => {
          return await verifyAccessTokens(value, req)
        }
      }
    }
  },
  ['headers']
)

export const refreshTokenValidate = checkSchema(
  {
    refresh_token: {
      notEmpty: {
        errorMessage: notFoundToken
      },

      custom: {
        options: async (value: string, { req }) => {
          try {
            const [decoded, refresh_token] = await Promise.all([
              verifyToken(value),
              dbServices.refreshToken.findOne({ tokens: value })
            ])
            if (refresh_token === null) {
              throw new ErrorWithStatus({
                message: notLogin,
                status: httpStatus.UNAUTHOURIZED
              })
            }
            req.refresh_decoded = decoded
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({
                message: tokenNotValid,
                status: httpStatus.UNAUTHOURIZED
              })
            }
            throw error
          }
          return true
        }
      }
    }
  },
  ['body']
)

export const emailVerifyValidate = checkSchema(
  {
    email_token: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          if (!value) {
            throw new ErrorWithStatus({
              message: notFoundToken,
              status: httpStatus.NOT_FOUND
            })
          }
          try {
            const decoded_email = await verifyToken(value)
            req.decoded_email = decoded_email
          } catch (error) {
            throw new ErrorWithStatus({ message: tokenNotValid, status: 401 })
          }
          return true
        }
      }
    }
  },
  ['body']
)

export const forgotPasswordValidate = checkSchema(
  {
    email: {
      isEmail: {
        errorMessage: isEmail
      },
      custom: {
        options: async (email: string, { req }) => {
          const user = await dbServices.users.findOne({ email })
          if (user === null) {
            throw new ErrorWithStatus({
              message: messResponse.notFoundUser,
              status: httpStatus.NOT_FOUND
            })
          }
          req.user = user
          return true
        }
      }
    }
  },
  ['body']
)

export const forgotTokenValidate = checkSchema(
  {
    token: {
      notEmpty: {
        errorMessage: notEmpty
      },
      custom: {
        options: async (token: string, { req }) => {
          const decoded = await verifyToken(token)
          req.decoded = decoded
          return true
        }
      }
    },

    password: passwordSchema,
    confirm: comfirmPasswordSchema
  },
  ['body']
)

export const verifyValidate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { decoded }: any = req
  const { verify } = decoded
  if (verify !== VerifyUserStatus.Veryfied) {
    throw new ErrorWithStatus({
      message: notVerified,
      status: httpStatus.FOR_BIDEN
    })
  }
  next()
}

export const updateMeValidate = checkSchema(
  {
    username: {
      optional: true,
      ...userNameSchema,
      notEmpty: undefined,
      custom: {
        options: async (value: string) => {
          if (!regexUsername.test(value)) {
            throw Error(regexString)
          }
          const user = await dbServices.users.findOne({ username: value })
          if (user) {
            throw Error(usernameExist)
          }

          return true
        }
      }
    },
    bio: {
      optional: true,
      isString: {
        errorMessage: mustBeString
      },
      trim: true,
      isLength: {
        options: {
          min: 5,
          max: 200
        },
        errorMessage: `${minLength} and ${maxLengthBio}`
      }
    },
    location: {
      optional: true,
      isString: {
        errorMessage: mustBeString
      },
      isLength: {
        options: {
          max: 200
        },
        errorMessage: maxLengthBio
      }
    },
    avatar: {
      optional: true,
      isString: {
        errorMessage: mustBeString
      }
    },
    website: {
      optional: true,
      trim: true,
      isString: {
        errorMessage: mustBeString
      },
      isLength: {
        options: {
          max: 200
        },
        errorMessage: maxLengthURL
      }
    },
    cover_photo: {
      optional: true,
      isString: {
        errorMessage: mustBeString
      },
      isLength: {
        options: {
          max: 50
        },
        errorMessage: maxLengthURL
      }
    }
  },
  ['body']
)

export const changePasswordValidate = checkSchema(
  {
    old_password: {
      ...passwordSchema,
      custom: {
        options: async (value: string, { req }) => {
          const {
            decoded: { id }
          }: any = req

          const user = await dbServices.users.findOne({ _id: new ObjectId(id) })
          if (!user) {
            throw new ErrorWithStatus({
              message: messResponse.notFoundUser,
              status: httpStatus.NOT_FOUND
            })
          }

          const { password } = user
          const isMatched = hashPassword(value) === password
          if (!isMatched) {
            throw new ErrorWithStatus({
              message: notMatch,
              status: httpStatus.NOT_FOUND
            })
          }

          return true
        }
      }
    },
    password: passwordSchema,
    confirm: comfirmPasswordSchema
  },
  ['body']
)

export const isUserLogin = (
  middlewareFn: (req: Request, res: Response, next: NextFunction) => void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return middlewareFn(req, res, next)
    }
    return next()
  }
}
