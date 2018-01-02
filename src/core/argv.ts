import $C = require('collection.js');
import { Dictionary, Values } from './types';

const
	shortFlagReg = /^-[a-zA-Z]+$/,
	longFlagReg = /^-(?:-[a-z][a-z0-9]*)+$/,
	inverseFlagPrefix = 'no-';

type Argv = boolean | string;
type ArgvDict = Dictionary<Argv>;

function setArgv(dict: ArgvDict, argv: string, value: Argv = true): void {
	if (argv in dict) {
		throw new Error(`Command line argument "${argv}" is set more than once`);
	}

	dict[argv] = value;
}

function isValue(value: string | null | undefined): boolean {
	return Boolean(value && !shortFlagReg.test(value) && !longFlagReg.test(value));
}

const argvDict = Object.freeze($C(process.argv).reduce<ArgvDict>(
	(res: ArgvDict, arg: string, i: number, argv: string[]) => {
		if (shortFlagReg.test(arg)) {
			const
				flags = arg.slice(1),
				next = argv[i + 1];

			if (flags.length === 1 && isValue(next)) {
				setArgv(res, flags, next);

			} else {
				$C(flags).forEach((flag: string) => {
					setArgv(res, flag);
				});
			}

		} else if (longFlagReg.test(arg)) {
			const
				flag = arg.slice(2),
				next = argv[i + 1];

			if (isValue(next)) {
				setArgv(res, flag, next);

			} else {
				setArgv(res, flag, true);

				if (flag.indexOf(inverseFlagPrefix) === 0) {
					setArgv(res, flag.slice(inverseFlagPrefix.length), false);
				}
			}
		}

		return res;
	},

	Object.create(null)
));

function flagName(name: string): String {
	return `"-${name.length > 1 ? `-${name}` : name}"`;
}

/**
 * Возвращает значение на основе аргументов командной строки.
 * Если входным данным соответствует несколько значений — выбрасывает ошибку.
 *
 * @param flags - аргумент(ы) командной строки, значение которых надо получить.
 * @param [valuesFlags] - словарь значений.
 * Если ключ встречается в аргументах командной строки — функция вернёт соответствующее значение.
 */
export default function get<T extends object>(flags: string | string[], valuesFlags: T): boolean | string | Values<T> | null;
export default function get(flags: string | string[]): boolean | string | null;
export default function get(flags: string | string[], valuesFlags?: Dictionary): any {
	if (!Array.isArray(flags)) {
		flags = [flags];
	}

	let
		flag: string | null = null,
		value: any = null;

	const assignValue = (f: string, v: any = argvDict[f]) => {
		if (f in argvDict) {
			if (flag !== null) {
				const
					other = (<string[]>flags)
						.concat(valuesFlags ? Object.keys(valuesFlags) : [])
						.filter((v) => v !== f && v !== flag)
						.map(flagName)
						.reduce((res, v, i, data) => `${res}${i ? `${i === data.length - 1 ? ' and' : ','} ${v}` : v}`, '');

				throw new Error(
					`Multiple possible values: command line arguments ${
						flagName(flag)
					} and ${
						flagName(f)
					} ${other ? `(also ${other}) ` : ''}shouldn't be set at `);
			}

			flag = f;
			value = v;
		}
	};

	$C(flags).forEach(assignValue);

	if (valuesFlags) {
		$C(valuesFlags).forEach((v, f) => assignValue(f, v));
	}

	return value;
}
