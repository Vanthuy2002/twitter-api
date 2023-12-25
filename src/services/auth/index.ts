import dbServices from '@/database'
import axios from 'axios'
import { User } from '@/models/users'
import { TokenType, UserGoogle, VerifyUserStatus } from '@/types'
import { TokenSchema } from '@/models/tokens'
import { sendEmaiLForgotPassword, sendVerifyEmail } from '@/utils/email'
import { ObjectId } from 'mongodb'
import { messResponse, messageValidator } from '@/constants/message'
import { httpStatus } from '@/constants/httpStatus'
import { hashPassword, randomString } from '@/utils/crypto'
import { ErrorWithStatus } from '@/models/Errors'
import { checkTokenExpired, generateTokens } from '@/utils/tokens'
import { configEnvs } from '@/config'

type TokensParams = {
  id: string
  verify: VerifyUserStatus
  exp?: number
}

class AuthServices {
  private async signAccessTokens({
    id,
    verify
  }: TokensParams): Promise<string> {
    const tokens = await generateTokens(
      { id, tokenType: TokenType.AccessToken, verify },
      configEnvs.jwtExpired as string
    )
    return tokens
  }

  private async signRefreshTokens({
    id,
    verify,
    exp
  }: TokensParams): Promise<string> {
    const tokens = await generateTokens(
      { id, tokenType: TokenType.RefreshToken, verify },
      exp || (configEnvs.jwtExpiredRefresh as string)
    )
    return tokens
  }

