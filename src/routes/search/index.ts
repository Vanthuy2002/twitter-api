import { SearchController } from '@/controllers/search'
import { searchTweetValidate } from '@/middleware/search'
import { paginationValidate } from '@/middleware/tweet'
import { accessTokenValidate, verifyValidate } from '@/middleware/users'
import wrapRequestHandle from '@/utils/handlers'
import { validate } from '@/utils/validator'
import { Router } from 'express'

const searchRoutes = Router()
const searchCtrl = new SearchController()

searchRoutes
  .route('/by-tweets')
  .get(
    validate(accessTokenValidate),
    verifyValidate,
    validate(paginationValidate),
    validate(searchTweetValidate),
    wrapRequestHandle(searchCtrl.searchByTweets)
  )

searchRoutes
  .route('/by-tags')
  .get(
    validate(accessTokenValidate),
    verifyValidate,
    validate(paginationValidate),
    wrapRequestHandle(searchCtrl.searchByHashtags)
  )

export default searchRoutes
