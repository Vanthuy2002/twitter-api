import { TweetController } from '@/controllers/tweets'
import {
  audianceValidate,
  createTweetValidate,
  getChildTweetValidate,
  paginationValidate,
  tweetIdValidate
} from '@/middleware/tweet'
import {
  accessTokenValidate,
  isUserLogin,
  verifyValidate
} from '@/middleware/users'
import wrapRequestHandle from '@/utils/handlers'
import { validate } from '@/utils/validator'
import { Router } from 'express'

const tweetRoutes = Router()
const tweetCtrl = new TweetController()

tweetRoutes
  .route('/')
  .get(validate(paginationValidate), wrapRequestHandle(tweetCtrl.getAllTweets))
  .post(
    isUserLogin(validate(accessTokenValidate)),
    isUserLogin(verifyValidate),
    validate(createTweetValidate),
    wrapRequestHandle(tweetCtrl.createTweet)
  )

tweetRoutes
  .route('/new-feeds')
  .get(
    validate(accessTokenValidate),
    verifyValidate,
    validate(paginationValidate),
    wrapRequestHandle(tweetCtrl.getNewFeeds)
  )

tweetRoutes
  .route('/:tweet_id')
  .get(
    isUserLogin(validate(accessTokenValidate)),
    isUserLogin(verifyValidate),
    validate(tweetIdValidate),
    wrapRequestHandle(audianceValidate),
    wrapRequestHandle(tweetCtrl.getDetailTweet)
  )

tweetRoutes
  .route('/:tweet_id/:type')
  .get(
    isUserLogin(validate(accessTokenValidate)),
    isUserLogin(verifyValidate),
    validate(tweetIdValidate),
    wrapRequestHandle(audianceValidate),
    validate(getChildTweetValidate),
    validate(paginationValidate),
    wrapRequestHandle(tweetCtrl.getTweetChildren)
  )

export default tweetRoutes
