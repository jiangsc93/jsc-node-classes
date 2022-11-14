import { objectAssign } from 'jsc-utils/object';
import { AnyObject } from 'jsc-utils/type';
import { paint, PrinterColor } from './cli';
import util from 'util';

const padMainLog = (padLeftLength: number, main: string): string => {
    const blank = ''.padStart(padLeftLength);
    return main
        .split('\n')
        .map((line, i) => (i === 0 ? line : blank + line))
        .join('\n');
};

export type LoggerLevel = 'debug' | 'log' | 'info' | 'warn' | 'error';

const LOGGER_LEVE_POOL_MAP: Record<LoggerLevel, LoggerLevel[]> = {
    debug: ['debug', 'log', 'info', 'warn', 'error'],
    log: ['log', 'info', 'warn', 'error'],
    info: ['info', 'warn', 'error'],
    warn: ['warn', 'error'],
    error: ['error']
};

const LOGGER_NAMESPACE_COLOR_MAP: Record<LoggerLevel, PrinterColor[]> = {
    debug: ['magenta', 'bold'],
    log: ['magenta', 'bold'],
    info: ['magenta', 'bold'],
    warn: ['magenta', 'bold'],
    error: ['magenta', 'bold']
};

const LOGGER_LEVEL_COLOR_MAP: Record<LoggerLevel, PrinterColor[]> = {
    debug: ['bgBlue', 'white'],
    log: ['bgGray', 'white'],
    info: ['bgGreen', 'white'],
    warn: ['bgYellow', 'white'],
    error: ['bgRed', 'white']
};

const LOGGER_MAIN_COLOR_MAP: Record<LoggerLevel, PrinterColor[]> = {
    debug: ['blueBright'],
    log: [],
    info: ['green'],
    warn: ['yellowBright'],
    error: ['redBright']
};

export interface LoggerOptions {
    namespace: string;
    level: LoggerLevel;
    colors: {
        [level in LoggerLevel]: PrinterColor[];
    };
}

const defaults: LoggerOptions = {
    namespace: '',
    level: 'debug',
    colors: {
        debug: ['magenta'],
        log: ['white'],
        info: ['greenBright'],
        warn: ['yellowBright'],
        error: ['redBright']
    }
};

export default class Logger {
    private readonly options: LoggerOptions;

    constructor(options?: Partial<LoggerOptions>) {
        this.options = objectAssign({}, defaults, options as AnyObject);
    }

    /**
     * 打印调试级别的日志
     * @param format
     * @param params
     * @returns {string | null}
     */
    debug(format: any, ...params: any[]): null | string {
        return this._print.call(this, 'debug', format, ...params);
    }

    /**
     * 打印普通级别的日志
     * @param format
     * @param params
     * @returns {string | null}
     */
    log(format: any, ...params: any[]): null | string {
        return this._print.call(this, 'log', format, ...params);
    }

    /**
     * 打印信息级别的日志
     * @param format
     * @param params
     * @returns {string | null}
     */
    info(format: any, ...params: any[]): null | string {
        return this._print.call(this, 'info', format, ...params);
    }

    /**
     * 打印警告级别的日志
     * @param format
     * @param params
     * @returns {string | null}
     */
    warn(format: any, ...params: any[]): null | string {
        return this._print.call(this, 'warn', format, ...params);
    }

    /**
     * 打印错误级别的日志
     * @param format
     * @param params
     * @returns {string | null}
     */
    error(format: any, ...params: any[]): null | string {
        return this._print.call(this, 'error', format, ...params);
    }

    private _print(level: LoggerLevel, format: any, ...params: any[]): null | string {
        const {
            namespace,
            level: specifiedLevel,
            colors: { [level]: colors }
        } = this.options;
        const specifiedLevelPool = LOGGER_LEVE_POOL_MAP[specifiedLevel];

        if (specifiedLevelPool.indexOf(level) === -1) return null;

        const plainLog = [];
        const colorLog = [];
        let padLeftLength = 0;

        // 日志格式
        // ${namespace} ${level} ${main}

        // namespace
        if (namespace) {
            const namespaceLog = util.format('[%s]', namespace);
            plainLog.push(namespaceLog);
            colorLog.push(paint(namespaceLog, LOGGER_NAMESPACE_COLOR_MAP[level]));
            padLeftLength += namespaceLog.length + 1;
        }

        // level
        const levelLog = util.format('%s', level.toUpperCase());
        plainLog.push(levelLog);
        colorLog.push(paint(' ' + levelLog + ' ', LOGGER_LEVEL_COLOR_MAP[level]));
        padLeftLength += levelLog.length + 3;

        // main
        const mainLog = util.format.call(util, format, ...params);
        plainLog.push(mainLog);
        colorLog.push(paint(padMainLog(padLeftLength, mainLog), LOGGER_MAIN_COLOR_MAP[level]));

        console.log.call(console, ...colorLog);
        return plainLog.join(' ');
    }
}
