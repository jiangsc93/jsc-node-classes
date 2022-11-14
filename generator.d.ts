import { objectAssign, objectMerge } from 'jsc-utils/object';
import { isString, AnyObject, isFunction } from 'jsc-utils/type';
import fse from 'fs-extra';
import path from 'path';
import glob, { IOptions } from 'glob';
import ejs from 'ejs';
import Logger from './logger';

const normalizePath = (path: string) => path.replace(/\\/g, '/');
const UNDERSCORE_FILE_PREFIX = '__';
const DOTFILE_PREFIX = '_';
const EJSFILE_SUFFIX = '.ejs';

export type GeneratorReadIterator = (file: string) => void;

export type GeneratorReadOptions = IOptions;

export interface GeneratorConstructOptions {
    // 源目录，默认当前工作目录
    source: string;
    // 目标目录，默认当前工作目录
    target: string;
    // 日志基准目录，默认为 .
    logBase: string;
}
export interface GeneratorCopyOptions {
    filter: (src: string) => boolean;
    rename: (src: string, dest: string) => string;
    log: boolean;
    convertUnderscoreFile: boolean;
    convertDotFile: boolean;
    readOptions: Partial<GeneratorReadOptions>;
}
export interface GeneratorGenerateOptions {
    filter: (src: string) => boolean;
    rename: (src: string, dest: string) => string;
    log: boolean;
    convertDotFile: boolean;
    convertEjsFile: boolean;
    readOptions: Partial<GeneratorReadOptions>;
}
export interface GeneratorCreateOptions {
    log: boolean;
}

export class Generator {
    public options: GeneratorConstructOptions;
    private logger: Logger;

    constructor(options?: Partial<GeneratorConstructOptions>) {
        const defaults: GeneratorConstructOptions = {
            source: process.cwd(),
            target: process.cwd(),
            logBase: '.'
        };
        this.options = objectAssign(defaults, options || {});
        this.logger = new Logger();
    }

    resolveSource(...to: string[]): string {
        return normalizePath(path.join(this.options.source, ...to));
    }

    resolveTarget(...to: string[]): string {
        return normalizePath(path.join(this.options.target, ...to));
    }

    private _readPattern(pattern: string, readOptions?: Partial<GeneratorReadOptions>): string[] {
        const defaults: GeneratorReadOptions = {
            cwd: this.options.source,
            dot: true,
            nodir: true
        };
        return glob.sync(pattern, objectMerge<GeneratorReadOptions>(defaults, readOptions));
    }

    read(pattern: string, options: Partial<GeneratorReadOptions>, iterator: GeneratorReadIterator): this;
    read(pattern: string, iterator: GeneratorReadIterator): this;
    read(
        pattern: string,
        options: Partial<GeneratorReadOptions> | GeneratorReadIterator,
        iterator?: GeneratorReadIterator
    ): this {
        if (isFunction(options)) {
            this._readPattern(pattern).forEach(options);
        } else if (isFunction(iterator)) {
            this._readPattern(pattern, options).forEach(iterator);
        }

        return this;
    }

    isFile(src: string): boolean {
        const p = this.resolveSource(src);
        if (!fse.existsSync(p)) return false;

        const stats = fse.statSync(p);
        return stats.isFile();
    }

    private _toRelaSrc(src: string, options: GeneratorCopyOptions | GeneratorGenerateOptions): string {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { convertUnderscoreFile, convertDotFile, convertEjsFile = false } = options;
        const dirname = path.dirname(src);
        const basename = path.basename(src);
        const extname = path.extname(src);
        const isUnderscoreFile = basename.startsWith(UNDERSCORE_FILE_PREFIX);
        const isDotFile = !isUnderscoreFile && basename.startsWith(DOTFILE_PREFIX);
        const isEjsFile = extname === EJSFILE_SUFFIX;
        let convertedBasename = basename;

        if (isUnderscoreFile && convertUnderscoreFile)
            convertedBasename = '_' + convertedBasename.slice(UNDERSCORE_FILE_PREFIX.length);
        else if (isDotFile && convertDotFile) convertedBasename = '.' + convertedBasename.slice(DOTFILE_PREFIX.length);
        if (isEjsFile && convertEjsFile) convertedBasename = convertedBasename.slice(0, -EJSFILE_SUFFIX.length);

        return path.join(dirname, convertedBasename);
    }

