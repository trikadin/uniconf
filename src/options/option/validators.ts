import joi = require('joi');
import builtinTypes from './types';
import { Params } from './';

const
	flagRegExp = /^[a-z](?:(?:-[a-z])?[a-z0-9]?)*$/,
	flagSchema = joi.string().regex(flagRegExp, 'flag name');

const nameSchema = joi.string().regex(flagRegExp, 'name');

const paramsSchema = joi.object({
	required: joi.boolean(),

	default: joi.any().default(null),

	argv: joi.alternatives(flagSchema.min(1), joi.boolean()).default(true),

	env: joi.alternatives(joi.string().min(1), joi.boolean()).default(true),

	short: joi
		.string()
		.min(1)
		.max(1)
		.regex(/^[a-z]$/i, 'short flag name'),

	type: joi.valid(Object.keys(builtinTypes)),

	valuesFlags: joi.alternatives(
		joi.array().items(flagSchema),
		joi.object().pattern(flagRegExp, joi.any()).unknown(false)
	),

	coerce: joi.func(),

	validate: joi.alternatives(
		joi.func(),
		joi.object().type(RegExp),
		joi.array()
	)
}).nand('required', 'default').unknown(false);

const validateOptions: joi.ValidationOptions = {
	convert: false
};

function wrap<T>(schema: joi.AnySchema): (value: T) => T {
	return (value) => {
		const res = schema.validate(value, validateOptions);

		if (res.error) {
			throw res.error;
		}

		return res.value;
	};
}

export const
	name = wrap<string>(nameSchema),
	params = wrap<Params>(paramsSchema);