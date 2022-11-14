'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var object = require('jsc-utils/object');
var type = require('jsc-utils/type');
var fse = require('fs-extra');
var path = require('path');
var glob = require('glob');
var ejs = require('ejs');
var logger = require('./logger.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fse__default = /*#__PURE__*/_interopDefaultLegacy(fse);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);
var ejs__default = /*#__PURE__*/_interopDefaultLegacy(ejs);

const normalizePath = (path) => path.replace(/\\/g, '/');
const UNDERSCORE_FILE_PREFIX = '__';
const DOTFILE_PREFIX = '_';
const EJSFILE_SUFFIX = '.ejs';
class Generator {
    constructor(options) {
        const defaults = {
            source: process.cwd(),
            target: process.cwd(),
            logBase: '.'
        };
        this.options = object.objectAssign(defaults, options || {});
        this.logger = new logger();
    }
    resolveSource(...to) {
        return normalizePath(path__default["default"].join(this.options.source, ...to));
    }
    resolveTarget(...to) {
        return normalizePath(path__default["default"].join(this.options.target, ...to));
    }
    _readPattern(pattern, readOptions) {
        const defaults = {
            cwd: this.options.source,
            dot: true,
            nodir: true
        };
        return glob__default["default"].sync(pattern, object.objectMerge(defaults, readOptions));
    }
    read(pattern, options, iterator) {
        if (type.isFunction(options)) {
            this._readPattern(pattern).forEach(options);
        }
        else if (type.isFunction(iterator)) {
            this._readPattern(pattern, options).forEach(iterator);
        }
        return this;
    }
    isFile(src) {
        const p = this.resolveSource(src);
        if (!fse__default["default"].existsSync(p))
            return false;
        const stats = fse__default["default"].statSync(p);
        return stats.isFile();
    }
    _toRelaSrc(src, options) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { convertUnderscoreFile, convertDotFile, convertEjsFile = false } = options;
        const dirname = path__default["default"].dirname(src);
        const basename = path__default["default"].basename(src);
        const extname = path__default["default"].extname(src);
        const isUnderscoreFile = basename.startsWith(UNDERSCORE_FILE_PREFIX);
        const isDotFile = !isUnderscoreFile && basename.startsWith(DOTFILE_PREFIX);
        const isEjsFile = extname === EJSFILE_SUFFIX;
        let convertedBasename = basename;
        if (isUnderscoreFile && convertUnderscoreFile)
            convertedBasename = '_' + convertedBasename.slice(UNDERSCORE_FILE_PREFIX.length);
        else if (isDotFile && convertDotFile)
            convertedBasename = '.' + convertedBasename.slice(DOTFILE_PREFIX.length);
        if (isEjsFile && convertEjsFile)
            convertedBasename = convertedBasename.slice(0, -EJSFILE_SUFFIX.length);
        return path__default["default"].join(dirname, convertedBasename);
    }
    _log(file, options) {
        const { logBase } = this.options;
        const { log } = options;
        if (log)
            this.logger.info('+', path__default["default"].join(logBase, file));
    }
    _copyOne(src, dest, options) {
        const { filter, rename } = options;
        if (!filter(src))
            return this;
        const file = rename(this._toRelaSrc(src, options), dest);
        fse__default["default"].copySync(this.resolveSource(src), this.resolveTarget(file));
        this._log(file, options);
        return this;
    }
    copy(src, dest, options) {
        let _src;
        let _dest;
        let _options;
        // src, dest, options?
        if (type.isString(dest)) {
            _src = src;
            _dest = dest;
            _options = options || {};
        }
        // src, options?
        else {
            _src = src;
            _dest = '.';
            _options = dest || {};
        }
        const src2 = normalizePath(_src);
        const dest2 = normalizePath(_dest);
        const defaults = {
            filter: (src) => true,
            rename: (src, dest) => path__default["default"].join(dest, src),
            log: true,
            convertUnderscoreFile: true,
            convertDotFile: true,
            readOptions: {}
        };
        const copyOptions = object.objectAssign(defaults, _options);
        const { readOptions } = copyOptions;
        const isFile = this.isFile(src2);
        if (isFile)
            return this._copyOne(src2, dest2, copyOptions);
        const pattern = path__default["default"].join(src2, '**/*');
        const files = this._readPattern(pattern, readOptions);
        if (files.length === 0) {
            this.read(src2, readOptions, (_src) => {
                this._copyOne(_src, dest2, copyOptions);
            });
        }
        else {
            files.forEach((_src) => {
                this._copyOne(_src, dest2, copyOptions);
            });
        }
        return this;
    }
    _generateOne(src, dest, data, options) {
        const { filter, rename } = options;
        if (!filter(src))
            return this;
        const source = fse__default["default"].readFileSync(this.resolveSource(src), 'utf8');
        const file = rename(this._toRelaSrc(src, options), dest);
        fse__default["default"].outputFileSync(this.resolveTarget(file), ejs__default["default"].render(source, data));
        this._log(file, options);
        return this;
    }
    generate(src, dest, data, options) {
        let _dest;
        let _data;
        let _options;
        // src, dest, data, options?
        if (type.isString(dest)) {
            _dest = dest;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            _data = data;
            _options = options || {};
        }
        // src, data, options?
        else {
            _dest = '.';
            _data = dest;
            _options = data || {};
        }
        const defaults = {
            filter: (src) => true,
            rename: (src, dest) => path__default["default"].join(dest, src),
            log: true,
            convertDotFile: true,
            convertEjsFile: true,
            readOptions: {}
        };
        const generateOptions = object.objectAssign(defaults, _options);
        const src2 = normalizePath(src);
        const dest2 = normalizePath(_dest);
        const isFile = this.isFile(src2);
        if (isFile)
            return this._generateOne(src2, dest2, _data, generateOptions);
        const pattern = path__default["default"].join(src2, '**');
        const files = this._readPattern(pattern);
        if (files.length === 0) {
            this.read(src2, generateOptions.readOptions, (_src) => {
                this._generateOne(_src, dest2, _data, generateOptions);
            });
        }
        else {
            files.forEach((_src) => {
                this._generateOne(_src, dest2, _data, generateOptions);
            });
        }
        return this;
    }
    create(dest, data, options) {
        const defaults = {
            log: true
        };
        const createOptions = object.objectAssign(defaults, options);
        const file = normalizePath(dest);
        fse__default["default"].outputFileSync(this.resolveTarget(file), data);
        this._log(file, createOptions);
        return this;
    }
}

exports.Generator = Generator;
