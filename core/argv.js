'use strict';

const {argv} = process;
const parseArgs = require('./parseArgs');

module.exports = parseArgs(argv);
