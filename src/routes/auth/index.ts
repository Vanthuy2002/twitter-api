import { AuthController } from '@/controllers/auth'
import {
  loginValidate,
  accessTokenValidate,
  refreshTokenValidate,
  registerValidator,
  emailVerifyValidate,
  forgotPasswordValidate,
  forgotTokenValidate,
  changePasswordValidate,
  verifyValidate
} from '@/middleware/users'
import wrapRequestHandle from '@/utils/handlers'
import { validate } from '@/utils/validator'
import { Router } from 'express'

const authCtrl = new AuthController()
const authRoutes = Router()

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - 'auth'
 *     summary: 'This api using for login user'
 *     description: Login user into system
 *     operationId: Login
 *     requestBody:
 *       description: Send email and password to login user
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       '200':
 *         description: Login successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Login successfully!!
 *                 - $ref: '#/components/schemas/successAuthentication'
 *       '404':
 *         description: Email or password not correct
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email or password not correct
 *                 status:
 *                   type: number
 *                   example: 404
 *       '422':
 *         description: Validate email and password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Validate fail, try again
 *                 error:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: Must be an email
 *                     password:
 *                       type: string
 *                       example: Must be at least 5 characters
 * components:
 *   schemas:
 *     Login:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           example: test@gmail.com
 *         password:
 *           type: string
 *           example: thuy2002
 *     successAuthentication:
 *       type: object
 *       properties:
 *         status:
 *           type: number
 *           example: 200
 *         accessToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *         refreshToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *     User:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 657aabf48805b0c9a20c0d42
 *             email:
 *               type: string
 *               example: test@gmail.com
 *             username:
 *               type: string
 *               example: testuser
 *             date_birth:
 *               type: string
 *               example: 2023-12-14T07:17:08.676Z
 *             tweeter_circle:
 *               type: array
 *               example: []
 *             bio:
 *               type: string
 *               example: 'My job is .....'
 *             location:
 *               type: string
 *               example: 'Ha Noi, Viet Nam'
 *             avatar:
 *               type: string
 *               example: 'http://placeholder.co/600x400?text=test'
 *             cover_photo:
 *               type: string
 *               example: 'http://placeholder.co/600x400?text=test&bg=white'
 *     VerifyStatus:
 *       type: string
 *       enum: ['Verified', 'Unverified', 'Banner']
 *       example: 'Verified'
 */

authRoutes.post(
  '/login',
  validate(loginValidate),
  wrapRequestHandle(authCtrl.loginUser)
)
authRoutes.post(
  '/register',
  validate(registerValidator),
  wrapRequestHandle(authCtrl.registerUser)
)

authRoutes.post(
  '/logout',
  validate(accessTokenValidate),
  validate(refreshTokenValidate),
  wrapRequestHandle(authCtrl.logoutUser)
)

authRoutes.post(
  '/verify-email',
  validate(emailVerifyValidate),
  wrapRequestHandle(authCtrl.verifyEmail)
)

authRoutes.post(
  '/resend-email-verify',
  validate(accessTokenValidate),
  wrapRequestHandle(authCtrl.resendEmailVerify)
)

authRoutes.post(
  '/forgot-password',
  validate(forgotPasswordValidate),
  wrapRequestHandle(authCtrl.forgotPasswordUser)
)

authRoutes.post(
  '/reset-password',
  validate(forgotTokenValidate),
  wrapRequestHandle(authCtrl.resetPasswordUser)
)

authRoutes.put(
  '/change-password',
  validate(accessTokenValidate),
  verifyValidate,
  validate(changePasswordValidate),
  wrapRequestHandle(authCtrl.changePassword)
)

authRoutes.post(
  '/refresh-token',
  validate(refreshTokenValidate),
  wrapRequestHandle(authCtrl.refreshTokensHandler)
)

export default authRoutes
