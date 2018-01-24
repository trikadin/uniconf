import { PlatformKey, isPosixPlatform, isPlatformKeysMatch } from './platform';
import { ValidationResult } from './types';
import { dict, stringTestDict } from './';

const wellKnown = {
	win32: stringTestDict(
		'=C:',
		'=D:',
		'=EXITCODE',
		'=EXITCODEASCII',
		'ALLUSERSPROFILE',
		'APPDATA',
		'CD',
		'CLIENTNAME',
		'CMDCMDLINE',
		'CMDEXTVERSION',
		'COMMONPROGRAMFILES',
		'COMMONPROGRAMFILES(X86)',
		'COMMONPROGRAMW6432',
		'COMPUTERNAME',
		'COMSPEC',
		'DATE',
		'DPATH',
		'ERRORLEVEL',
		'FIRMWARE_TYPE',
		'FPS_BROWSER_APP_PROFILE_STRING',
		'FPS_BROWSER_USER_PROFILE_STRING',
		'HIGHESTNUMANODENUMBER',
		'HOMEDRIVE',
		'HOMEPATH',
		'HOMESHARE',
		'KEYS',
		'LOCALAPPDATA',
		'LOGONSERVER',
		'NTVERSION',
		'NUMBER_OF_PROCESSORS',
		'OS',
		'PATH',
		'PATHEXT',
		'PROCESSOR_ARCHITECTURE',
		'PROCESSOR_ARCHITEW6432',
		'PROCESSOR_IDENTIFIER',
		'PROCESSOR_LEVEL',
		'PROCESSOR_REVISION',
		'PROGRAMDATA',
		'PROGRAMFILES',
		'PROGRAMFILES(X86)',
		'PROGRAMW6432',
		'PROMPT',
		'PSEXECUTIONPOLICYPREFERENCE',
		'PSMODULEPATH',
		'PUBLIC',
		'RANDOM',
		'SESSIONNAME',
		'SYSTEMDRIVE',
		'SYSTEMROOT',
		'TEMP',
		'TIME',
		'TMP',
		'USERDNSDOMAIN',
		'USERDOMAIN',
		'USERDOMAIN_ROAMINGPROFILE',
		'USERNAME',
		'USERPROFILE',
		'WINDIR',
		'__APPDIR__',
		'__CD__',
		'__COMPAT_LAYER'
	),

	posix: stringTestDict(
		'ARFLAGS',
		'CC',
		'CDPATH',
		'CFLAGS',
		'CHARSET',
		'COLUMNS',
		'DATEMSK',
		'DEAD',
		'EDITOR',
		'ENV',
		'EXINIT',
		'FC',
		'FCEDIT',
		'FFLAGS',
		'GET',
		'GFLAGS',
		'HISTFILE',
		'HISTORY',
		'HISTSIZE',
		'HOME',
		'IFS',
		'LANG',
		'LC_ALL',
		'LC_COLLATE',
		'LC_CTYPE',
		'LC_MESSAGES',
		'LC_MONETARY',
		'LC_NUMERIC',
		'LC_TIME',
		'LDFLAGS',
		'LEX',
		'LFLAGS',
		'LINENO',
		'LINES',
		'LISTER',
		'LOGNAME',
		'LPDEST',
		'MAIL',
		'MAILCHECK',
		'MAILER',
		'MAILPATH',
		'MAILRC',
		'MAKEFLAGS',
		'MAKESHELL',
		'MANPATH',
		'MBOX',
		'MORE',
		'MSGVERB',
		'NLSPATH',
		'NPROC',
		'OLDPWD',
		'OPTARG',
		'OPTERR',
		'OPTIND',
		'PAGER',
		'PATH',
		'PPID',
		'PRINTER',
		'PROCLANG',
		'PROJECTDIR',
		'PS1',
		'PS2',
		'PS3',
		'PS4',
		'PWD',
		'RANDOM',
		'SECONDS',
		'SHELL',
		'TERM',
		'TERMCAP',
		'TERMINFO',
		'TMPDIR',
		'TZ',
		'USER',
		'VISUAL',
		'YACC',
		'YFLAGS'
	)
};

const regexps = {
	safe: /^[a-z_][a-z0-9_]*$/i,
	posixDisallowed: /[^\t-<>-~]/,
	win32Disallowed: /[^A-Za-z0-9#$'()*+,\-.?@[\]_`{}~]/
};

function charExplanation(char: string): string {
	const code = char.charCodeAt(0);
	return `${JSON.stringify(char)} (code: ${code}, hex: 0x${
		code.toString(16) // tslint:disable-line:no-magic-numbers
	})`;
}

function badCharReason(name: string, index: number, platform: PlatformKey): string {
	let res = `invalid character ${charExplanation(name[index])} at index ${index}. `;

	if (isPlatformKeysMatch('posix', platform)) {
		res += 'Valid characters in POSIX-compliant OS are in range from \\u0009 ("\\t") to \\u007e ("~"), ' +
			'exclude \\u003d ("=").';
	}

	if (isPlatformKeysMatch('win32', platform)) {
		res += 'Valid characters in OS Windows are alphanumerics and #$\'()*+,-.?@[]_`{}~';
	}

	return res;
}

export function validateEnvName(name: string, platform: PlatformKey): ValidationResult {
	let result: ValidationResult = true;

	if (regexps.safe.test(name)) {
		return true;

	} else {
		result = {
			type: 'warning',
			reason: 'name of environment variable contains some allowed but non-safe characters.' +
			"While it's not an error, it's non-recommended because of lack of support in shell-executors." +
			'A safe name should consist of alphanumerics and the underscore ([A-Za-z0-9_]) ' +
			"and shouldn't start with a digit."
		};
	}

	if (isPlatformKeysMatch('posix', platform)) {
		if (name in wellKnown.posix) {
			result = {
				type: 'warning',
				reason: `environment variable "${name}" is reserved in POSIX-compliant OS`
			};

		} else {
			const index = name.search(regexps.posixDisallowed);

			if (index !== -1) {
				return {
					type: 'error',
					reason: badCharReason(name, index, platform)
				};

			}
		}
	}

	if (isPlatformKeysMatch('win32', platform)) {
		if (name.toUpperCase() in wellKnown.win32) {
			result = {
				type: 'warning',
				reason: `environment variable "${name}" is reserved in OS Windows`
			};

		} else {
			const index = name.search(regexps.win32Disallowed);

			if (index !== -1) {
				return {
					type: 'error',
					reason: badCharReason(name, index, platform)
				};
			}
		}
	}

	return result;
}
