import $C = require('collection.js');
import { dict } from '../../core';
import { Dictionary, Values, Diff, Subtype } from '../../core/types';

export interface Rels {
	int: 'int' | 'uint';
	number: 'number' | 'unumber' | 'int';
	primitive: 'boolean' | 'string' | 'number';
	datetime: 'datetime' | 'date' | 'time';
	array: 'array' |
		'datetime[]' | 'date[]' | 'time[]' |
		'boolean[]' | 'string[]' |
		'number[]' | 'unumber[]' | 'int[]' | 'uint[]';
	object: 'object' |
		'datetime{}' | 'date{}' | 'time{}' |
		'boolean{}' | 'string{}' |
		'number{}' | 'unumber{}' | 'int{}' | 'uint{}';
	any: 'primitive' | 'datetime' | 'array' | 'object';
}

export interface Groups {
	meta: keyof Rels;
	virtual: Subtype<Groups['meta'], 'any' | 'primitive'>;
	real: Diff<Values<Rels>, Groups['virtual']>;
	parsable: Subtype<Groups['real'],
		'boolean' | 'number' | 'string' | Rels['datetime']>;

	cleanMeta: Diff<Groups['meta'], Groups['real']>;
	cleanReal: Diff<Groups['real'], Groups['meta'] | Groups['parsable']>;
	cleanParsable: Diff<Groups['parsable'], Groups['meta']>;

	metaReal: Diff<Groups['meta'] & Groups['real'], Groups['parsable']>;
	super: Groups['meta'] & Groups['parsable'];
}

export type Name = Groups['meta'] | Groups['real'];

type TypesDict = {
	[N in Groups['cleanMeta']]: IMeta<N>;
} & {
	[N in Groups['cleanReal']]: IReal<N>;
} & {
	[N in Groups['cleanParsable']]: IParsable<N>;
} & {
	[N in Groups['metaReal']]: IMetaReal<N>;
} & {
	[N in Groups['super']]: ISuper<N>;
};

type Type<N extends Name = Name> = TypesDict[N];

interface IType<N extends Name> {
	name: N;
	description: string;
	parent?: Type;
}

interface IMeta<N extends Groups['meta']> extends IType<N> {
	children: Array<TypesDict[Diff<Rels[N], N>]>;
}

interface IReal<N extends Groups['real']> extends IType<N> {
	subValidation?: boolean;
	validate(this: null, value: any): boolean;
}

interface IParsable<N extends Groups['parsable']> extends IReal<N> {
	parse?(this: null, value: string): any;
}

interface IMetaReal<N extends Groups['metaReal']> extends IMeta<N>, IReal<N> {}

interface ISuper<N extends Groups['super']> extends IParsable<N>, IMeta<N> {}

const
	typesDict = <TypesDict>dict();

let typesTop: Type | null = null;

function addTypes(...types: Type[]): void {
	types.forEach((type) => {
		if (type.name in typesDict) {
			return;
		}

		typesDict[type.name] = type;

		if (!typesTop) {
			typesTop = type;
		}

		if ('children' in type) {
			const
				children: Type[] = type.children;

			children.forEach((child) => {
				child.parent = type;
			});

			addTypes(...children);

			if (children.indexOf(typesTop)) {
				typesTop = type;
			}
		}
	});
}

function getPlainSubtree(type: Name | Type): Type[] {
	if (typeof type === 'string') {
		type = typesDict[type];
	}

	const res: Type[] = [type];

	if ('children' in type) {
		for (let i = 0; i !== type.children.length; ++i) {
			res.push(...getPlainSubtree(type.children[i].name));
		}
	}

	return res;
}

// tslint:disable:typedef

addTypes({
	name: 'unumber',
	description: 'a nonnegative number',
	subValidation: true,
	validate(v: number) {
		return v >= 0;
	}
});

function isDate(value: any): value is Date {
	return value instanceof Date;
}

