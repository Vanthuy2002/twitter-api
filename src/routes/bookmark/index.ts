import { BookMarkController } from '@/controllers/bookmark'
import { tweetIdValidate } from '@/middleware/tweet'
import { accessTokenValidate, verifyValidate } from '@/middleware/users'
import wrapRequestHandle from '@/utils/handlers'
import { validate } from '@/utils/validator'
import { Router } from 'express'

const bookmarkRoute = Router()
const bookMarkCtrl = new BookMarkController()

bookmarkRoute
  .route('/')
  .post(
    validate(accessTokenValidate),
    verifyValidate,
    wrapRequestHandle(bookMarkCtrl.createNewBookMark)
  )

bookmarkRoute
  .route('/tweet/:tweet_id')
  .delete(
    validate(accessTokenValidate),
    verifyValidate,
    validate(tweetIdValidate),
    wrapRequestHandle(bookMarkCtrl.unBookMark)
  )

export default bookmarkRoute
