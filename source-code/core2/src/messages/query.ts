import { createSignal, createEffect } from 'solid-js'
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
	const [messages, setMessages] = createSignal<Message[]>(messagesInit)

	const callbacks: ((message: Message[]) => void)[] = []

	createEffect(() => {
		for (const callback of callbacks) callback(messages())
	})

	return {
		subscribe: (callback: (message: Message[]) => void) => {
			callbacks.push(callback)
		},
		// query
		get: ({ where }) => {
			const callbacks: ((message: Message | undefined) => void)[] = []
			const [message, setMessage] = createSignal<Message | undefined>()

			createEffect(() => {
				setMessage(messages().find(({ id }) => id === where.id))
			})

			createEffect(() => {
				for (const callback of callbacks) callback(message())
			})

			return {
				subscribe: (callback: (message: Message | undefined) => void) => {
					callbacks.push(callback)
				},
			}
		},
		// mutation
		create: ({ data }) => {
			setMessages([...messages(), data])
		},
		update: ({ where, data }) => {
			setMessages(messages().map(m => (m.id === where.id ? { ...m, ...data } : m)))
		},
		upsert: ({ where, data }) => {
			const message = messages().find(({ id }) => id === where.id)
			if (message === undefined) {
				setMessages([...messages(), data])
			} else {
				setMessages(messages().map(m => (m.id === where.id ? { ...m, ...data } : m)))
			}
		},
		delete: ({ where }) => {
			setMessages(messages().filter(({ id }) => id !== where.id))
		},
	}
}
