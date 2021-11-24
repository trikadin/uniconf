'use strict';

function isFlag(str) {
	return /^--?[\S]+$/.test(str);
}

function parseArgs(argv) {
	return argv.reduce((parsed, arg, i, argv) => {
		if (isFlag(arg)) {
			const next = argv[i + 1];

			let value;

			if (next && !isFlag(next)) {
				value = next;

			} else {
				value = !/^--no-/.test(arg);
			}

			if (arg === '--env') {
				const [envArg, envVal] = value.split('=');
				parsed[envArg] = envVal;

			} else {
				parsed[arg.replace(/^--?(?:no-)?/, '')] = value;
			}
		}

		return parsed;
	}, {});
}

module.exports = parseArgs;
