import $C = require('collection.js');
import { Dictionary } from '../../core/types';
import builtinTypes from './types';
import sources, { SourceName } from './sources';
import * as validators from './validators';
import * as computed from '../computed';

export interface ValidateFn {
	(value: any, source: SourceName | null): boolean | string;
}

export interface BaseParams {
	required?: boolean;
	default?: any;
	short?: string;

	coerce?(value: any, source: SourceName | null): any;
}

export interface NormalizedParams extends BaseParams {
	argv?: string;
	env?: string;
	valuesFlags?: Readonly<Dictionary>;
	validate?: ValidateFn
}

export interface Params extends BaseParams {
	argv?: boolean | string;
	env?: boolean | string;
	type?: string;
	valuesFlags?: string[] | Dictionary;
	validate?: ValidateFn | RegExp | any[];
}

function normalizeParams(name: string, params: Params = {}): NormalizedParams {
	validators.name(name);

	const normParams = validators.params(params);

	if (normParams.type) {
		$C.extend({traits: true}, normParams, builtinTypes[normParams.type]);
		delete normParams.type;
	}

	if (normParams.argv === true) {
		normParams.argv = name;

	} else if (typeof normParams.argv !== 'string') {
		delete normParams.argv;
	}

	if (normParams.env === true) {
		normParams.env = name.toUpperCase().replace(/-/g, '_');

	} else if (typeof normParams.env !== 'string') {
		delete normParams.env;
	}

	if (normParams.valuesFlags) {
		if (Array.isArray(normParams.valuesFlags)) {
			normParams.valuesFlags = $C(normParams.valuesFlags).reduce(
				(res, k) => (res[k] = k, res),
				{}
			);
		}

		Object.freeze(normParams.valuesFlags);
	}

	const {validate} = normParams;

	if (validate && !(typeof validate === 'function')) {
		if (validate instanceof RegExp) {
			normParams.validate = (value) => validate.test(value);

		} else if (Array.isArray(validate)) {
			normParams.validate = (value) => validate.includes(value);
		}
	}

	return <NormalizedParams>normParams;
}

interface ExtendOptions {
	mergeValuesFlags?: boolean;
}

function extend(target: NormalizedParams, parent: NormalizedParams, options: ExtendOptions = {}): void {
	return;
}

function getValue(params: NormalizedParams): {
	source: SourceName | null;
	value: any;
} {
	let
		value = null,
		source: SourceName | null = null;

	for (let i = 0; i !== sources.length && value == null; ++i) {
		source = sources[i].name;
		value = sources[i].getter(params);
	}

	return value == null ? {
		source: null,
		value: null
	} : {
		source,
		value: (typeof params.coerce === 'function' ? params.coerce(value, source) : value)
	};
}
