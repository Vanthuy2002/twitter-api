import { MediaController } from '@/controllers/media'
import { accessTokenValidate, verifyValidate } from '@/middleware/users'
import wrapRequestHandle from '@/utils/handlers'
import { validate } from '@/utils/validator'
import { Router } from 'express'

const mediaRoutes = Router()
const mediaCtrl = new MediaController()

mediaRoutes
  .route('/upload-images')
  .post(
    validate(accessTokenValidate),
    verifyValidate,
    wrapRequestHandle(mediaCtrl.uploadImage)
  )

mediaRoutes.post(
  '/upload-videos',
  validate(accessTokenValidate),
  verifyValidate,
  wrapRequestHandle(mediaCtrl.uploadVideos)
)

export default mediaRoutes
