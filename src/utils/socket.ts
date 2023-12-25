import dbServices from '@/database'
import { VerifyUserStatus } from '@/types'
import { verifyAccessTokensV2 } from './handlers'
import { Server as ServerHttps } from 'http'
import { Server } from 'socket.io'
import { ObjectId } from 'mongodb'
import { messageValidator } from '@/constants/message'
import { httpStatus } from '@/constants/httpStatus'
import { ErrorWithStatus } from '@/models/Errors'
import { Conversation } from '@/models/conversation'
import { configEnvs } from '@/config'

const defineSocketFeature = (httpServer: ServerHttps) => {
  const io = new Server(httpServer, {
    cors: { origin: configEnvs.clientHost }
  })
  const users: { [key: string]: { socketId: string } } = {}

  // socket-io middleware
  io.use(async (socket, next) => {
    const { accessToken } = socket.handshake.auth
    const tokens = accessToken.split(' ')[1]
    try {
      const decoded = await verifyAccessTokensV2(tokens)
      if (decoded.verify !== VerifyUserStatus.Veryfied) {
        throw new ErrorWithStatus({
          message: messageValidator.notVerified,
          status: httpStatus.UNAUTHOURIZED
        })
      }
      socket.handshake.auth.decoded = decoded
      next()
    } catch (error) {
      next({
        message: messageValidator.notLogin,
        name: 'Unauthorization',
        data: error
      })
    }
  })

  io.on('connection', (socket) => {
    console.log('a user connected', socket.id)

    const user_id = socket.handshake.auth?.user_id
    users[user_id] = { socketId: socket.id }

    socket.use(async (pack, next) => {
      const { accessToken } = socket.handshake.auth
      const tokens = accessToken.split(' ')[1]
      try {
        await verifyAccessTokensV2(tokens)
        next()
      } catch (error) {
        next(new Error(messageValidator.notFoundToken))
      }
    })

    socket.on('error', (err) => {
      if (err.message === messageValidator.notFoundToken) {
        socket.disconnect()
        console.log('An error expected, SHUTTING DOWN...')
      }
    })

    socket.on('send-message', async (data) => {
      // get socket_id => emit event => send data to client
      const receiver_socketId = users[data.receiver_id]?.socketId
      if (!receiver_socketId) return

      const payload = new Conversation({
        content: data.content,
        sender_id: new ObjectId(data.sender_id),
        receiver_id: new ObjectId(data.receiver_id)
      })
      const results = await dbServices.conversation.insertOne(payload)
      payload._id = results.insertedId
      socket.to(receiver_socketId).emit('receiver-message', payload)
    })

    socket.on('disconnect', () => {
      delete users[user_id]
      console.log('user disconnected', socket.id)
    })
  })
}

export default defineSocketFeature
