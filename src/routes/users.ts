import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from "fastify";
import z from "zod";
import { knex } from '../database';



export async function usersRoute(app: FastifyInstance) {

    app.get('/', async (request, reply) => {
        return reply.send('Hello World')
    })


    app.post('/', async (request, reply) => {
        const createUserBodySchema = z.object({
            name: z.string(),
            email: z.string()
        })
        const { name, email } = createUserBodySchema.parse(request.body)

        let sessionId = request.cookies.sessionId

        if (!sessionId) {
            sessionId = crypto.randomUUID()
            reply.cookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            })
        }
        
        await knex('users').insert({
            id: randomUUID(),
            name,
            email,
            session_id: sessionId,
        })

        return reply.status(201).send()

    })
}   