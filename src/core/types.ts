// tslint:disable:interface-over-type-literal

export type Dictionary<V = any> = {
	[key: string]: V;
};

export type Values<T> = T[keyof T];

export interface ValidationError<T = string> {
	type: 'error';
	reason: T;
}

export interface ValidationWarning<T = string> {
	type: 'warning';
	reason: T;
}

export type ValidationResult<T = string> = true | ValidationWarning<T> | ValidationError<T>;
