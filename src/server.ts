import { app } from "./app"
import { env } from "../env"


app
  .listen({
    port: env.PORT ? Number(env.PORT) : 3333,
  })
  .then(() => {
    console.log('HTTP Server Running!')
  })