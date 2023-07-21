import { createInlang } from "../app/createInlang.js"
import type { LanguageTag } from "../languageTag.js"
import { unwrap, type Result } from "../result/type.js"
import type { Message } from "./schema.js"

type Filters = {
	id?: Message["id"] | Message["id"][]
	languageTag?: LanguageTag | LanguageTag[]
	//variant: string -> in the future
}

export type MessagesQueryApi_1 = {
	create: (args: { data: Message }) => Result<Message, Error>
	get: (args: { where: Filters }) => Result<Message[], Error>
	update: (args: { data: Partial<Message>; where: Filters }) => Result<Message, Error>
	upsert: (args: { data: Partial<Message>; where: Filters }) => Result<Message, Error>
	delete: (args: { where: Filters }) => [Message[], Error]
}

const inlang = createInlang({
	configPath: "/hello/inlang.config.json",
	env: { fs: undefined as any, import: undefined as any },
})

// create
const message1 = inlang.messages.query.create({
	data: {
		id: "myMessageId",
		languageTag: "en",
		pattern: [{ type: "Text", value: "Hello World" }],
	},
})

// ------ GET ------

// -- single message

const maybeSingleMessage = unwrap(
	inlang.messages.query.get({
		where: { id: "myMessageId", languageTag: "en" },
	}),
)

if (maybeSingleMessage.length !== 1) {
	throw new Error("Expected one message")
}

const myMessage = maybeSingleMessage[0]

// -- multiple messages

const multipleMessages = unwrap(
	inlang.messages.query.get({
		where: { languageTag: ["en", "de", "fr", "es"] },
	}),
)

const germanMessages = unwrap(
	inlang.messages.query.get({
		where: { languageTag: "de" },
	}),
)

// ------ UPDATE ------

const updatedMessage = unwrap(
	inlang.messages.query.update({
		data: { pattern: [{ type: "Text", value: "Hello World" }] },
		where: { id: "myMessageId", languageTag: "en" },
	}),
)

const message3 = inlang.messages.query.update()

const message4 = inlang.messages.query.upsertMany([
	{
		id: "myMessageId",
		languageTag: "en",
		pattern: [{ type: "Text", value: "Hello World" }],
	},
	{
		id: "myMessageId",
		languageTag: "en",
		pattern: [{ type: "Text", value: "Hello World" }],
	},
])

const message5 = inlang.messages.query.delete({ where: { id: "myMessageId", languageTag: "en" } })
