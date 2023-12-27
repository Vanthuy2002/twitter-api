import { HomeControllers } from '@/controllers/home'
import wrapRequestHandle from '@/utils/handlers'
import { Router } from 'express'

const homeRoutes = Router()
const homeCtrls = new HomeControllers()

homeRoutes.route('/').get(wrapRequestHandle(homeCtrls.getHomePage))

export default homeRoutes
