import ollama from 'ollama'
import type { ChatRequest } from 'ollama'
import { Service } from 'hub-service'

type PostRequest = ChatRequest & { stream: false }
type StreamRequest = ChatRequest & { stream: true }

new Service()
  .post('llm/local', async (body: PostRequest) => {
    await ollama.pull({ model: body.model })
    body.stream = false
    return await ollama.chat(body)
  })
  .stream('llm/local', async function* (body: StreamRequest) {
    await ollama.pull({ model: body.model })
    body.stream = true
    const response = await ollama.chat(body)
    for await (const chunk of response) {
      yield chunk
    }
  })
  .post('llm/list', async () => ollama.list())
  .start()
