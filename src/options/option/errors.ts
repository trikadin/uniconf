import util = require('util');
import $C = require('collection.js');
import { NormalizedParams } from './';
import { SourceName, SourceValues } from './sources';
import { flagName } from '../../core/argv';

const sourceExplanations: Record<SourceName, string> = {
	default: 'default value',
	env: 'from environment variable',
	cli: 'from command-line arguments'
};

function sourceInfo<T extends SourceName>(
	source: T,
	details: SourceValues[T],
	params: NormalizedParams,
	noValueWord?: boolean
): string {
	let res = '';

	switch (source) {
		case 'default':
			res = 'default';
			break;

		case 'env':
			res = `from environment variable ${(<SourceValues['env']>details).variable}`;
			break;

		case 'cli':
			const
				{flag} = <{flag: string}>details,
				flagFull = flagName(flag);

			res = params.valuesFlags && params.valuesFlags[flag] ?
				`set by the command-line flag ${flagFull}` :
				`from the command-line argument ${flagFull}`;
	}

	if (noValueWord) {
		return res;

	} else {
		return source === 'default' ? `${res} value` : `value ${res}`;
	}
}

/**
 * @internal
 */
export class CustomError extends Error {
	constructor(message: string, type?: string) {
		super(message);

		if (type) {
			this.name = type;
		}
	}
}

abstract class UniconfError extends Error {
	name: string = this.constructor.name;

	protected alignAndJoin(...lines: string[]): string {
		return $C(lines)
			.reduce((res, v: string) => (res.push(...v.split('\n')), res), [])
			.join('\n' + ' '.repeat(this.name.length + 2));
	}

	protected setStack(origin: any, exclude?: Function): void {
		let stack: string | undefined;
		const stackReg = /^\s+at /m;

		if ((origin instanceof Error) && origin.stack) {
			const index = origin.stack.search(stackReg);

			if (index !== -1) {
				stack = this.stack ?
					this.stack.slice(0, this.stack.search(stackReg)) :
					`${this.name}: ${this.message}`;
				stack += origin.stack.slice(index);
			}
		}

		if (stack) {
			this.stack = stack;

		} else {
			Error.captureStackTrace(this, exclude);
		}
	}
}

/**
 * @internal
 */
export class CoercionError extends UniconfError {
	static from<T extends SourceName>(
		origin: any,
		option: string,
		params: NormalizedParams,
		value: any,
		source: T,
		sourceDetails: SourceValues[T]
	): CoercionError {
		const
			error = new this(),
			message = [
				`option "${option}": failed to coerce the ${sourceInfo(source, sourceDetails, params)}`
			];

		if (origin instanceof Error) {
			message.push(`Reason: ${origin.message}`);
		}

		message.push(`Value: ${util.inspect(value)}`);

		error.message = error.alignAndJoin(...message);

		error.setStack(origin, this.from);

		return error;
	}

	private constructor() {
		super(...arguments);
	}
}

/**
 * @internal
 */
export class ValidationError extends UniconfError {
	constructor(option: string, value: any, source: SourceName, details?: string) {
		super(
			`option "${option}" fails validation${
				details ? ` because ${details}` : ''
			}. Value (${sourceExplanations[source]}): ${util.inspect(value)}`
		);
	}
}
