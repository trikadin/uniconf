import $C = require('collection.js');
import { Dictionary } from './types';

const
	shortFlagReg = /^-[a-zA-Z]+$/,
	longFlagReg = /^-(?:-[a-z][a-z0-9]*)+$/,
	inverseFlagPrefix = 'no-';

type Argv = boolean | string;
type ArgvDict = Readonly<Dictionary<Argv>>;

function setArgv(dict: Dictionary<Argv>, argv: string, value: Argv = true): void {
	if (argv in dict) {
		throw new Error(`Command line argument "${argv}" is set more than once`);
	}

	dict[argv] = value;
}

function isValue(value: string | null | undefined): boolean {
	return Boolean(value && !shortFlagReg.test(value) && !longFlagReg.test(value));
}

const argvDict: ArgvDict = Object.freeze($C(process.argv).reduce<Dictionary<Argv>>(
	(res: Dictionary<Argv>, arg: string, i: number, argv: string[]) => {
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

	{}
));
