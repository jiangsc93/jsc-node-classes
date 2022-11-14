import { objectAssign } from 'jsc-utils/object';
import { paint } from './cli.mjs';
import util from 'util';

const padMainLog = (padLeftLength, main) => {
    const blank = ''.padStart(padLeftLength);
    return main
        .split('\n')
        .map((line, i) => (i === 0 ? line : blank + line))
        .join('\n');
};
const LOGGER_LEVE_POOL_MAP = {
    debug: ['debug', 'log', 'info', 'warn', 'error'],
    log: ['log', 'info', 'warn', 'error'],
    info: ['info', 'warn', 'error'],
    warn: ['warn', 'error'],
    error: ['error']
};
const LOGGER_NAMESPACE_COLOR_MAP = {
    debug: ['magenta', 'bold'],
    log: ['magenta', 'bold'],
    info: ['magenta', 'bold'],
    warn: ['magenta', 'bold'],
    error: ['magenta', 'bold']
};
const LOGGER_LEVEL_COLOR_MAP = {
    debug: ['bgBlue', 'white'],
    log: ['bgGray', 'white'],
    info: ['bgGreen', 'white'],
    warn: ['bgYellow', 'white'],
    error: ['bgRed', 'white']
};
const LOGGER_MAIN_COLOR_MAP = {
    debug: ['blueBright'],
    log: [],
    info: ['green'],
    warn: ['yellowBright'],
    error: ['redBright']
};
const defaults = {
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
class Logger {
    constructor(options) {
        this.options = objectAssign({}, defaults, options);
    }
    /**
     * 打印调试级别的日志
     * @param format
     * @param params
     * @returns {string | null}
     */
    debug(format, ...params) {
        return this._print.call(this, 'debug', format, ...params);
    }
    /**
     * 打印普通级别的日志
     * @param format
     * @param params
     * @returns {string | null}
     */
    log(format, ...params) {
        return this._print.call(this, 'log', format, ...params);
    }
    /**
     * 打印信息级别的日志
     * @param format
     * @param params
     * @returns {string | null}
     */
    info(format, ...params) {
        return this._print.call(this, 'info', format, ...params);
    }
    /**
     * 打印警告级别的日志
     * @param format
     * @param params
     * @returns {string | null}
     */
    warn(format, ...params) {
        return this._print.call(this, 'warn', format, ...params);
    }
    /**
     * 打印错误级别的日志
     * @param format
     * @param params
     * @returns {string | null}
     */
    error(format, ...params) {
        return this._print.call(this, 'error', format, ...params);
    }
    _print(level, format, ...params) {
        const { namespace, level: specifiedLevel, colors: { [level]: colors } } = this.options;
        const specifiedLevelPool = LOGGER_LEVE_POOL_MAP[specifiedLevel];
        if (specifiedLevelPool.indexOf(level) === -1)
            return null;
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

export { Logger as default };
