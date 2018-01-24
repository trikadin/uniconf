import $C = require('collection.js');
import { Dictionary, Values } from './types';
import { dict } from './';

const
	shortFlagRegExp = /^-[a-zA-Z]+$/,
	longFlagRegExp = /^-(?:-[a-z][a-z0-9]*)+$/,
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
	return Boolean(value && !shortFlagRegExp.test(value) && !longFlagRegExp.test(value));
}

const argvDict = Object.freeze($C(process.argv).reduce<ArgvDict>(
	(res: ArgvDict, arg: string, i: number, argv: string[]) => {
		if (shortFlagRegExp.test(arg)) {
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

		} else if (longFlagRegExp.test(arg)) {
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

	dict()
));

export function flagName(name: string): string {
	return `"-${name.length > 1 ? `-${name}` : name}"`;
}

export interface CliValue<T> {
	flag: string | null;
	value: T | null;
}

/**
 * Возвращает значение на основе аргументов командной строки.
 * Если в аргументах командной строки встретилось более одного из переданных флагов,
 * функция выбрасывает ошибку.
 *
 * @internal
 * @param flags - аргумент(ы) командной строки, значение которых надо получить.
 * @param [valuesFlags] - словарь значений.
 * Если ключ встречается в аргументах командной строки — функция вернёт соответствующее значение.
 */
export default function get<T extends {}>(
	flags: string | string[],
	valuesFlags: T
): CliValue<boolean | string | Values<T>>;

/**
 * @internal
 */
export default function get(
	flags: string | string[],
	valuesFlags?: Dictionary | null | undefined
): CliValue<boolean | string>;

export default function get(
	flags: string | string[],
	valuesFlags?: Dictionary | null | undefined
): CliValue<any> {
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
					}${other ? ` (also ${other})` : ''} shouldn't be set simultaneously`);
			}

			flag = f;
			value = v;
		}
	};

	$C(flags).forEach(assignValue);

	if (valuesFlags) {
		$C(valuesFlags).forEach((v, f) => assignValue(f, v));
	}

	return {flag, value};
}
