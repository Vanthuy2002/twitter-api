import { createHash } from 'node:crypto'

const algorithmHash = (content: string): string => {
  return createHash('sha256').update(content).digest('hex')
}

const hashPassword = (password: string): string => {
  const hash = algorithmHash(password)
  return hash
}

const randomString = (): string => {
  return Math.random().toString(36).substring(2, 15)
}

export { hashPassword, algorithmHash, randomString }
