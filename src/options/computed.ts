import { Dictionary } from '../core/types';

const handlersDict = Object.create(null);

export type Handler = (config: Dictionary) => any;

export function set(handler: Handler): symbol {
	const sym = Symbol();

	handlersDict[sym] = handler;

	return sym;
}

export function get(link: symbol): Handler {
	return handlersDict[link];
}
