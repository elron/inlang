// @ts-ignore
import * as Solid from 'solid-js/dist/solid.js'
const { createEffect, createSignal, createMemo, createRoot } = Solid as typeof import('solid-js');
import type { Signal } from 'solid-js';
import type { Message } from './messages/schema.js';

export type MessageQueryApi = {
	create: (args: { data: Message }) => void
	get: (args: { where: { id: Message["id"] } }) => Message | undefined
	update: (args: { where: { id: Message["id"] }; data: Partial<Message> }) => void
	upsert: (args: { where: { id: Message["id"] }; data: Message }) => void
	delete: (args: { where: { id: Message["id"] } }) => void
}

export function createQuery(messagesSignal: Signal<Message[]>): MessageQueryApi {
	const [messages, setMessages] = messagesSignal

	return {
		// query
		get: ({ where }) => {
			return createMemo(
				() => messages().find(({ id }) => id === where.id),
				undefined,
				{
					equals: (a, b) => JSON.stringify(a) === JSON.stringify(b)
				}
			)()
		},
		// mutation
		create: ({ data }) => {
			setMessages([...messages(), data]);
		},
		update: ({ where, data }) => {
			setMessages(
				messages().map((m) => (m.id === where.id ? { ...m, ...data } : m))
			);
		},
		upsert: ({ where, data }) => {
			const message = messages().find(({ id }) => id === where.id);
			if (message === undefined) {
				setMessages([...messages(), data]);
			} else {
				setMessages(
					messages().map((m) => (m.id === where.id ? { ...m, ...data } : m))
				);
			}
		},
		delete: ({ where }) => {
			setMessages(messages().filter(({ id }) => id !== where.id));
		},
	};
}

const createPlugin = () => {
	const messagesSignal = createSignal<Message[]>([]);
	const [messages, setMessages] = messagesSignal

	return {
		messagesSignal,
		readMessages: () => setMessages([...messages(), { id: '12', body: {} }]),
	}
}

const createLint = (query: MessageQueryApi) => {
	// TODO: set all lints in an array/object
	const [lints, setLints] = createSignal([] as any);

	return {
		get: ({ where }) => {
			return createMemo(
				() => {
					const x = query.get({ where })
					if (x === undefined) {
						return false
					}

					return x.id >= '10'
				},
				undefined,
				{
					equals: (a, b) => JSON.stringify(a) === JSON.stringify(b)
				}
			)()
		},
	}
}

const createApp = async () => {
	const plugin = createPlugin()
	const query = createQuery(plugin.messagesSignal);
	const lints = createLint(query)

	createEffect(() => {
		const xLint = lints.get({ where: { id: '12' } });
		console.log('x', xLint);
	});

	// createEffect(() => {
	// 	console.log(0, plugin.messagesSignal[0]());
	// });

	createEffect(() => {
		const firstMessage = query.get({ where: { id: '1' } });
		console.log(1, firstMessage);
	});

	await new Promise((resolve) => setTimeout(resolve, 100));
	query.create({ data: { id: '1', body: {} } });
	await new Promise((resolve) => setTimeout(resolve, 100));
	query.update({ where: { id: '1', }, data: { body: { test: 1 } } });
	await new Promise((resolve) => setTimeout(resolve, 100));

	createEffect(() => {
		const secondMessage = query.get({ where: { id: '2' } });
		console.log(2, secondMessage);
	});

	// delete message
	query.delete({ where: { id: '1' } });

	// update message multiple times
	query.create({ data: { id: '2', body: {} } });
	await new Promise((resolve) => setTimeout(resolve, 100));
	query.update({ where: { id: '2', }, data: { body: { test: 2 } } });
	await new Promise((resolve) => setTimeout(resolve, 100));
	query.update({ where: { id: '2', }, data: { body: { test: 2 } } });
	await new Promise((resolve) => setTimeout(resolve, 100));
	query.update({ where: { id: '2', }, data: { body: { test: 2 } } });

	// get message before inserting it
	createEffect(() => {
		const xMessage = query.get({ where: { id: '12' } });
		console.log(12, xMessage);
	});

	plugin.readMessages()
	await new Promise((resolve) => setTimeout(resolve, 100));
};

createRoot(createApp);
