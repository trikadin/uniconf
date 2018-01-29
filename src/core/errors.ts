import $C = require('collection.js');

export class UniconfError extends Error {
	static createCustom(
		message: string | string[],
		exclude: Function = this.createCustom,
		origin?: any,
		type: string = this.name
	): UniconfError {
		const error = Object.create(this.prototype);

		error.name = type;
		error.setMessage(message);
		error.setStack(origin, exclude);

		return error;
	}

	name: string = this.constructor.name;

	protected alignAndJoin(...lines: string[]): string {
		return $C(lines)
			.reduce((res, v: string) => (res.push(...v.split('\n')), res), [])
			.join('\n' + ' '.repeat(this.name.length + 2));
	}

	protected setMessage(message: string | string[]): void {
		this.message = this.alignAndJoin(...(Array.isArray(message) ? message : [message]));
	}

	protected setStack(origin?: any, exclude: Function = this.constructor): void {
		this.stack = undefined;

		if ((origin instanceof Error) && origin.stack) {
			const index = origin.stack.search(/^\s+at /m);

			if (index !== -1) {
				this.stack = `${this.name}: ${this.message}` + origin.stack.slice(index);
			}
		}

		if (!this.stack) {
			Error.captureStackTrace(this, exclude);
		}
	}
}

export class ConfigLoadingError extends UniconfError {
	constructor(path: string, origin: NodeJS.ErrnoException | string) {
		super();

		const message = [`Failed to load ${JSON.stringify(path)}.`];

		let reason = '';

		if (typeof origin === 'string') {
			reason = origin;

		} else if (origin instanceof Error) {
			reason = origin.message;

			if (origin.syscall) {
				const index = reason.indexOf(origin.syscall);

				if (index !== -1) {
					reason = reason.slice(0, index).trimRight().replace(/,$/, '');
				}
			}
		}

		if (reason) {
			message.push(`Reason: ${reason.trim()}`);
		}

		this.setMessage(message);
		this.setStack(origin);
	}
}
