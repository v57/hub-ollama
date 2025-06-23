import ollama from 'ollama'
import { Service } from 'hub-service'

new Service().post('llm/local', ({ body }) => ollama.chat(body)).start()
