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
  appEnv: process.env.NODE_ENV,
  port: process.env.PORT || 3000,
  hostMongo: process.env.MONGO_URI,
  passMongo: process.env.MONGO_PASS,
  dbMongo: process.env.MONGO_DB,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpired: process.env.JWT_EXPIRED,
  jwtExpiredRefresh: process.env.JWT_EXPIRED_REFRESH,
  jwtVerified: process.env.JWTR_VERIFIED,
  googleApi: process.env.GOOGLE_API,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectURI: process.env.REDIRECT_URI,
  clientRedirect: process.env.CLIENT_REDIRECT,
  clientHost: process.env.CLIENT_HOST,
  awsAccessKey: process.env.AWS_ACCESS_KEY,
  awsSecretKey: process.env.AWS_SECRET_KEY,
  awsRegion: process.env.AWS_REGION,
  awsFrom: process.env.AWS_FROM,
  awsUserEmail: process.env.AWS_USER_EMAIL
}

const globalConfig = (app: Express) => {
  app.use(express.json())
  app.use(helmet())
  app.use(cors({ origin: isProduction ? configEnvs.clientHost : '*' }))
  app.use(limiter)
}

export default globalConfig
