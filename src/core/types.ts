// tslint:disable:interface-over-type-literal

export type Dictionary<V = any> = {
	[key: string]: V;
};

export type Values<T> = T[keyof T];
