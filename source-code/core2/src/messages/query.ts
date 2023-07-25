import { writable, derived, readonly, get } from 'svelte/store'
import type { Message } from "./schema.js"

export type MessageQueryApi = {
	subscribe: (fn: (message: Message[]) => void) => void
	create: (args: { data: Message }) => void
	get: (args: { where: { id: Message["id"] } }) => { subscribe: (fn: (message: Message | undefined) => void) => void }
	update: (args: { where: { id: Message["id"] }; data: Partial<Message> }) => void
	upsert: (args: { where: { id: Message["id"] }; data: Message }) => void
	delete: (args: { where: { id: Message["id"] } }) => void
}

/**
 * Creates a query API for messages.
 *
 * Creates an index internally for faster get operations.
 */
export function createQuery(messagesInit: Array<Message>): MessageQueryApi {
	const messages = writable<Message[]>(messagesInit)
	const { subscribe } = readonly(messages)

	return {
		subscribe,
		// query
		get: ({ where }) => {
			const { subscribe } = derived(messages, $messages => $messages.find(({ id }) => id === where.id))

			return {
				subscribe,
			}
		},
		// mutation
		create: ({ data }) => {
			messages.update((messages) => [...messages, data])
		},
		update: ({ where, data }) => {
			messages.update(messages => messages.map(m => (m.id === where.id ? { ...m, ...data } : m)))
		},
		upsert: ({ where, data }) => {
			const message = get(messages).find(({ id }) => id === where.id)
			if (message === undefined) {
				messages.update(messages => [...messages, data])
			} else {
				messages.update(messages => messages.map(m => (m.id === where.id ? { ...m, ...data } : m)))
			}
		},
		delete: ({ where }) => {
			messages.update(messages => messages.filter(({ id }) => id !== where.id))
		},
	}
}
