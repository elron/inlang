import { language } from '@inlang/sdk-js'

/* This file was created by inlang.
It is needed in order to circumvent a current limitation of SvelteKit. See https://github.com/inlang/inlang/issues/647
You can remove this comment and modify the file as you like. We just need to make sure it exists.
Please do not delete it (inlang will recreate it if needed). */

/**
 * @type {string | undefined}
 */
let loadedLanguage = undefined
export const load = () => {
	loadedLanguage = language
}

if (import.meta.hot) {
	import.meta.hot.on('inlang-messages-changed', async (data) => {
		// TODO: get actual language from somewhere
		if (loadedLanguage === data.languageTag)
			location.reload()
	})
}