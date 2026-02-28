import { createClient } from 'redis'
import { config } from '../../config/env.js'

// Using the config provided for host and port
export const client = createClient({
  url: `redis://${config.redis.host}:${config.redis.port}`
})

client.on('error', (err) => console.error('Redis Client Error', err))

export const connectRedis = async () => {
  if (!client.isOpen) {
    await client.connect()
    console.log(`Connected to Redis on ${config.redis.host}:${config.redis.port}`)
  }
}
