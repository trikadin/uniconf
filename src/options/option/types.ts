import { NormalizedParams } from './';
import { Dictionary } from '../../core/types';

function numberCoerce(val: any): any {
	const coercedVal = Number(val);
	return Number.isFinite(coercedVal) ? coercedVal : val;
}

const
	invalidJson = Symbol('invalid JSON'),
	portMaxValue = 2 ** 16; // tslint:disable-line:no-magic-numbers

// tslint:disable:typedef
const types: Dictionary<NormalizedParams> = {
	boolean: {
		coerce(value) {
			if (typeof value === 'string') {
				value = value.trim();

				if (!value || /^(?:false|off)$/i.test(value)) {
					return false;
				}

				return /^(?:true|on)$/i.test(value) || value;
			}

			return Boolean(value);
		},

		validate(value) {
			return typeof value === 'boolean';
		}
	},

	number: {
		coerce: numberCoerce,
		validate: Number.isFinite
	},

	integer: {
		coerce: numberCoerce,
		validate: Number.isInteger
	},

	port: {
		default: 8080,
		argv: 'port',
		short: 'p',
		env: 'PORT',
		coerce: numberCoerce,
		validate(value) {
			return Number.isInteger(value) && value > 0 && value < portMaxValue ||
				`port value should be an integer greater than 0 and lower than ${portMaxValue}`;
		}
	},

	json: {
		coerce(value) {
			if (typeof value === 'string') {
				try {
					return JSON.parse(value);

				} catch (_) {
					return invalidJson;
				}
			}

			return value;
		},

		validate(value) {
			return (value !== invalidJson) || 'value should be a valid JSON';
		}
	}
};

export default types;
