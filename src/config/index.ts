import express, { Express } from 'express'
import cors from 'cors'
import minimist from 'minimist'
import { config } from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const options = minimist(process.argv.slice(2))
export const isProduction = Boolean(options.production)

const limiter = rateLimit({
  message: 'Too many request, try again!!!!',
  windowMs: 15 * 1000 * 60, // 15 minutes
  max: 100, // maximun 100 request in 15 minutes
  standardHeaders: true,
  legacyHeaders: false
})

config({
  path: isProduction ? '.env.prod' : '.env'
})

export const configEnvs = {
  appEnv: process.env.NODE_ENV as string,
  port: process.env.PORT as string,
  hostMongo: process.env.MONGO_URI as string,
  passMongo: process.env.MONGO_PASS as string,
  dbMongo: process.env.MONGO_DB as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpired: process.env.JWT_EXPIRED as string,
  jwtExpiredRefresh: process.env.JWT_EXPIRED_REFRESH as string,
  jwtVerified: process.env.JWTR_VERIFIED as string,
  googleApi: process.env.GOOGLE_API as string,
  googleClientId: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.CLIENT_SECRET as string,
  redirectURI: process.env.REDIRECT_URI as string,
  clientRedirect: process.env.CLIENT_REDIRECT as string,
  clientHost: process.env.CLIENT_HOST as string,
  awsAccessKey: process.env.AWS_ACCESS_KEY as string,
  awsSecretKey: process.env.AWS_SECRET_KEY as string,
  awsRegion: process.env.AWS_REGION as string,
  awsFrom: process.env.AWS_FROM as string,
  awsUserEmail: process.env.AWS_USER_EMAIL as string
}

const globalConfig = (app: Express) => {
  app.use(express.json())
  app.use(helmet())
  app.use(cors({ origin: isProduction ? configEnvs.clientHost : '*' }))
  app.use(limiter)
}

export default globalConfig
