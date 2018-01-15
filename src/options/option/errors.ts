import util = require('util');

const prefix = 'Uniconf:';

import { SourceName } from './sources';

const sourceExplanations: Record<SourceName, string> = {
	default: 'default value',
	env: 'from environment variable',
	cli: 'from command-line arguments'
};

export class ValidationError extends Error {
	name: string = `${prefix} ValidationError`;

	constructor(option: string, value: any, source: SourceName, details?: string) {
		super(
			`option "${option}" fails validation${
				details ? ` because ${details}` : ''
			}. Value (${sourceExplanations[source]}): ${util.inspect(value)}`
		);
	}
}
