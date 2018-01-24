import $C = require('collection.js');
import { dict, stringTestDict } from './';

export const
	posixPlatforms = stringTestDict(
		'aix',
		'android',
		'darwin',
		'freebsd',
		'linux',
		'openbsd',
		'sunos',
		'cygwin'
	),

	nonPosixPlatforms = stringTestDict('win32'),

	platforms = dict(posixPlatforms, nonPosixPlatforms),

	platformUnions = stringTestDict('posix', 'default'),

	platformKeys = dict(platforms, platformUnions);

export type PosixPlatform = keyof (typeof posixPlatforms);

export type NonPosixPlatform = keyof (typeof nonPosixPlatforms);

export type Platform = keyof (typeof platforms);

export type PlatformUnion = keyof (typeof platformUnions);

export type PlatformKey = keyof (typeof platformKeys);

export function isPlatform(value: any): value is Platform {
	return value in platforms;
}

export function isPosixPlatform(value: any): value is PosixPlatform {
	return value in posixPlatforms;
}

export function isPlatformKey(value: any): value is PlatformKey {
	return value in platformKeys;
}

export function isPlatformKeysMatch(key1: 'default', key2: PlatformKey): true;
export function isPlatformKeysMatch(key1: PlatformKey, key2: 'default'): true;

export function isPlatformKeysMatch(key1: 'posix', key2: PlatformKey): key2 is PlatformUnion | PosixPlatform;
export function isPlatformKeysMatch(key1: PlatformKey, key2: 'posix'): key1 is PlatformUnion | PosixPlatform;

export function isPlatformKeysMatch<T extends Platform, U extends T>(key1: T, key2: U): key1 is U;
export function isPlatformKeysMatch<T extends Platform, U extends T>(key1: U, key2: T): key2 is U;

export function isPlatformKeysMatch<T extends NonPosixPlatform>(key1: T, key2: PlatformKey): key2 is T | 'default';
export function isPlatformKeysMatch<T extends NonPosixPlatform>(key1: PlatformKey, key2: T): key1 is T | 'default';

export function isPlatformKeysMatch<T extends Platform>(key1: T, key2: PlatformKey): key2 is T | PlatformUnion;
export function isPlatformKeysMatch<T extends Platform>(key1: PlatformKey, key2: T): key1 is T | PlatformUnion;

export function isPlatformKeysMatch(key1: PlatformKey, key2: PlatformKey): boolean;
export function isPlatformKeysMatch(key1: PlatformKey, key2: PlatformKey): boolean {
	if (key1 === key2 || !isPlatform(key1) && !isPlatform(key2)) {
		return true;
	}

	if (!isPlatform(key2)) {
		const temp = key2;
		key2 = key1;
		key1 = temp;
	}

	return key1 === 'default' || key1 === 'posix' && isPosixPlatform(key2);
}

export type PlatformSpec<T = any> = {
	[K in PlatformKey]?: T;
};

export type PosixDict<T = any> = {
	[K in PosixPlatform]: T;
};

export type NonPosixDict<T = any> = {
	[K in NonPosixPlatform]: T;
};

export type PlatformDict<T = any> = {
	[K in Platform]: T;
};

export function validate(value: any): value is PlatformSpec {
	return (typeof value === 'object') && Object.keys(value).every(isPlatform);
}

export function getValue<T>(spec: PlatformSpec<T>, platform: Platform): T | null {
	let value = spec[platform];

	if (value == null && isPosixPlatform(platform)) {
		value = spec.posix;
	}

	if (value == null) {
		value = spec.default;
	}

	return value == null ? null : value;
}

export function normalize<D>(value: {default: D}): PlatformDict<D>;

export function normalize<P>(value: {posix: P}): PosixDict<P> & NonPosixDict<null>;

export function normalize<P, D>(
	value: {
		default: D;
		posix: P;
	}
): NonPosixDict<D> & PosixDict<P>;

export function normalize<T, P, D>(
	value: {
		default: D;
		posix: P;
	} & {[K in Platform]?: T}
): NonPosixDict<T | D> & PosixDict<T | P>;
export function normalize<T, P>(
	value: {
		default?: null | undefined;
		posix: P;
	} & {[K in Platform]?: T}
): NonPosixDict<T | null> & PosixDict<T | P>;
export function normalize<T, D>(
	value: {
		default: D;
		posix?: null | undefined;
	} & {[K in Platform]?: T}
): PlatformDict<T | D>;
export function normalize<T>(
	value: {[K in Platform]?: T}
): PlatformDict<T | null>;
export function normalize<T>(value: PlatformSpec<T>): PlatformDict<T> {
	return $C(platforms).reduce(
		(res, v, key: Platform) => {
			res[key] = getValue(value, key);
			return res;
		},

		<any>{}
	);
}
