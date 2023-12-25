import express from 'express'
import globalConfig, { configEnvs } from './config'
import dbServices from './database'
import defineRoutes from './routes'
import handleErrGlobal from './middleware/error'
import { createServer } from 'http'
import defineSocketFeature from './utils/socket'

const app = express()
const PORT = configEnvs.port
const httpServer = createServer(app)

defineSocketFeature(httpServer)
globalConfig(app)
defineRoutes(app)
app.use(handleErrGlobal)

httpServer.listen(PORT, () => console.log(`Running at port ${PORT}`))
dbServices
  .connectMongo()
  .then(() => {
    dbServices.createIndexUsers()
    dbServices.createIndexTweets()
  })
  .catch(console.dir)
