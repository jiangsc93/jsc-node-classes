import { errorNormalize } from 'jsc-utils/error';
import { stringCamelCase } from 'jsc-utils/string';
import chalk from 'chalk';
import minimist, { ParsedArgs, Opts } from 'minimist';
import { AnyArray, AnyObject, isFunction, isString, isUndefined } from 'jsc-utils/type';
import { objectAssign, objectEach, objectHas } from 'jsc-utils/object';

import Events, { EventsListener } from 'jsc-classes/events';

export { chalk, minimist };

export type PrinterColor =
    | 'black'
    | 'red'
    | 'green'
    | 'yellow'
    | 'blue'
    | 'magenta'
    | 'cyan'
    | 'white'
    | 'gray'
    | 'grey'
    | 'redBright'
    | 'greenBright'
    | 'yellowBright'
    | 'blueBright'
    | 'magentaBright'
    | 'cyanBright'
    | 'whiteBright'
    | 'bgBlack'
    | 'bgRed'
    | 'bgGreen'
    | 'bgYellow'
    | 'bgBlue'
    | 'bgMagenta'
    | 'bgCyan'
    | 'bgWhite'
    | 'bgGray'
    | 'bgGrey'
    | 'bgBlackBright'
    | 'bgRedBright'
    | 'bgGreenBright'
    | 'bgYellowBright'
    | 'bgBlueBright'
    | 'bgMagentaBright'
    | 'bgCyanBright'
    | 'bgWhiteBright'
    | 'reset'
    | 'bold'
    | 'dim'
    | 'italic'
    | 'underline'
    | 'inverse'
    | 'hidden'
    | 'strikethrough'
    | 'visible';

interface PrinterLine {
    left: {
        output: string;
        colors: PrinterColor[];
    };
    right: {
        output: string;
        colors: PrinterColor[];
    };
    alone: {
        output: string;
        colors: PrinterColor[];
    };
}

export const paint = (raw: string, colors: PrinterColor[]): string => {
    let start = raw;

    for (const color of colors) {
        start = chalk[color](start);
    }

    return start;
};

export class Printer {
    private printLines: PrinterLine[];
    private currentLine?: PrinterLine;
    private _leftWidth?: number;

    constructor() {
        this.printLines = [];
    }

    get length(): number {
        return this.printLines.length;
    }

    set leftWidth(leftWidth: number) {
        this._leftWidth = leftWidth;
    }

    get leftWidth(): number {
        return this._leftWidth || this._calcLeftWidth();
    }

    pushLine(): this {
        this.printLines.push(this._newLine());
        return this;
    }

    unshiftLine(): this {
        this.printLines.unshift(this._newLine());
        return this;
    }

    left(output: string, colors?: PrinterColor[]): this {
        return this._fill('left', output, colors);
    }

    right(output: string, colors?: PrinterColor[]): this {
        return this._fill('right', output, colors);
    }

    alone(output: string, colors?: PrinterColor[]): this {
        return this._fill('alone', output, colors);
    }

    plainify(): string[] {
        return this._ify(false);
    }

    colorify(): string[] {
        return this._ify(true);
    }

    private _fill(position: 'left' | 'right' | 'alone', output: string, colors: PrinterColor[] = []): this {
        const { currentLine } = this;

        if (!currentLine) {
            throw new Error('未定义行');
        }

        const filled = currentLine[position];

        filled.output = output;
        filled.colors = colors;

        return this;
    }

    private _calcLeftWidth(): number {
        return this.printLines.reduce((acc, cur) => {
            if (cur.alone.output.length > 0) return acc;

            const { length } = cur.left.output;

            return length > acc ? length : acc;
        }, 0);
    }

