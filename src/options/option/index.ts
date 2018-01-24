import $C = require('collection.js');
import { Dictionary } from '../../core/types';
import builtinTypes from './types';
import sources, { SourceName, SourceValues } from './sources';
import * as validators from './validators';
import { ValidationError } from './errors';
import * as computed from '../computed';

export type SourceValue = SourceName | null;

export interface ValidateFn {
	(value: any, source: SourceName): boolean | string;
}

export interface BaseParams {
	required?: boolean;
	default?: any;
	short?: string;

	coerce?(value: any, source: SourceName): any;
}

/**
 * @internal
 */
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

function getValue(name: string, params: NormalizedParams): {
	source: SourceValue;
	value: any;
} {
	let
		value = null,
		source: SourceValue = null;

	for (let i = 0; i !== sources.length && !source; ++i) {
		value = sources[i].getter(params);

		if (value != null) {
			source = sources[i].name;
		}
	}

	if (source == null) {
		if (params.required) {
			console.log();
		}

		return {
			source: null,
			value: null
		};
	}

	if (typeof params.coerce === 'function') {
		try {
			value = params.coerce(value, source);

		} catch (error) {

		}
	}

	if (typeof params.validate === 'function') {
		const res = params.validate(value, source);

		if (res !== true) {
			console.log();
		}
	}

	return <any>null;
}
