import ollama from 'ollama'
import type { ChatRequest } from 'ollama'
import { Service } from 'hub-service'

type StreamRequest = ChatRequest & { stream: true }

new Service()
  .post('llm/local', body => ollama.chat(body))
  .stream('llm/local', async function* (body) {
    const response = await ollama.chat(body as StreamRequest)
    for await (const chunk of response) {
      yield chunk
    }
  })
  .start()
