import { httpStatus } from '@/constants/httpStatus'
import { ErrorWithStatus, ErrorsEntity } from '@/models/Errors'
import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'

export const validate = (
  validations: RunnableValidationChains<ValidationChain>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validations.run(req)
    const errors = validationResult(req)
    const errorsObj = errors.mapped()
    const entityErr = new ErrorsEntity({ error: errorsObj })

    if (errors.isEmpty()) {
      return next()
    }

    for (const key in errorsObj) {
      const { msg } = errorsObj[key]
      if (
        msg instanceof ErrorWithStatus &&
        msg.status !== httpStatus.UNPROCESSABLE_ENTITY
      ) {
        return next(msg)
      }
      entityErr.error[key] = msg
    }

    next(entityErr)
  }
}
