import { NormalizedParams } from './';
import getCliValue from '../../core/argv';

export type SourceName = 'default' | 'env' | 'cli';

export interface Source {
	name: SourceName;
	getter(params: NormalizedParams): any;
}

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
		getter(params) {
			const {env} = params;

			return env && (env in process.env) ? process.env[env] : null;
		}
	},

	{
		name: 'default',
		getter(params) {
			return params.default;
		}
	}
];

export default sources;
