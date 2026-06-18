import ollama from 'ollama'
import type { ChatRequest } from 'ollama'
import { Service } from 'hub-service'

type PostRequest = ChatRequest & { stream: false }
type StreamRequest = ChatRequest & { stream: true }

new Service({
  address: process.argv[2],
  name: 'Ollama Service',
  icon: { symbol: 'apple.intelligence', text: 'LLM' },
})
  .post(
    'llm/local',
    async (body: PostRequest) => {
      body.stream = false
      return await ollama.chat(body)
    },
    { limit: 4 },
  )
  .stream(
    'llm/local',
    async function* (body: StreamRequest) {
      body.stream = true
      const response = await ollama.chat(body)
      for await (const chunk of response) {
        yield chunk
      }
    },
    { limit: 4 },
  )
  .post('llm/list', async () => ollama.list())
  .start()
