import { MediaController } from '@/controllers/media'
import StaticController from '@/controllers/static'
import { Router } from 'express'

const staticRoutes = Router()
const staticCtrl = new StaticController()
const mediaCtrl = new MediaController()

staticRoutes.get('/:name', staticCtrl.getStaticImage)
staticRoutes.get('/streaming-videos/:name', mediaCtrl.streamingVideos)
export default staticRoutes
