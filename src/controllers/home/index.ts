import { Request, Response } from 'express'
import path from 'path'

export class HomeControllers {
  getHomePage(req: Request, res: Response) {
    const pathToHome = path.resolve('src/templates/home', 'index.html')
    return res.sendFile(pathToHome, (err) => {
      if (err) {
        console.log(err['message'])
      }
    })
  }
}
