import { PayloadToken } from '@/types'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { configEnvs } from '@/config'

const generateTokens = (payload: PayloadToken, expiresIn: string | number) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(
      payload,
      configEnvs.jwtSecret as string,
      { expiresIn },
      (error, token) => {
        if (error) return reject(error)
        return resolve(token as string)
      }
    )
  })
}

const verifyToken = (tokens: string) => {
  return new Promise<JwtPayload>((resolve, reject) => {
    jwt.verify(tokens, configEnvs.jwtSecret as string, (err, decoded) => {
      if (err) return reject(err)
      resolve(decoded as JwtPayload)
    })
  })
}

const checkTokenExpired = async (tokens: string) => {
  const decoded = await verifyToken(tokens)
  const expiredTime = decoded?.exp as number

  const now = Date.now() / 100
  return now < expiredTime
}

export { generateTokens, verifyToken, checkTokenExpired }
