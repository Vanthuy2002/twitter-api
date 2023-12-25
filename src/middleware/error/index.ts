/* eslint-disable @typescript-eslint/no-unused-vars */
import { httpStatus } from '@/constants/httpStatus'
import { ErrorWithStatus } from '@/models/Errors'
import { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash'

const handleErrGlobal = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    if (err instanceof ErrorWithStatus) {
      return res.status(err.status).json(omit(err, ['status']))
    }
    const finalError: any = {}
    Object.getOwnPropertyNames(err).forEach((key) => {
      const configObj = Object.getOwnPropertyDescriptor(err, key)
        ?.configurable as boolean
      const writeObj = Object.getOwnPropertyDescriptor(err, key)
        ?.writable as boolean

      if (!configObj || !writeObj) {
        return (finalError[key] = err[key])
      }
      Object.defineProperty(err, key, { enumerable: true })
    })
    return res.status(httpStatus.SERVER_ERROR).json({
      message: finalError.message,
      info: omit(finalError, 'stack')
    })
  } catch (err: any) {
    return res.status(httpStatus.SERVER_ERROR).json({
      message: err['message'],
      info: omit(err, 'stack')
    })
  }
}
export default handleErrGlobal
