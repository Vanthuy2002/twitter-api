import { ConversationController } from '@/controllers/conversation'
import {
  messageIdValidate,
  receiverIdValidate,
  updateMessageValidate
} from '@/middleware/conversations'
import { paginationValidate } from '@/middleware/tweet'
import { accessTokenValidate, verifyValidate } from '@/middleware/users'
import wrapRequestHandle from '@/utils/handlers'
import { validate } from '@/utils/validator'
import { Router } from 'express'

const conversationRoutes = Router()
const conversationCtrl = new ConversationController()
conversationRoutes
  .route('/receiver/:receiver_id')
  .get(
    validate(accessTokenValidate),
    verifyValidate,
    validate(receiverIdValidate),
    validate(paginationValidate),
    wrapRequestHandle(conversationCtrl.getMessByReceiverId)
  )

conversationRoutes
  .route('/private/:message_id')
  .delete(
    validate(accessTokenValidate),
    verifyValidate,
    validate(messageIdValidate),
    wrapRequestHandle(conversationCtrl.deletePrivateMessage)
  )
  .patch(
    validate(accessTokenValidate),
    verifyValidate,
    validate(messageIdValidate),
    validate(updateMessageValidate),
    wrapRequestHandle(conversationCtrl.updatePrivateMessage)
  )

export default conversationRoutes