    private _ify(colorful: boolean): string[] {
        const { leftWidth } = this;
        const stringFill = (length: number, filled: string) => new Array(length).fill(filled).join('');
        const paintify = (raw: string, colors: PrinterColor[], indent = 0): string => {
            const indentedRaw =
                indent === 0
                    ? raw
                    : raw
                          .split(/\n/)
                          .map((line, index) => (index ? stringFill(indent, ' ') + line : line))
                          .join('\n');

            if (!colorful) return indentedRaw;

            return paint(indentedRaw, colors);
        };

        return this.printLines.map((printing) => {
            const { left, right, alone } = printing;

            if (alone.output.length > 0) return paintify(alone.output, alone.colors);

            const isEmptyRright = right.output.length === 0;
            const left2 = left.output.padEnd(leftWidth, ' ');
            const left3 = isEmptyRright ? left2.trimEnd() : left2;
            const left4 = paintify(left3, left.colors);
            const line = [left4];

            if (!isEmptyRright) {
                const right4 = paintify(right.output, right.colors, this.leftWidth + 1);
                line.push(right4);
            }

            return line.join(' ');
        });
    }

    private _newLine(): PrinterLine {
        return (this.currentLine = {
            left: {
                output: '',
                colors: []
            },
            right: {
                output: '',
                colors: []
            },
            alone: {
                output: '',
                colors: []
            }
        });
    }
}

export interface CliAction {
    argv: string[];
    parsed: ParsedArgs;
    command: string | null;
    arguments: AnyObject;
    options: AnyObject;
    extras: string[];
}
export type CliActionCallback = (action: CliAction) => any | Promise<any>;
type CliEventChannel = 'not-found' | 'not-match' | 'no-action';
export type CliType = 'string' | 'boolean';
type NotFoundListener = (parsed: ParsedArgs) => void;
type NotMatchListener = (commander: CliCommander) => void;
type NoActionListener = (commander: CliCommander) => void;
export interface CliCommanderOption {
    short: string;
    long: string;
    default?: string | boolean;
    type: CliType;
    message?: string;
}
export interface CliCommander {
    global: boolean;
    command: string | symbol;
    usages: Array<{ usage: string; desc: string }>;
    desc: string;
    arguments: Array<{ argument: string; required: boolean }>;
    options: {
        [key: string]: CliCommanderOption;
    };
    alias: {
        [key: string]: string;
    };
    action?: CliActionCallback;
}

const GLOBAL_SYMBOL = Symbol();
const ERROR_COLORS: PrinterColor[] = ['redBright'];
const HELP_TITLE_COLORS: PrinterColor[] = ['bold', 'yellow'];
const HELP_LEFT_COLORS: PrinterColor[] = ['bold', 'blue'];

const parseArguments = (commander: CliCommander, parsed: ParsedArgs): null | AnyObject => {
    const { arguments: commanderArgs } = commander;
    const args = parsed._.slice(commander.global ? 0 : 1);
    const { length: inputLength } = args;
    const minLength = commanderArgs.filter((arg) => arg.required).length;
    const maxLength = commanderArgs.length;
    const matchLength = inputLength >= minLength && inputLength <= maxLength;

    if (!matchLength) return null;

    return commanderArgs.reduce((acc, cur, idx) => {
        const { argument, required } = cur;
        acc[argument] = args[idx];
        acc[stringCamelCase(argument)] = args[idx];
        return acc;
    }, {} as AnyObject);
};

