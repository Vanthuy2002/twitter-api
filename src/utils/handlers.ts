import { httpStatus } from '@/constants/httpStatus'
import { messageValidator } from '@/constants/message'
import { ErrorWithStatus } from '@/models/Errors'
import { Request, NextFunction, Response, RequestHandler } from 'express'
import { verifyToken } from './tokens'

const wrapRequestHandle = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}

export const getDefaultUsername = (email: string): string => {
  const username = email.split('@')[0]
  return username
}

export const enumToArray = (params: {
  [key: string]: string | number
}): (string | number)[] => {
  return Object.values(params)
}

export const verifyAccessTokens = async (tokens: string, req?: any) => {
  const accessToken = tokens.split(' ')[1]
  if (!accessToken) {
    throw new ErrorWithStatus({
      message: messageValidator.notLogin,
      status: httpStatus.UNAUTHOURIZED
    })
  }
  const decoded = await verifyToken(accessToken)
  req.decoded = decoded
  return true
}

export const verifyAccessTokensV2 = async (tokens: string) => {
  if (!tokens) {
    throw new ErrorWithStatus({
      message: messageValidator.notLogin,
      status: httpStatus.UNAUTHOURIZED
    })
  }
  const decoded = await verifyToken(tokens)
  return decoded
}

export default wrapRequestHandle
