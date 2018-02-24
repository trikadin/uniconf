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

export type Diff<U extends string, E extends string> =
	({[K in U]: K} & {[K in E]: never} & {[N: string]: never})[U];

export type Omit<O, K extends keyof O> = Pick<O, Diff<keyof O, K>>;

export type Override<T, U> = Omit<T, (keyof T) & (keyof U)> & U;

export type Subtype<P, C extends P> = C;
