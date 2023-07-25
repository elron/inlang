import { describe, expect, test } from "vitest"
import { dedent } from "ts-dedent"
import { initTransformConfig } from "./test.utils.js"
import { transformLayoutJs } from "./+layout.js.js"

// TODO: create test matrix for all possible combinations

describe("transformLayoutJs", () => {
	describe("root", () => {
		describe("empty file", () => {
			test("lang-in-slug", () => {
				const code = ""
				const config = initTransformConfig({ languageInUrl: true })
				const transformed = transformLayoutJs("", config, code, true)

				expect(transformed).toMatchInlineSnapshot(`
					"if (import.meta.hot) {
					    import.meta.hot.on('inlang-messages-changed', async (data) => {
					        // TODO: get actual language from somewhere
					        if (inlang_hmr_language === data.languageTag)
					            location.reload();
					    });
					}
					import { initRootLayoutLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/shared';
					let inlang_hmr_language;
					export const load = initRootLayoutLoadWrapper({}).use((_, { language }) => {
					    inlang_hmr_language = language;
					});"
				`)
			})

			test("spa", () => {
				const code = ""
				const config = initTransformConfig()
				const transformed = transformLayoutJs("", config, code, true)

				expect(transformed).toMatchInlineSnapshot(`
					"if (import.meta.hot) {
					    import.meta.hot.on('inlang-messages-changed', async (data) => {
					        // TODO: get actual language from somewhere
					        if (inlang_hmr_language === data.languageTag)
					            location.reload();
					    });
					}
					import { initLocalStorageDetector, navigatorDetector } from '@inlang/sdk-js/detectors/client';
					import { browser } from '$app/environment';
					import { initRootLayoutLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/shared';
					let inlang_hmr_language;
					export const load = initRootLayoutLoadWrapper({
					    initDetectors: browser
					        ? () => [initLocalStorageDetector(), navigatorDetector]
					        : undefined
					}).use((_, { language }) => {
					    inlang_hmr_language = language;
					});"
				`)
			})
		})

		test("basic load function", () => {
			const code = dedent`
				export const load = async () => { };
			`
			const config = initTransformConfig({ languageInUrl: true })
			const transformed = transformLayoutJs("", config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"if (import.meta.hot) {
				    import.meta.hot.on('inlang-messages-changed', async (data) => {
				        // TODO: get actual language from somewhere
				        if (inlang_hmr_language === data.languageTag)
				            location.reload();
				    });
				}
				import { initRootLayoutLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/shared';
				export const load = initRootLayoutLoadWrapper({}).use(async (_, { language }) => {
				    inlang_hmr_language = language;
				});
				let inlang_hmr_language;"
			`)
		})
	})

	describe("non-root", () => {
		test("should not do anything", () => {
			const code = ""
			const config = initTransformConfig()
			const transformed = transformLayoutJs("", config, code, false)
			expect(transformed).toEqual(code)
		})
	})

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = "import '@inlang/sdk-js/no-transforms'"
		const config = initTransformConfig()
		const transformed = transformLayoutJs("", config, code, true)
		expect(transformed).toEqual(code)
	})

	test.only("should transform '@inlang/sdk-js' imports correctly", () => {
		const transformed = transformLayoutJs(
			"",
			initTransformConfig(),
			dedent`
				import { languages } from '@inlang/sdk-js'
				import type { LayoutLoad } from '@sveltejs/kit'

				export const load = async (() => {
					return { languages }
				}) satisfies LayoutLoad
			`,
			false,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"if (import.meta.hot) {
			    import.meta.hot.on('inlang-messages-changed', async (data) => {
			        // TODO: get actual language from somewhere
			        if (inlang_hmr_language === data.languageTag)
			            location.reload();
			    });
			}
			import { initLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/shared';
			import type { LayoutLoad } from '@sveltejs/kit';
			export const load = initLoadWrapper().use(async((_, { languages, language }) => {
			    inlang_hmr_language = language;
			    return { languages };
			}) satisfies LayoutLoad);
			let inlang_hmr_language;"
		`)
	})
})
