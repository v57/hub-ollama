import { describe, expect, test } from 'bun:test'
import type { ApiSettings } from 'hub-service'
import { ServiceRequest } from 'hub-service/request'
import { access } from './access'

const owner = { key: 'owner-key', owner: true, groups: ['owners'] }
// A member on an approved device of the hub, the most an ungranted non-owner can be
const member = { key: 'member-key', owner: false, groups: ['family'], device: { id: 'phone', name: 'Phone' } }

/** The SDK's checks before a handler runs (`auth`, `groups`, then `permission`), with the hub's grants stubbed */
async function admit(settings: ApiSettings | undefined, caller?: object, granted: string[] = []) {
  const request = new ServiceRequest({}, caller as any)
  request._check = async permission => granted.includes(permission)
  if (settings?.auth || settings?.groups) request.require(settings)
  if (settings?.permission) await request.requirePermission(settings.permission)
}
const outcome = (promise: Promise<unknown>) => promise.then(() => 'allowed', (error: any) => error?.code ?? String(error))

const source = await Bun.file(`${import.meta.dir}/index.ts`).text()
const registrations = [...source.matchAll(/\.(?:post|stream)\(\s*'([^']+)'/g)].map(match => match[1]!)
const registered = [...new Set(registrations)]
/** Each registration of `path` passes `access['path']` (a path can be a post and a stream) */
const passesAccess = (path: string) =>
  source.split(`access['${path}']`).length - 1 === registrations.filter(registration => registration === path).length

describe('access (security audit M9)', () => {
  test('every path the service registers is guarded', () => {
    expect(registered.sort()).toEqual(Object.keys(access).sort())
    for (const path of registered) expect(passesAccess(path)).toBe(true)
  })
  for (const path of Object.keys(access)) {
    test(`${path}: anonymous and ungranted callers are refused, owners and grants pass`, async () => {
      const settings = access[path]
      expect(settings?.permission).toBe(path)
      expect(await outcome(admit(settings))).toBe('unauthorized')
      expect(await outcome(admit(settings, {}))).toBe('unauthorized')
      expect(await outcome(admit(settings, member))).toBe('forbidden')
      expect(await outcome(admit(settings, member, ['something/else']))).toBe('forbidden')
      expect(await outcome(admit(settings, owner))).toBe('allowed')
      expect(await outcome(admit(settings, member, [path]))).toBe('allowed')
    })
  }
})
