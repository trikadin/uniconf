import { NormalizedParams } from './';
import { Dictionary } from '../../core/types';

function numberCoerce(val: any): any {
	const coercedVal = Number(val);
	return Number.isFinite(coercedVal) ? coercedVal : val;
}

const enum portRange {
	min = 0,
	max = 65536
}

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
			return Number.isInteger(value) && value > portRange.min && value < portRange.max ||
				`port value should be an integer greater than ${portRange.min} and lower than ${portRange.max}`;
		}
	},

	json: {
		coerce(value) {
			if (typeof value === 'string') {
				return JSON.parse(value);
			}

			return value;
		}
	}
};

export default types;
