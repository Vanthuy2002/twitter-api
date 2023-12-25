import YAML from 'yaml'
import fs from 'fs'
import path from 'path'
import swaggerJSDoc from 'swagger-jsdoc'

const docs = fs.readFileSync(path.resolve('documents/swagger.yaml'), 'utf-8')
const swaggerDocs = YAML.parse(docs)
const documents = path.resolve('documents')

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Twitter Api',
      version: '1.0.0'
    }
  },
  apis: [`${documents}/*.yaml`]
}

const openapiSpecification = swaggerJSDoc(options)

export { swaggerDocs, openapiSpecification }
