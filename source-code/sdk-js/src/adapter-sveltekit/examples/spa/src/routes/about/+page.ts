import { initLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { PageLoad } from "./$types.js"

export const load = initLoadWrapper<PageLoad>().use(async (_, { i }) => {
	console.info("about/+page.ts", i("welcome"))
})
