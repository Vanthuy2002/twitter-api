import { fieldsCanUpdate } from '@/constants/statics'
import MeController from '@/controllers/users'
import { filterPayload } from '@/middleware/common'
import { followValidator, unFollowValidate } from '@/middleware/followers'
import {
  accessTokenValidate,
  updateMeValidate,
  verifyValidate
} from '@/middleware/users'
import wrapRequestHandle from '@/utils/handlers'
import { validate } from '@/utils/validator'
import { Router } from 'express'

const meRoutes = Router()
const meCtrl = new MeController()

meRoutes
  .route('/me')
  .get(validate(accessTokenValidate), wrapRequestHandle(meCtrl.getMe))
  .patch(
    validate(accessTokenValidate),
    verifyValidate,
    validate(updateMeValidate),
    filterPayload(fieldsCanUpdate),
    wrapRequestHandle(meCtrl.updateMe)
  )

meRoutes.route('/:username').get(wrapRequestHandle(meCtrl.getUserProfile))

meRoutes
  .route('/follow')
  .post(
    validate(accessTokenValidate),
    verifyValidate,
    validate(followValidator),
    wrapRequestHandle(meCtrl.followSomeOne)
  )
meRoutes.delete(
  '/follow/:user_id',
  validate(accessTokenValidate),
  verifyValidate,
  validate(unFollowValidate),
  wrapRequestHandle(meCtrl.unFollowSomeOne)
)
export default meRoutes
