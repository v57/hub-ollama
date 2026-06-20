<h1>
  <img alt="Containerization logo" src="./icon.png" width="70" valign="middle">
  &nbsp;ollama
</h1>
> Made for [Hub](https://hub.v57.dev)

Share your Ollama models with Hub network. Run on multiple devices, connect to a single Hub and it will automatically split the load between them! Very good for agents and server stuff
## Normal request

```ts
const request: StreamRequest
const response: ChatResponse = await service.send('llm/local', request)
```
## Stream request
```ts
const request: StreamRequest
for (await const chunk: ChatResponse of service.values('llm/local', request)) {
	
}
```
# List models
```ts
const response: ListResponse = await service.send('llm/list')
```
## Types
```ts
interface ChatRequest {
    model: string;
    messages?: Message[];
    stream?: boolean;
    format?: string | object;
    keep_alive?: string | number;
    tools?: Tool[];
    think?: boolean | 'high' | 'medium' | 'low';
    options?: Partial<Options>;
}
interface Message {
    role: string;
    content: string;
    thinking?: string;
    images?: Uint8Array[] | string[];
    tool_calls?: ToolCall[];
    tool_name?: string;
}
interface ChatResponse {
    model: string;
    created_at: Date;
    message: Message;
    done: boolean;
    done_reason: string;
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
}
interface ModelResponse {
    name: string;
    modified_at: Date;
    model: string;
    size: number;
    digest: string;
    details: ModelDetails;
    expires_at: Date;
    size_vram: number;
}
interface ModelDetails {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
}


interface ListResponse {
    models: ModelResponse[];
}
type PostRequest = ChatRequest & { stream: false }
type StreamRequest = ChatRequest & { stream: true }
```