const parseOptions = (commander: CliCommander, parsed: ParsedArgs): AnyObject => {
    const options2: AnyObject = {};

    objectEach(commander.options, (option, key) => {
        if (!objectHas(parsed, key as string)) return;

        // const { type, default: dft, message } = option;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        options2[key as string] = parsed[key as string];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        options2[stringCamelCase(key as string)] = parsed[key as string];
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return options2;
};

interface CliOptions {
    longHelp: string | null;
    shortHelp: string;
    longVersion: string | null;
    shortVersion: string;
    color: boolean;
    debug: boolean;
    exit: boolean;
    exitCode: number;
}
export const defaults: CliOptions = {
    longHelp: 'help',
    shortHelp: 'h',
    longVersion: 'version',
    shortVersion: 'v',
    color: true,
    debug: false,
    exit: true,
    exitCode: 197
};

export default class Cli extends Events {
    private _currentCommander?: CliCommander;
    private _currentOption?: CliCommanderOption;
    private _commanderMap: Map<string | symbol, CliCommander>;
    private _name: string;
    private _bin: string;
    private _version: string;
    private _banner: string;
    private _options: CliOptions;
    private _helpInjected: boolean;
    private _versionInjected: boolean;
    private _parsed?: ParsedArgs;
    private _argv: string[];

    constructor(options?: Partial<CliOptions>) {
        super();
        this._commanderMap = new Map<string | symbol, CliCommander>();
        this._name = '';
        this._bin = '';
        this._version = '';
        this._banner = '';
        this._options = objectAssign<CliOptions>({}, defaults, options);
        this._helpInjected = false;
        this._versionInjected = false;
        this._argv = [];
    }

    public emit(channel: CliEventChannel, ...payloads: AnyArray): this {
        return super.emit(channel, ...payloads);
    }

    on(channel: 'not-found', listener: NotFoundListener): this;
    on(channel: 'not-match', listener: NotMatchListener): this;
    on(channel: 'no-action', listener: NoActionListener): this;
    public on(channel: CliEventChannel, listener: EventsListener): this {
        return super.on(channel, listener);
    }

    /**
     * 设置命令行名称
     * @param {string} name
     * @returns {this}
     */
    public name(name: string): this {
        this._name = name;
        return this;
    }

    /**
     * 设置命令行 bin
     * @param {string} bin
     * @returns {this}
     */
    public bin(bin: string): this {
        this._bin = bin;
        return this;
    }

    /**
     * 设置命令行版本
     * @param {string} version
     * @returns {this}
     */
    public version(version: string): this {
        this._version = version;
        return this;
    }

    /**
     * 设置 banner
     * @param {string} banner
     * @returns {this}
     */
    public banner(banner: string): this {
        this._banner = banner;
        return this;
    }

    /**
     * 全局命令
     * @returns {this}
     */
    public global(): this {
        if (this._commanderMap.get(GLOBAL_SYMBOL)) {
            throw new Error('只能配置一次全局命令');
        }

        this._registCommand(GLOBAL_SYMBOL);
        return this;
    }

    /**
     * 局部命令
     * @param {string} command
     * @returns {this}
     */
    public command(command?: string): this {
        if (!command) this.global();

        this._registCommand(command as string);
        return this;
    }

    /**
     * 使用方法，上接命令
     * @param {string} usage
     * @param {string} desc
     * @returns {this}
     */
    public usage(usage: string, desc: string): this {
        const { _currentCommander } = this;

        if (!_currentCommander) {
            throw new Error('必须先注册命令');
        }

        _currentCommander.usages.push({
            usage,
            desc
        });
        return this;
    }

    /**
     * 命令描述，上接命令
     * @param {string} desc
     * @returns {this}
     */
    public desc(desc: string): this {
        const { _currentCommander } = this;

        if (!_currentCommander) {
            throw new Error('必须先注册命令');
        }

        _currentCommander.desc = desc;
        return this;
    }

    /**
     * 命令参数，上接命令
     * @param {string} argument
     * @param {boolean} required
     * @returns {this}
     */
    public argument(argument: string, required?: boolean): this {
        const { _currentCommander } = this;

        if (!_currentCommander) {
            throw new Error('必须先注册命令');
        }

        _currentCommander.arguments.push({
            argument,
            required: Boolean(required)
        });

        return this;
    }

    /**
     * 命令配置，上接命令
     * @param {string} long
     * @param {string} short
     * @returns {this}
     */
    option(long: string, short?: string): this {
        const { _currentCommander } = this;

        if (!_currentCommander) {
            throw new Error('必须先注册命令');
        }

        const label = _currentCommander.global ? '全局命令' : _currentCommander.command.toString() + ' 命令';

        if (_currentCommander.options[long]) {
            throw new Error(`${label}已经配置了 ${long} 长选项`);
        }

        const _short = short || long;
        const cliOption: CliCommanderOption = {
            long: long,
            short: _short,
            type: 'string'
        };

        if (_short !== long) {
            if (_currentCommander.alias[_short]) {
                throw new Error(`${label}已经配置了 ${_short} 短选项`);
            }

            _currentCommander.alias[_short] = long;
        }

        _currentCommander.options[long] = cliOption;
        this._currentOption = cliOption;
        return this;
    }

    /**
     * 配置值类型，上接配置
     * @param {CliType} type
     * @returns {this}
     */
    public type(type: CliType): this {
        const { _currentCommander, _currentOption } = this;

        if (!_currentCommander) {
            throw new Error('必须先注册命令');
        }

        if (!_currentOption) {
            throw new Error('必须先配置命令选项');
        }

        _currentOption.type = type;

        return this;
    }

    /**
     * 设置默认值，上接配置
     * @param {CliType} value
     * @returns {this}
     */
    public default(value: boolean | string): this {
        const { _currentCommander, _currentOption } = this;

        if (!_currentCommander) {
            throw new Error('必须先注册命令');
        }

        if (!_currentOption) {
            throw new Error('必须先配置命令 option');
        }

        _currentOption.default = value;

        return this;
    }

    /**
     * 配置消息，上接配置
     * @param {string} message
     * @returns {this}
     */
    public message(message: string): this {
        const { _currentCommander, _currentOption } = this;

        if (!_currentCommander) {
            throw new Error('必须先注册命令');
        }

        if (!_currentOption) {
            throw new Error('必须先配置命令 option');
        }

        _currentOption.message = message;
        return this;
    }

    /**
     * 命令动作，上接命令
     * @param {CliActionCallback} action
     * @returns {this}
     */
    action(action: CliActionCallback): this {
        const { _currentCommander } = this;

        if (!_currentCommander) {
            throw new Error('必须先注册命令');
        }

        _currentCommander.action = action;
        return this;
    }

    /**
     * 打印帮助信息
     * @param {string | symbol} command
     * @returns {string[]}
     */
    printHelp(command?: string | symbol): string[] {
        const { _bin: bin, _banner: banner, _commanderMap: commanderMap } = this;
        const commander = commanderMap.get(command || GLOBAL_SYMBOL);

        if (isUndefined(commander)) {
            return this.printHelp(GLOBAL_SYMBOL);
        }

        const { global, arguments: args, usages, desc } = commander;
        const usagesPrinter = new Printer();
        const commandsPrinter = new Printer();
        const optionsPrinter = new Printer();
        const argumentsify = (args: CliCommander['arguments']) => {
            return args
                .map((arg) => {
                    const { argument, required } = arg;

                    if (required) return `<${argument}>`;
                    else return `[${argument}]`;
                })
                .join(' ');
        };

        if (global) {
            if (usages.length > 0) {
                usagesPrinter.pushLine().alone(`  ${desc}`);
                usages.forEach((item) => {
                    const { usage: usage2, desc: desc2 } = item;

                    usagesPrinter.pushLine().left(`  ${usage2}`, HELP_LEFT_COLORS).right(desc2);
                });
            } else if (commanderMap.size > 1) {
                usagesPrinter.pushLine().left(`  ${bin} <command> [options]`, HELP_LEFT_COLORS).right(desc);
            } else {
                usagesPrinter.pushLine().left(`  ${bin} [options]`, HELP_LEFT_COLORS).right(desc);
            }

            for (const commander of commanderMap.values()) {
                const {
                    global: global2,
                    command: command2,
                    arguments: args2,
                    desc: desc2,
                    options: options2
                } = commander;

                if (global2) continue;

                const args2Str = argumentsify(args2);

                if (Object.keys(options2).length > 0) {
                    commandsPrinter
                        .pushLine()
                        .left(`  ${command2 as string} ${args2Str} [options]`, HELP_LEFT_COLORS)
                        .right(desc2);
                } else {
                    commandsPrinter
                        .pushLine()
                        .left(`  ${command2 as string} ${args2Str}`, HELP_LEFT_COLORS)
                        .right(desc2);
                }
            }
        } else {
            const argsStr = argumentsify(args);
            let left = `  ${bin} ${command as string}`;

            if (argsStr.length > 0) left += ` ${argsStr}`;

            // options 不包含 help
            if (Object.keys(commander.options).filter((k) => k !== 'help').length > 0) left += ' [options]';

            usagesPrinter.pushLine().left(left, HELP_LEFT_COLORS).right(desc);

            if (usages.length > 0) {
                usages.forEach((item) => {
                    const { usage: usage2, desc: desc2 } = item;

                    usagesPrinter.pushLine().left(`  ${bin} ${usage2}`, HELP_LEFT_COLORS).right(desc2);
                });
            }
        }

        objectEach(commander.options, (val, key) => {
            const { short, long, message = '' } = val;

            if (short === long) {
                optionsPrinter.pushLine().left(`  --${long}`, HELP_LEFT_COLORS).right(message);
            } else {
                optionsPrinter.pushLine().left(`  --${long}, -${short}`, HELP_LEFT_COLORS).right(message);
            }
        });

        if (usagesPrinter.length > 0) usagesPrinter.unshiftLine().alone('Usages:', HELP_TITLE_COLORS);
        if (commandsPrinter.length > 0) commandsPrinter.unshiftLine().alone('Commands:', HELP_TITLE_COLORS);
        if (optionsPrinter.length > 0) optionsPrinter.unshiftLine().alone('Options:', HELP_TITLE_COLORS);

        const maxLeftWidth = Math.max(usagesPrinter.leftWidth, commandsPrinter.leftWidth, optionsPrinter.leftWidth);
        usagesPrinter.leftWidth = maxLeftWidth;
        commandsPrinter.leftWidth = maxLeftWidth;
        optionsPrinter.leftWidth = maxLeftWidth;

        const helpPlainPrints: string[][] = [];
        const helpColorPrints: string[][] = [];

        if (banner.length > 0) {
            helpPlainPrints.push([banner]);
            helpColorPrints.push([banner]);
        }

        if (usagesPrinter.length > 0) {
            helpPlainPrints.push(usagesPrinter.plainify());
            helpColorPrints.push(usagesPrinter.colorify());
        }

        if (commandsPrinter.length > 0) {
            helpPlainPrints.push(commandsPrinter.plainify());
            helpColorPrints.push(commandsPrinter.colorify());
        }

        if (optionsPrinter.length > 0) {
            helpPlainPrints.push(optionsPrinter.plainify());
            helpColorPrints.push(optionsPrinter.colorify());
        }

        /**
         * 使每个分组之间留有空行
         * @param {string[][]} array
         * @returns {string[]}
         */
        const groupify = (array: string[][]) => {
            const newArray: string[] = [];
            array.forEach((el, index) => {
                if (index !== 0) newArray.push('');
                newArray.push(...el);
            });
            return newArray;
        };

        console.log(groupify(helpColorPrints).join('\n'));

        return groupify(helpPlainPrints);
    }

    /**
     * 打印版本信息
     * @returns {string[]}
     */
    public printVersion(): string[] {
        const { _name: name, _banner: banner, _version: version } = this;
        const prints = [];

        if (banner) prints.push(banner, '');
        if (version) prints.push(`${name} ${version}`);
        if (prints.length > 0) console.log(prints.join('\n'));

        return prints;
    }

    /**
     * 解析入参
     * @param {string[]} argv
     */
    parse(argv: string[] = process.argv): void {
        const alias: Opts['alias'] = {};
        const boolean: Opts['boolean'] = [];
        const argv2 = argv.slice(2);
        const { longVersion, shortVersion, longHelp, shortHelp } = this._options;
        const execCommander = (commander?: CliCommander) => {
            void (async () => {
                await this._execCommanderAction(commander);
            })();
        };

        if (isString(longVersion)) {
            alias[longVersion] = shortVersion;
            boolean.push(longVersion);
        }

        if (isString(longHelp)) {
            alias[longHelp] = shortHelp;
            boolean.push(longHelp);
        }

        const parsed = minimist(argv2, {
            alias,
            boolean,
            '--': true
        });

        const { _ } = parsed;
        const { length: inputLength } = _;
        this._parsed = parsed;
        this._argv = argv2;
        this._injectVersion();
        this._injectHelp();

        const globalCommander = this._commanderMap.get(GLOBAL_SYMBOL);

        // 一定是全局命令
        if (inputLength === 0) {
            if (isString(longVersion) && parsed[longVersion]) this.printVersion();
            else if (isString(longHelp) && parsed[longHelp]) this.printHelp();
            else execCommander(globalCommander);
        }
        // 可能是局部命令（优先匹配）、全局命令
        else {
            const command = _[0];
            const normalCommander = this._commanderMap.get(command);

            if (isString(longHelp) && parsed[longHelp]) {
                this.printHelp(command);
                return;
            }

            // 有匹配的命令
            if (normalCommander) {
                execCommander(normalCommander);
            }
            // 有全局命令
            else if (globalCommander) {
                execCommander(globalCommander);
            }
            // 未匹配到任何命令
            else {
                execCommander();
            }
        }
    }

    _injectVersion(): void {
        if (this._versionInjected || !this._version) return;

        this._versionInjected = true;
        const { longVersion, shortVersion } = this._options;

        if (!isString(longVersion)) return;

        const globalCommander = this._commanderMap.get(GLOBAL_SYMBOL);

        if (!globalCommander) {
            throw new Error('必须配置全局命令才能注入 version 配置');
        }

        this._currentCommander = globalCommander;

        if (globalCommander.options[longVersion]) return;
        if (globalCommander.alias[shortVersion]) return;

        this.option(longVersion, shortVersion).type('boolean').message('打印版本信息');
    }

    /**
     * 注入帮助命令及帮助参数
     * @private
     */
    private _injectHelp(): void {
        if (this._helpInjected) return;

        this._helpInjected = true;
        const { longHelp, shortHelp } = this._options;

        if (!isString(longHelp)) return;

        for (const commander of this._commanderMap.values()) {
            this._currentCommander = commander;

            if (commander.options[longHelp]) continue;
            if (commander.alias[shortHelp]) continue;

            this.option(longHelp, shortHelp).type('boolean').message('打印帮助信息');
        }

        // 只有一个命令是不需要帮助命令的
        if (this._commanderMap.size === 1) return;

        // 已经存在了 help 命令
        if (this._commanderMap.get('help')) return;

        // 放在后面是为了
        // 避免给帮助命令添加帮助配置
        this.command('help')
            .argument('command', true)
            .desc('打印指定命令的帮助信息')
            .action((action) => {
                this.printHelp(action.arguments.command);
            });
    }

    async _execCommanderAction(commander?: CliCommander): Promise<void> {
        if (!commander) {
            this.emit('not-found', this._parsed);
            return;
        }

        const { debug, exit, exitCode } = this._options;
        const { _argv: argv } = this;
        const { action, alias, options } = commander;
        const string: Opts['string'] = [];
        const boolean: Opts['boolean'] = [];
        const defaults: Opts['default'] = {};

        objectEach(options, (option, key) => {
            const { type, long, default: dft } = option;

            defaults[long] = dft;

            switch (type) {
                case 'string':
                    string.push(long);
                    break;

                case 'boolean':
                    boolean.push(long);
                    break;
            }
        });

        const parsed = minimist(argv, {
            alias,
            string,
            boolean,
            default: defaults,
            '--': true
        });
        this._parsed = parsed;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const args = parseArguments(commander, parsed);

        if (args === null) {
            if (commander.global) {
                this.emit('not-found', parsed);
            } else {
                this.emit('not-match', commander);
            }

            return;
        }

        if (!isFunction(action)) {
            this.emit('no-action', commander);
            return;
        }

        try {
            await action({
                argv,
                parsed,
                arguments: args,
                command: parsed._[0] || null,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                options: parseOptions(commander, parsed),
                extras: parsed['--'] || []
            });
        } catch (err) {
            const errPrinter = new Printer();
            const stdErr = errorNormalize(err);

            if (debug) {
                errPrinter.pushLine().alone(stdErr.stack || '', ERROR_COLORS);
            } else {
                errPrinter.pushLine().alone(stdErr.message, ERROR_COLORS);
            }

            console.log(errPrinter.colorify().join('\n'));

            if (exit) process.exit(stdErr.exitCode || exitCode);
        }
    }

    private _registCommand(command: symbol | string): void {
        const commander = this._commanderMap.get(command);

        if (commander) {
            const label = command === GLOBAL_SYMBOL ? '全局命令' : `${command.toString()} 命令`;
            throw new Error(`${label}已经存在`);
        }

        this._currentCommander = {
            global: command === GLOBAL_SYMBOL,
            command: command,
            desc: '',
            usages: [],
            arguments: [],
            options: {},
            alias: {}
        };
        this._commanderMap.set(command, this._currentCommander);
    }
}
