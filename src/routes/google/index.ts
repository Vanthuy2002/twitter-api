import { AuthController } from '@/controllers/auth'
import wrapRequestHandle from '@/utils/handlers'
import { Router } from 'express'

const OAuthRoute = Router()
const authCtrl = new AuthController()

OAuthRoute.get('/oauth/google', wrapRequestHandle(authCtrl.loginWithGoogle))

export default OAuthRoute
