import tweetRoutes from './tweets'
import swaggerUi from 'swagger-ui-express'
import staticRoutes from './static'
import searchRoutes from './search'
import OAuthRoute from './google'
import meRoutes from './users'
import mediaRoutes from './media'
import conversationRoutes from './conversation'
import bookmarkRoute from './bookmark'
import authRoutes from './auth'
import { openapiSpecification } from '@/utils/swagger'
import { httpStatus } from '@/constants/httpStatus'
import { Express } from 'express'
import { ErrorWithStatus } from '@/models/Errors'

const defineRoutes = (app: Express) => {
  app.use('/auth', authRoutes)
  app.use('/user', meRoutes)
  app.use('/api', OAuthRoute)
  app.use('/media', mediaRoutes)
  app.use('/static', staticRoutes)
  app.use('/tweet', tweetRoutes)
  app.use('/bookmark', bookmarkRoute)
  app.use('/search', searchRoutes)
  app.use('/message', conversationRoutes)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification))

  app.all('*', (req, res, next) => {
    next(
      new ErrorWithStatus({
        message: `Can not find ${req.url} on server`,
        status: httpStatus.NOT_FOUND
      })
    )
  })
}

export default defineRoutes
