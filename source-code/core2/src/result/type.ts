// eslint-disable-next-line @typescript-eslint/ban-types
export type NonNullish = Exclude<{}, null>

export type SuccessResult<Data> = Data extends void | undefined ? never : [Data, undefined?]

export type ExceptionResult<Exception> = [undefined, Exception]

export type Result<Data extends NonNullish, Exception extends NonNullish> =
	| SuccessResult<Data>
	| ExceptionResult<Exception>

export function unwrap<Data extends NonNullish, Exception extends NonNullish>(
	result: Result<Data, Exception>,
): Data {
	if (result[1] !== undefined) {
		throw result[1]
	}

	return result[0] as Data
}
