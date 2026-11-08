/**
 * What a path says about itself in `hub/api/list` (protocol.md section 15): passed in the settings of `post` and
 * `stream`, next to `access`. hub-service before descriptions ignores these fields.
 */
export interface Described {
  title?: string
  description: string
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean }
}
// Typed, not `satisfies`: schema literals would widen to `type: string`, which ApiSettings' JSONSchema doesn't take
export type Descriptions = { post: Record<string, Described>; stream: Record<string, Described> }

// The request is Ollama's ChatRequest (ollama-js 0.5.18), sent to Ollama's /api/chat as it is. Its shared part
// (model, messages with role and content, options, keep_alive) is what hub-lmstudio's llm/local takes too.

const toolCall = {
  type: 'object',
  description: 'A function call the model asks for; the caller runs it and answers with a "tool" message',
  properties: {
    function: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of one of the request\'s tools' },
        arguments: { type: 'object', description: 'Arguments, as an object' },
      },
      required: ['name', 'arguments'],
    },
  },
  required: ['function'],
}
const message = {
  type: 'object',
  description: 'One chat message',
  properties: {
    role: { type: 'string', description: 'Who wrote it', enum: ['system', 'user', 'assistant', 'tool'] },
    content: { type: 'string', description: 'Message text' },
    thinking: { type: 'string', description: 'The model\'s reasoning, for thinking models' },
    images: { type: 'array', items: { type: 'string' }, description: 'Images for vision models, base64 encoded' },
    tool_calls: { type: 'array', items: toolCall, description: 'Tool calls an assistant message made' },
    tool_name: { type: 'string', description: 'In a "tool" message: the tool whose result this is' },
  },
  required: ['role', 'content'],
}
const options = {
  type: 'object',
  description: 'Model parameters (Ollama Options), for example temperature, top_p, top_k, seed, num_predict, num_ctx and stop',
  properties: {
    temperature: { type: 'number', description: 'Sampling temperature; higher is more random' },
    top_p: { type: 'number' },
    top_k: { type: 'integer' },
    seed: { type: 'integer', description: 'Same seed and prompt give the same answer' },
    num_predict: { type: 'integer', description: 'Most tokens to generate; -1 for no limit' },
    num_ctx: { type: 'integer', description: 'Context window, in tokens' },
    stop: { type: 'array', items: { type: 'string' }, description: 'Stops generating at any of these' },
  },
}
const request = {
  type: 'object',
  description: 'Ollama ChatRequest',
  properties: {
    model: { type: 'string', description: 'Model name from llm/list, like "llama3.2" or "qwen3:8b"' },
    messages: { type: 'array', items: message, description: 'The conversation so far, oldest first' },
    stream: { type: 'boolean', description: 'Ignored: the post answers once and the stream yields chunks' },
    format: { type: ['string', 'object'], description: '"json", or a JSON schema the answer must follow' },
    keep_alive: { type: ['string', 'number'], description: 'How long the model stays loaded after the call: seconds, or a duration like "5m"' },
    tools: {
      type: 'array',
      description: 'Functions the model may call',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', const: 'function' },
          function: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              parameters: { type: 'object', description: 'JSON schema of the arguments' },
            },
          },
        },
        required: ['type', 'function'],
      },
    },
    think: { type: ['boolean', 'string'], enum: [true, false, 'high', 'medium', 'low'], description: 'Thinking models: whether, or how hard, to think first' },
    options,
  },
  required: ['model'],
}
const timing = {
  done_reason: { type: 'string', description: 'Why it stopped, like "stop" or "length"' },
  total_duration: { type: 'integer', description: 'Nanoseconds' },
  load_duration: { type: 'integer', description: 'Nanoseconds spent loading the model' },
  prompt_eval_count: { type: 'integer', description: 'Prompt tokens' },
  prompt_eval_duration: { type: 'integer', description: 'Nanoseconds' },
  eval_count: { type: 'integer', description: 'Generated tokens' },
  eval_duration: { type: 'integer', description: 'Nanoseconds' },
}
const response = (what: string) => ({
  type: 'object',
  description: what,
  properties: {
    model: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
    message: message,
    done: { type: 'boolean', description: 'Whether this is the last chunk' },
    ...timing,
  },
  required: ['model', 'created_at', 'message', 'done'],
})

export const descriptions: Descriptions = {
  post: {
    'llm/local': {
      title: 'Chat with a local model',
      description:
        'Runs a chat completion on this device\'s Ollama and answers with the whole reply once it is done. Fails with Ollama\'s error when the model isn\'t pulled or Ollama isn\'t running; the hub runs at most 4 at once per provider. Needs a grant of llm/local.',
      inputSchema: request,
      outputSchema: response('Ollama ChatResponse: the reply in message, with token counts and timings'),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    'llm/list': {
      title: 'List local models',
      description:
        'Lists the models pulled into this device\'s Ollama (its /api/tags), as Ollama\'s ListResponse. Use a name from it as the model of llm/local. Needs a grant of llm/list.',
      outputSchema: {
        type: 'object',
        description: 'Ollama ListResponse',
        properties: {
          models: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Model name to pass to llm/local' },
                model: { type: 'string' },
                modified_at: { type: 'string', format: 'date-time' },
                size: { type: 'integer', description: 'Bytes on disk' },
                digest: { type: 'string' },
                details: {
                  type: 'object',
                  properties: {
                    parent_model: { type: 'string' },
                    format: { type: 'string', description: 'Like "gguf"' },
                    family: { type: 'string' },
                    families: { type: ['array', 'null'], items: { type: 'string' } },
                    parameter_size: { type: 'string', description: 'Like "8.0B"' },
                    quantization_level: { type: 'string', description: 'Like "Q4_K_M"' },
                  },
                },
              },
              required: ['name', 'model'],
            },
          },
        },
        required: ['models'],
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
  },
  stream: {
    'llm/local': {
      title: 'Stream a chat with a local model',
      description:
        'Runs a chat completion on this device\'s Ollama and yields the reply as it is generated: each value carries the next piece of message.content (or message.thinking), and the last has done true with token counts and timings. Fails like the post; the hub runs at most 4 at once per provider. Needs a grant of llm/local.',
      inputSchema: request,
      outputSchema: response('One Ollama ChatResponse chunk; done_reason and the timings come with the last one only'),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
  },
}
