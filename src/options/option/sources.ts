import { NormalizedParams } from './';
import getCliValue from '../../core/argv';
import { Values } from '../../core/types';

export interface SourceValues {
	default: {};
	cli: {
		flag: string | null;
	},
	env: {
		variable: string | null;
	}
}

export type SourceName = keyof SourceValues;

export type Source = Values<{
	[T in SourceName]: {
		name: T;
		getter(params: NormalizedParams): SourceValues[T] & {value: any};
	}
}>;

// tslint:disable:typedef
const sources: Source[] = [
	{
		name: 'cli',
		getter(params) {
			const
				{argv, short, valuesFlags} = params,
				flags = [];

			if (argv) {
				flags.push(argv);
			}

			if (short) {
				flags.push(short);
			}

			return getCliValue(flags, valuesFlags);
		}
	},

	{
		name: 'env',
		getter({env}) {
			const value = env && (env in process.env) ? process.env[env] : null;
			return {
				value,
				variable: value !== null ? <string>env : null
			};
		}
	},

	{
		name: 'default',
		getter({default: value}) {
			return {value};
		}
	}
];

export default sources;