  private async signAccessAndRefreshToken({
    id,
    verify,
    exp
  }: TokensParams): Promise<string[]> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessTokens({ id, verify }),
      this.signRefreshTokens({ id, verify, exp })
    ])

    return [accessToken, refreshToken]
  }

  private async signEmailTokens({ id, verify }: TokensParams): Promise<string> {
    const tokens = await generateTokens(
      { id, tokenType: TokenType.VerifyToken, verify },
      configEnvs.jwtVerified as string
    )
    return tokens
  }

  private async signForgotTokens({
    id,
    verify
  }: TokensParams): Promise<string> {
    const tokens = await generateTokens(
      { id, tokenType: TokenType.ForgetPasswordToken, verify },
      configEnvs.jwtVerified as string
    )
    return tokens
  }

  private async getOAuthGgToken(code: string) {
    const body = {
      code,
      client_id: configEnvs.googleClientId,
      client_secret: configEnvs.clientSecret,
      redirect_uri: configEnvs.redirectURI,
      grant_type: 'authorization_code'
    }

    const res = await axios.post(configEnvs.googleApi as string, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return res.data
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const res = await axios.get<UserGoogle>(
      'https://www.googleapis.com/oauth2/v1/userinfo',
      {
        params: {
          access_token,
          alt: 'json'
        },
        headers: {
          Authorization: `Bearer ${id_token}`
        }
      }
    )
    return res.data
  }

  async register(payload: User) {
    const { password } = payload

    const user_id = new ObjectId()
    const hash = hashPassword(password)

    const email_token = await this.signEmailTokens({
      id: user_id.toString(),
      verify: VerifyUserStatus.Unveryfied
    })

    await dbServices.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        password: hash,
        email_token
      })
    )

    const [tokens] = await Promise.all([
      this.signAccessAndRefreshToken({
        id: user_id.toString(),
        verify: VerifyUserStatus.Unveryfied
      }),
      sendVerifyEmail(
        configEnvs.awsUserEmail as string,
        configEnvs.clientHost as string,
        email_token
      )
    ])

    const [accessToken, refreshToken] = tokens
    return {
      message: messResponse.registerSuccess,
      status: httpStatus.CREATED,
      accessToken,
      refreshToken
    }
  }

  async checkEmailExist(email: string) {
    const user = await dbServices.users.findOne({ email })
    return Boolean(user)
  }

  async login({ id, verify }: TokensParams) {
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
      id,
      verify
    })

    await dbServices.refreshToken.insertOne(
      new TokenSchema({ user_id: new ObjectId(id), tokens: refreshToken })
    )

    return {
      message: messResponse.loginSuccess,
      status: httpStatus.OK,
      accessToken,
      refreshToken
    }
  }

  async logout(tokens: string) {
    await dbServices.refreshToken.deleteOne({ tokens })
    return {
      message: messResponse.logoutSuccess,
      status: httpStatus.OK
    }
  }

  async verifyLogic(id: string) {
    const user = await dbServices.users.findOne({ _id: new ObjectId(id) })
    // not found user
    if (!user) {
      return {
        message: messResponse.notFoundUser,
        status: httpStatus.NOT_FOUND
      }
    }

    // already verified
    if (user.email_token === '') {
      return {
        message: messResponse.verified,
        status: httpStatus.OK
      }
    }

    // not verified
    // option 1 -> set again accessToken, refreshToken -> not need login
    // option 2 -> after verified , redirect to login page
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({ id, verify: VerifyUserStatus.Veryfied }),
      dbServices.users.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            email_token: '',
            verify: VerifyUserStatus.Veryfied
          },
          $currentDate: {
            updatedAt: true
          }
        }
      )
    ])
    const [accessToken, refreshToken] = token
    await dbServices.refreshToken.updateOne(
      {
        user_id: new ObjectId(id)
      },
      {
        $set: {
          tokens: refreshToken
        },
        $currentDate: {
          updatedAt: true
        }
      }
    )
    return {
      message: messResponse.verifyOK,
      status: httpStatus.OK,
      accessToken,
      refreshToken
    }
  }

  async resendVerify(id: string) {
    const user = await dbServices.users.findOne({ _id: new ObjectId(id) })
    if (!user) {
      return {
        message: messResponse.notFoundUser,
        status: httpStatus.NOT_FOUND
      }
    }

    if (user.verify === VerifyUserStatus.Veryfied) {
      return {
        message: messResponse.verified,
        status: httpStatus.OK
      }
    }

    const email_token = await this.signEmailTokens({
      id,
      verify: VerifyUserStatus.Unveryfied
    })

    await Promise.all([
      dbServices.users.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            email_token
          },
          $currentDate: {
            updatedAt: true
          }
        }
      ),
      sendVerifyEmail(
        [configEnvs.awsUserEmail as string],
        configEnvs.clientHost as string,
        email_token
      )
    ])

    return {
      message: messResponse.resendVerify,
      status: httpStatus.OK,
      email_token
    }
  }

  async forgorPassword({ id, verify }: TokensParams) {
    const token = await this.signForgotTokens({ id, verify })
    // Find user by id, get the email addrs
    // But now, my AWS account in sanbox enviroment, haizz

    await Promise.all([
      dbServices.users.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            reset_pass_token: token,
            updatedAt: new Date()
          }
        }
      ),
      sendEmaiLForgotPassword(
        [configEnvs.awsUserEmail as string],
        configEnvs.clientHost as string,
        token
      )
    ])
    return {
      message: messResponse.sendEmailReset,
      status: 200
    }
  }

  async resetPassword(id: string, password: string) {
    const user = await dbServices.users.findOne({ _id: new ObjectId(id) })
    if (user?.reset_pass_token === '') {
      return {
        message: 'Please forgot password before',
        status: httpStatus.UNAUTHOURIZED
      }
    }

    const isExpired = await checkTokenExpired(user?.reset_pass_token as string)
    if (!isExpired) {
      return {
        message: messResponse.tokensExpired,
        status: httpStatus.UNAUTHOURIZED
      }
    }
    const hash = hashPassword(password)
    await dbServices.users.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          reset_pass_token: '',
          password: hash
        },
        $currentDate: {
          updatedAt: true
        }
      }
    )

    return {
      message: messResponse.changePassword,
      status: httpStatus.OK
    }
  }

  async updatePassword(id: string, password: string) {
    const hash = hashPassword(password)
    await dbServices.users.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          password: hash
        },
        $currentDate: {
          updatedAt: true
        }
      }
    )
    // change password ok -> login again
    return {
      message: messResponse.changePassword,
      satus: httpStatus.OK
    }
  }

  async oauthLogin(code: string) {
    const { access_token, id_token } = await this.getOAuthGgToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)

    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: messageValidator.notVerified,
        status: httpStatus.BAD_REQUEST
      })
    }

    const userExist = await dbServices.users.findOne({ email: userInfo.email })
    // email exist -> login user logic
    if (userExist) {
      const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
        id: userExist._id.toString(),
        verify: userExist.verify
      })

      await dbServices.refreshToken.insertOne(
        new TokenSchema({ user_id: userExist._id, tokens: refreshToken })
      )

      return {
        message: messResponse.loginGoogle,
        status: httpStatus.OK,
        accessToken,
        refreshToken,
        newUser: false,
        verify: userExist.verify
      }
    }
    // not exist -> register new -> not throw error
    const password = randomString()
    const payload = {
      email: userInfo.email,
      avatar: userInfo.picture,
      username: userInfo.name,
      password
    }
    const data = await this.register(new User({ ...payload }))
    return { ...data, newUser: true, verify: VerifyUserStatus.Unveryfied }
  }

  async refreshTokens(
    id: string,
    verify: VerifyUserStatus,
    refresh_token: string,
    exp: number
  ) {
    const oldExpired = Math.floor(
      (new Date(exp * 1000).getTime() - Date.now()) / 1000
    )
    // (expired time - current time) / 1000 = thời gian hết hạn = seconds

    const [tokens] = await Promise.all([
      this.signAccessAndRefreshToken({ id, verify, exp: oldExpired }),
      dbServices.refreshToken.deleteOne({ tokens: refresh_token })
    ])

    const [new_access_token, new_refresh_token] = tokens
    const payload = new TokenSchema({
      user_id: new ObjectId(id),
      tokens: new_refresh_token
    })
    await dbServices.refreshToken.insertOne(payload)

    return {
      message: messResponse.refreshTokensOK,
      status: httpStatus.OK,
      accessToken: new_access_token,
      refreshToken: new_refresh_token
    }
  }
}

const authService = new AuthServices()
export default authService
