import { dedent } from "ts-dedent"
import { Node, type SourceFile } from "ts-morph"
import {
	addImport,
	isOptOutImportPresent,
	isSdkImportPresent,
	removeImport,
} from "../../ast-transforms/utils/imports.js"
import { wrapExportedFunction } from "../../ast-transforms/utils/wrap.js"
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import type { TransformConfig } from "../vite-plugin/config.js"
import type { Block } from 'ts-morph'
import { findOrCreateExport } from '../../ast-transforms/utils/exports.js'

// ------------------------------------------------------------------------------------------------

// TODO: test
const addImports = (
	sourceFile: SourceFile,
	config: TransformConfig,
	root: boolean,
	wrapperFunctionName: string,
) => {
	addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/shared", wrapperFunctionName)
	if (root && !config.languageInUrl) {
		addImport(sourceFile, "$app/environment", "browser")
		addImport(
			sourceFile,
			"@inlang/sdk-js/detectors/client",
			"initLocalStorageDetector",
			"navigatorDetector",
		)
	}
}

// ------------------------------------------------------------------------------------------------

// TODO: use ast transformation instead of string manipulation
// TODO: test
const getOptions = (config: TransformConfig, root: boolean) =>
	config.languageInUrl
		? "{}"
		: dedent`
			{
				initDetectors: browser
					? () => [initLocalStorageDetector(), navigatorDetector]
					: undefined
			}`

// ------------------------------------------------------------------------------------------------

export const _FOR_TESTING = {
	addImports,
	getOptions,
}

// ------------------------------------------------------------------------------------------------

export const transformLayoutJs = (
	filePath: string,
	config: TransformConfig,
	code: string,
	root: boolean,
) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code
	if (!root && !isSdkImportPresent(sourceFile)) return code

	const wrapperFunctionName = root ? "initRootLayoutLoadWrapper" : "initLoadWrapper"

	addImports(sourceFile, config, root, wrapperFunctionName)

	injectHotReloadCode(sourceFile)

	const options = root ? getOptions(config, root) : undefined
	wrapExportedFunction(sourceFile, options, wrapperFunctionName, "load")
	removeImport(sourceFile, "@inlang/sdk-js")

	return nodeToCode(sourceFile)
}

// ------------------------------------------------------------------------------------------------

const injectHotReloadCode = (sourceFile: SourceFile) => {
	addImport(sourceFile, "@inlang/sdk-js", "language")

	sourceFile.addVariableStatement({
		declarations: [{
			name: 'inlang_hmr_language',
			// type: 'string',
		}]
	})

	sourceFile.insertText(0, dedent`
		if (import.meta.hot) {
			import.meta.hot.on('inlang-messages-changed', async (data) => {
				// TODO: get actual language from somewhere
				if (inlang_hmr_language === data.languageTag)
					location.reload()
			})
		}
	`)

	const loadFn = findOrCreateExport(sourceFile, 'load', '() => { }')
	const block = findFunctionBodyBlock(loadFn)

	block.insertStatements(0, dedent`
		inlang_hmr_language = language
	`)
}

const findFunctionBodyBlock = (node: Node): Block => {
	if (Node.isSatisfiesExpression(node) || Node.isParenthesizedExpression(node)) {
		return findFunctionBodyBlock(node.getExpression())
	}
	if (Node.isCallExpression(node)) {
		return findFunctionBodyBlock(node.getArguments()[0]!)
	}

	if (Node.isVariableDeclaration(node)) {
		return findFunctionBodyBlock(node.getInitializer()!)
	}

	if (Node.isArrowFunction(node) || Node.isFunctionDeclaration(node)) {
		return node.getBody() as Block
	}

	throw new Error(`Could not find function body block for kind '${node.getKindName()}'.`)
}