addTypes(
	{
		name: 'primitive',
		description: 'a primitive',
		children: [
			{
				name: 'number',
				description: 'a number',
				parse: Number,
				validate: Number.isFinite,
				children: [
					typesDict.unumber,

					{
						name: 'int',
						description: 'an integer',
						validate: Number.isInteger,
						subValidation: true,

						children: [
							{
								name: 'uint',
								description: 'a nonnegative integer',
								validate: typesDict.unumber.validate,
								subValidation: true
							}
						]
					}
				]
			},

			{
				name: 'boolean',
				description: 'a boolean',
				parse(value) {
					if (!value || /^false$/i.test(value)) {
						return false;
					}

					if (/^true$/i.test(value)) {
						return true;
					}

					return value;
				},

				validate(value: any): value is boolean {
					return typeof value === 'boolean';
				}
			},

			{
				name: 'string',
				description: 'a string',
				parse: String,
				validate(value: any): value is string {
					return typeof value === 'string';
				}
			}
		]
	},

	{
		name: 'datetime',
		description: 'a datetime',
		validate: isDate,

		children: [
			{
				name: 'date',
				description: 'a date',
				validate: isDate
			},

			{
				name: 'time',
				description: 'a time',
				validate: isDate
			}
		]
	}
);

const
	arrayChildren: Type<'array'>['children'] = [],
	objectChildren: Type<'object'>['children'] = [];

function pluralize(name: string): string {
	return name.replace(/^an? /, '') + 's';
}

getPlainSubtree('primitive').concat(getPlainSubtree('datetime')).forEach((baseType) => {
	if (!('validate' in baseType)) {
		return;
	}

	const
		{name} = baseType,
		pluralized = pluralize(baseType.description);

	arrayChildren.push({
		name: <any>`${name}[]`,
		description: `an array of ${pluralized}`,
		subValidation: true,
		validate(value: any[]) {
			for (let i = 0; i !== value.length; ++i) {
				if (!validate(name, value[i])) {
					return false;
				}
			}

			return true;
		}
	});

	const
		{hasOwnProperty} = Object.prototype,
		hasOwn = (obj: object, key: string): boolean => hasOwnProperty.call(obj, key);

	objectChildren.push({
		name: <any>`${name}{}`,
		description: `a dictionary of ${pluralized}`,
		subValidation: true,
		validate(value: any[]) {
			for (const key in value) {
				if (!hasOwn(value, key)) {
					break;
				}

				if (!validate(name, value[key])) {
					return false;
				}
			}

			return true;
		}
	});
});

addTypes(
	{
		name: 'any',
		description: 'any',
		children: [
			typesDict.primitive,

			typesDict.datetime,

			{
				name: 'array',
				description: 'an array',
				validate: Array.isArray,
				children: arrayChildren
			},

			{
				name: 'object',
				description: 'a dictionary',
				validate(value): value is Object {
					if (!value || (typeof value !== 'object')) {
						return false;
					}

					return value.constructor === Object || Object.getPrototypeOf(value) === null;
				},

				children: objectChildren
			}
		]
	}
);

// tslint:enable:typedef

type TypeValidate = IReal<any>['validate'];

const validatorsDict = <Record<Name, TypeValidate | TypeValidate[]>>dict();

function getValidators(type: Type): TypeValidate[] {
	const {name} = type;

	if (validatorsDict[name]) {
		const res = validatorsDict[name];
		return Array.isArray(res) ? res : [res];
	}

	let res: TypeValidate[] | undefined;

	if ('validate' in type) {
		if (type.subValidation) {
			if (type.parent && ('validate' in type.parent)) {
				res = getValidators(type.parent).concat(type.validate);

			} else {
				throw new TypeError(`Type ${name} is subvalidatable, but has no parent or it's parent has no validator`);
			}

		} else {
			res = [type.validate];
		}

	} else {
		const children: Type[] = type.children;
		res = [(value) => children.some(
			({name}) => validate(name, value)
		)];
	}

	validatorsDict[name] = res.length === 1 ? res[0] : res;
	return res;
}

$C(typesDict).forEach(getValidators);

export function validate(type: Name, value: any): boolean {
	const validators = validatorsDict[type];

	if (Array.isArray(validators)) {
		for (let i = 0; i !== validators.length; ++i) {
			if (!validators[i].call(null, value)) {
				return false;
			}
		}

		return true;

	} else {
		return validators.call(null, value);
	}
}
