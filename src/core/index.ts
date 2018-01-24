import { Dictionary } from './types';

/**
 * Возвращает объект с нулевым прототипом
 * @param source - объекты, свойства которых надо добавить в возвращаемый объект (передаются в Object.assign)
 */
export function dict<T extends {}>(source: T): T;
export function dict<T extends {}, T1 extends {}>(source: T, source1: T1): T & T1;
export function dict<T = any>(): Dictionary<T>;
export function dict(...source: any[]): Dictionary<any>;
export function dict(...source: any[]): Dictionary<any> {
	return Object.assign(Object.create(null), ...source);
}

export function stringTestDict<K extends string>(...keys: K[]): Record<K, true> {
	const val = <Record<K, true>>dict();

	for (let i = 0; i !== keys.length; ++i) {
		val[keys[i]] = true;
	}

	return val;
}