    private _log(file: string, options: GeneratorCopyOptions | GeneratorGenerateOptions | GeneratorCreateOptions) {
        const { logBase } = this.options;
        const { log } = options;

        if (log) this.logger.info('+', path.join(logBase, file));
    }

    private _copyOne(src: string, dest: string, options: GeneratorCopyOptions): this {
        const { filter, rename } = options;
        if (!filter(src)) return this;

        const file = rename(this._toRelaSrc(src, options), dest);
        fse.copySync(this.resolveSource(src), this.resolveTarget(file));
        this._log(file, options);
        return this;
    }

    copy(src: string, dest: string, options: Partial<GeneratorCopyOptions>): this;
    copy(src: string, dest: string): this;
    copy(src: string, options: Partial<GeneratorCopyOptions>): this;
    copy(src: string): this;
    copy(src: string, dest?: string | Partial<GeneratorCopyOptions>, options?: Partial<GeneratorCopyOptions>): this {
        let _src: string;
        let _dest: string;
        let _options: Partial<GeneratorCopyOptions>;

        // src, dest, options?
        if (isString(dest)) {
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
        const defaults: GeneratorCopyOptions = {
            filter: (src) => true,
            rename: (src, dest) => path.join(dest, src),
            log: true,
            convertUnderscoreFile: true,
            convertDotFile: true,
            readOptions: {}
        };
        const copyOptions = objectAssign<GeneratorCopyOptions>(defaults, _options);
        const { readOptions } = copyOptions;
        const isFile = this.isFile(src2);

        if (isFile) return this._copyOne(src2, dest2, copyOptions);

        const pattern = path.join(src2, '**/*');
        const files = this._readPattern(pattern, readOptions);

        if (files.length === 0) {
            this.read(src2, readOptions, (_src) => {
                this._copyOne(_src, dest2, copyOptions);
            });
        } else {
            files.forEach((_src) => {
                this._copyOne(_src, dest2, copyOptions);
            });
        }

        return this;
    }

    private _generateOne(src: string, dest: string, data: AnyObject, options: GeneratorGenerateOptions): this {
        const { filter, rename } = options;

        if (!filter(src)) return this;

        const source = fse.readFileSync(this.resolveSource(src), 'utf8');
        const file = rename(this._toRelaSrc(src, options), dest);
        fse.outputFileSync(this.resolveTarget(file), ejs.render(source, data));
        this._log(file, options);
        return this;
    }

    generate(src: string, dest: string, data: AnyObject, options: Partial<GeneratorGenerateOptions>): this;
    generate(src: string, dest: string, data: AnyObject): this;
    generate(src: string, data: AnyObject, options: Partial<GeneratorGenerateOptions>): this;
    generate(src: string, data: AnyObject): this;
    generate(
        src: string,
        dest: string | AnyObject,
        data?: AnyObject | Partial<GeneratorGenerateOptions>,
        options?: Partial<GeneratorGenerateOptions>
    ): this {
        let _dest: string;
        let _data: AnyObject;
        let _options: Partial<GeneratorGenerateOptions>;

        // src, dest, data, options?
        if (isString(dest)) {
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

        const defaults: GeneratorGenerateOptions = {
            filter: (src) => true,
            rename: (src, dest) => path.join(dest, src),
            log: true,
            convertDotFile: true,
            convertEjsFile: true,
            readOptions: {}
        };
        const generateOptions = objectAssign<GeneratorGenerateOptions>(defaults, _options);
        const src2 = normalizePath(src);
        const dest2 = normalizePath(_dest);
        const isFile = this.isFile(src2);

        if (isFile) return this._generateOne(src2, dest2, _data, generateOptions);

        const pattern = path.join(src2, '**');
        const files = this._readPattern(pattern);

        if (files.length === 0) {
            this.read(src2, generateOptions.readOptions, (_src) => {
                this._generateOne(_src, dest2, _data, generateOptions);
            });
        } else {
            files.forEach((_src) => {
                this._generateOne(_src, dest2, _data, generateOptions);
            });
        }

        return this;
    }

    create(dest: string, data: Buffer | string, options?: Partial<GeneratorCreateOptions>): this {
        const defaults: GeneratorCreateOptions = {
            log: true
        };
        const createOptions = objectAssign<GeneratorCreateOptions>(defaults, options);
        const file = normalizePath(dest);
        fse.outputFileSync(this.resolveTarget(file), data);
        this._log(file, createOptions);
        return this;
    }
}
