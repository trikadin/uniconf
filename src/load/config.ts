import path = require('path');
import fs = require('fs');
import { Dictionary, ValidationResult } from '../core/types';
import { dict } from '../core';
import { ConfigLoadingError } from '../core/errors';

export interface ConfigSettings {
	extends?: string;
}

export class Config {
	static getConfig(dirpath: string): Config {
		if (dirpath in this.cache) {
			return this.cache[dirpath];
		}

		let isDir: boolean;

		try {
			isDir = fs.statSync(dirpath).isDirectory();

		} catch (error) {
			throw new ConfigLoadingError(dirpath, error);
		}

		if (!isDir) {
			throw ConfigLoadingError.createCustom(
				[
					`Failed to load config from ${JSON.stringify(dirpath)}.`,
					'Reason: the given path is not a directory.'
				]
			);
		}

		return <any>null;
	}

	parent?: Config;

	private constructor() {}

	private settings: ConfigSettings;

	private levels: Dictionary;

	private static readonly defaultSettings: ConfigSettings = {};
	private static readonly cache: Dictionary<Config> = dict();

	private static ensureDir(path: string): boolean | Error {
		try {
			return fs.statSync(path).isDirectory();

		} catch (err) {
			return err;
		}
	}

	private static getOwnSettings(dirpath: string): ConfigSettings {
		let settings = this.defaultSettings;

		try {
			settings = require(path.join(dirpath, 'index'));

		} catch (error) {

		}

		return settings;
	}
}
