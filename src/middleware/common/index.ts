import { NextFunction, Request, Response } from 'express'
import { pick } from 'lodash'

type FilterKeys<T> = Array<keyof T>

export const filterPayload = <T>(fieldsConsistent: FilterKeys<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const filtered = pick(req.body, fieldsConsistent)
    req.body = filtered
    next()
  }
}
