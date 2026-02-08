import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from "fastify";
import z from "zod";
import { knex } from '../database';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';



export async function mealsRoute(app: FastifyInstance) {

    app.post('/', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const createMealBodySchema = z.object({
            name: z.string(),
            description: z.string(),
            dateTime: z.coerce.date(),
            isOnDiet: z.boolean(),
        })
        const { name, description, dateTime, isOnDiet } = createMealBodySchema.parse(request.body)

        let sessionId = request.cookies.sessionId

        if (!sessionId) {
            return reply.status(401).send()
        }

        const user = await knex('users').where({ session_id: sessionId }).first()

        if (!user) {
            return reply.status(401).send()
        }
        
        await knex('meals').insert({
            id: randomUUID(),
            user_id: user.id,
            name,
            description,
            date_time: dateTime,
            is_on_diet: isOnDiet,
        })

        return reply.status(201).send()

    })

    app.get('/', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const sessionId = request.cookies.sessionId

        const user = await knex('users').where({ session_id: sessionId }).first()

        const meals = await knex('meals')
        .where({ user_id: user.id })
        .orderBy('date_time', 'desc')

      return reply.send({ meals })
    })

    app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const getMealParamsSchema = z.object({
            id: z.string().uuid(),
        })

        const { id } = getMealParamsSchema.parse(request.params)

        const sessionId = request.cookies.sessionId

        const user = await knex('users').where({ session_id: sessionId }).first()

        const meal = await knex('meals')
        .where({ id, user_id: user.id })
        .first()

      return reply.send({ meal })
    })

    app.put('/:id', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const updateMealParamsSchema = z.object({
            id: z.string().uuid(),
        })

        const updateMealBodySchema = z.object({
            name: z.string(),
            description: z.string(),
            dateTime: z.coerce.date(),
            isOnDiet: z.boolean(),
        })

        const { id } = updateMealParamsSchema.parse(request.params)
        const { name, description, dateTime, isOnDiet } = updateMealBodySchema.parse(request.body)

        const sessionId = request.cookies.sessionId

        const user = await knex('users').where({ session_id: sessionId }).first()

        await knex('meals')
        .where({ id, user_id: user.id })
        .update({
            name,
            description,
            date_time: dateTime,
            is_on_diet: isOnDiet,
            updated_at: knex.fn.now(),
        })

      return reply.send()
    })

    app.delete('/:id', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const deleteMealParamsSchema = z.object({
            id: z.string().uuid(),
        })

        const { id } = deleteMealParamsSchema.parse(request.params)

        const sessionId = request.cookies.sessionId

        const user = await knex('users').where({ session_id: sessionId }).first()

        await knex('meals')
        .where({ id, user_id: user.id })
        .delete()

      return reply.send()
    })

    app.get('/metrics', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const sessionId = request.cookies.sessionId
        
        const user = await knex('users').where({ session_id: sessionId }).first()

        const meals = await knex('meals')
        .where({ user_id: user.id })

        const totalMeals = meals.length
        const mealsOnDiet = meals.filter(meal => meal.is_on_diet).length
        const mealsOffDiet = meals.filter(meal => !meal.is_on_diet).length

        let bestSequenceOnDiet = 0
        let currentSequenceOnDiet = 0

        for (const meal of meals) {
            if (meal.is_on_diet) {
                currentSequenceOnDiet++
            } else {
                if (currentSequenceOnDiet > bestSequenceOnDiet) {
                    bestSequenceOnDiet = currentSequenceOnDiet
                }
                currentSequenceOnDiet = 0
            }
        }

        if (currentSequenceOnDiet > bestSequenceOnDiet) {
            bestSequenceOnDiet = currentSequenceOnDiet
        }

      return reply.send({
        totalMeals,
        mealsOnDiet,
        mealsOffDiet,
        bestSequenceOnDiet,
      })
    })

}