import { Request, Response } from 'express'
import authSerive from '@/services/auth'
import { User } from '@/models/users'
import { configEnvs } from '@/config'

export class AuthController {
  async registerUser(req: Request, res: Response) {
    const data = await authSerive.register(req.body)
    res.status(data.status).json({ ...data })
  }

  async loginUser(req: Request, res: Response) {
    const { user } = req
    const { _id, verify } = user as User
    const id = _id.toString()
    const data = await authSerive.login({ id, verify })
    res.status(201).json({ ...data })
  }

  async logoutUser(req: Request, res: Response) {
    const { refresh_token } = req.body
    const data = await authSerive.logout(refresh_token)
    res.status(data.status).json({ ...data })
  }

  async verifyEmail(req: Request, res: Response) {
    const { decoded_email }: any = req
    const data = await authSerive.verifyLogic(decoded_email.id)
    res.status(data?.status).json({ ...data })
  }

  async resendEmailVerify(req: Request, res: Response) {
    const {
      decoded: { id }
    }: any = req
    const data = await authSerive.resendVerify(id)
    res.status(data?.status).json({ ...data })
  }

  async forgotPasswordUser(req: Request, res: Response) {
    const { _id, verify } = req.user as User
    const id = _id.toString()
    const data = await authSerive.forgorPassword({ id, verify })
    res.status(data.status).json({ ...data })
  }

  async resetPasswordUser(req: Request, res: Response) {
    const {
      decoded: { id }
    }: any = req
    const { password } = req.body
    const data = await authSerive.resetPassword(id, password)
    res.status(data?.status).json({ ...data })
  }

  async changePassword(req: Request, res: Response) {
    const {
      decoded: { id }
    }: any = req
    const { password } = req.body
    const data = await authSerive.updatePassword(id, password)
    res.status(data.satus).json({ ...data })
  }

  async loginWithGoogle(req: Request, res: Response) {
    const { code } = req.query
    const data = await authSerive.oauthLogin(code as string)
    const urlRedirect = `${configEnvs.clientRedirect}?access_token=${data.accessToken}&refresh_token=${data.refreshToken}&newuser=${data.newUser}&verify=${data.verify}`
    res.redirect(urlRedirect)
  }

  async refreshTokensHandler(req: Request, res: Response) {
    const { refresh_token } = req.body
    const {
      refresh_decoded: { id, verify, exp }
    }: any = req
    const data = await authSerive.refreshTokens(id, verify, refresh_token, exp)
    res.status(data.status).json(data)
  }
}
