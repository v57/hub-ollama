import type { ApiSettings } from 'hub-service'

/**
 * Who may call each path. Hubs from before default-deny let anyone call a path its service doesn't guard, so every
 * path asks the hub whether its caller holds a grant of that path: owners always pass, other callers need an owner's
 * grant, anonymous callers never pass (security audit M9).
 */
const granted = (path: string, name: string): ApiSettings => ({ permission: path, permissions: { name } })

export const access: Record<string, ApiSettings> = {
  'llm/local': granted('llm/local', 'Run models'),
  'llm/list': granted('llm/list', 'Run models'),
}
