import Fastify from 'fastify'
import cookie from '@fastify/cookie'

import { usersRoute } from './routes/users.js'
// import crypto from 'node:crypto'

export const app = Fastify({
  logger: true,
})

app.register(cookie)

app.register(usersRoute, { prefix: '/users' })
