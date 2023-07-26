// @ts-ignore
import * as Solid from 'solid-js/dist/solid.js'
const { createEffect, createSignal, createMemo, createRoot } = Solid as typeof import('solid-js');
import type { Accessor, Signal } from 'solid-js';
import type { Message } from './messages/schema.js';
import { Store, createStore } from '../../../node_modules/solid-js/store/dist/store.js';

export type MessageQueryApi = {
	create: (args: { data: Message }) => void
	get: (args: { where: { id: Message["id"] } }) => Accessor<Message | undefined>
	update: (args: { where: { id: Message["id"] }; data: Partial<Message> }) => void
	upsert: (args: { where: { id: Message["id"] }; data: Message }) => void
	delete: (args: { where: { id: Message["id"] } }) => void
}

export function createQuery(store: ReturnType<typeof createStore<{ m: Message[] }>>): MessageQueryApi {
	const [value, setStore] = store

	return {
		// query
		get: ({ where }) => {
			return createMemo(
				() => value.m.find(({ id }) => id === where.id),
				undefined,
				{
					equals: (a, b) => JSON.stringify(a) === JSON.stringify(b)
				}
			)
		},
		// mutation
		create: ({ data }) => {
			setStore('m', ({ id }) => id === data.id, data);
		},
		update: ({ where, data }) => {
			setStore('m', ({ id }) => id === where.id, data);
		},
		upsert: ({ where, data }) => {
			// const message = value().find(({ id }) => id === where.id);
			// if (message === undefined) {
			// 	setStore([...value(), data]);
			// } else {
			// 	setStore(
			// 		value().map((m) => (m.id === where.id ? { ...m, ...data } : m))
			// 	);
			// }
		},
		delete: ({ where }) => {
			setStore('m', ({ id }) => id === where.id, undefined);
		},
	};
}

const createPlugin = () => {
	const store = createStore<{ m: Message[] }>({ m: [] });
	const [value, setStore] = store

	return {
		store,
		readMessages: () => setStore('m', [...value, { id: '12', body: {} }]),
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
					if (x() === undefined) {
						return false
					}

					return x() >= '10'
				},
				undefined,
				{
					equals: (a, b) => JSON.stringify(a) === JSON.stringify(b)
				}
			)
		},
	}
}

const createApp = async () => {
	const plugin = createPlugin()
	const query = createQuery(plugin.store);
	const lints = createLint(query)

	const xLint = lints.get({ where: { id: '12' } });
	createEffect(() => {
		console.log('x', xLint());
	});

	// createEffect(() => {
	// 	console.log(0, plugin.messagesSignal[0]());
	// });

	const firstMessage = query.get({ where: { id: '1' } });
	createEffect(() => {
		console.log(1, firstMessage());
	});

	await new Promise((resolve) => setTimeout(resolve, 100));
	query.create({ data: { id: '1', body: {} } });
	await new Promise((resolve) => setTimeout(resolve, 100));
	query.update({ where: { id: '1', }, data: { body: { test: 1 } } });
	await new Promise((resolve) => setTimeout(resolve, 100));

	const secondMessage = query.get({ where: { id: '2' } });
	createEffect(() => {
		console.log(2, secondMessage());
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
	const xMessage = query.get({ where: { id: '12' } });
	createEffect(() => {
		console.log(12, xMessage());
	});

	plugin.readMessages()
	await new Promise((resolve) => setTimeout(resolve, 100));

};

createRoot(createApp);
