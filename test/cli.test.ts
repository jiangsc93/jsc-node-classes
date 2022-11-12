import { ParsedArgs } from 'minimist';
import Cli, { chalk, CliAction, CliCommander, minimist } from '../src/cli';

test('导出 mini', () => {
    expect(typeof chalk.bold).toBe('function');
    expect(typeof minimist).toBe('function');
});

const toArgv = (str: string): string[] => ['node', 'demo'].concat(str.split(' '));

test('#action: 全局命令', () => {
    const cli = new Cli({ exit: false });
    const f = jest.fn();

    cli.name('x').global().option('abc', 'a').option('def').type('boolean').default(true).action(f).option('ghi');

    cli.parse(toArgv('-a www'));
    expect(f.mock.calls).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const action1: CliAction = f.mock.calls[0][0];
    // console.log(action1);
    expect(action1.command).toBe(null);
    expect(action1.arguments).toEqual({});
    expect(action1.options).toEqual({ abc: 'www', help: false, def: true });

    cli.parse(toArgv('--def=0'));
    expect(f.mock.calls).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const action2: CliAction = f.mock.calls[1][0];
    // console.log(action2);
    expect(action2.command).toBe(null);
    expect(action2.arguments).toEqual({});
    expect(action2.options).toEqual({ abc: undefined, help: false, def: true });
});

test('#action: 全局命令参数', () => {
    const cli = new Cli({ exit: false });
    const f = jest.fn();

    cli.on('not-found', f);
    cli.name('x');
    cli.global().argument('project-name').argument('project-type').action(f);
    cli.command('create').argument('project-name').argument('project-type').action(f);

    cli.parse(toArgv('my-project vue'));
    expect(f.mock.calls).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const action1: CliAction = f.mock.calls[0][0];
    // console.log(action1);
    expect(action1.arguments).toEqual({
        'project-name': 'my-project',
        projectName: 'my-project',
        'project-type': 'vue',
        projectType: 'vue'
    });

    cli.parse(toArgv('create my-project'));
    expect(f.mock.calls).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const action2: CliAction = f.mock.calls[1][0];
    // console.log(action2);
    expect(action2.arguments).toEqual({
        'project-name': 'my-project',
        projectName: 'my-project',
        'project-type': undefined,
        projectType: undefined
    });

    cli.parse(toArgv('a b c'));
    expect(f.mock.calls).toHaveLength(3);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const action3: ParsedArgs = f.mock.calls[2][0];
    // console.log(action3);
    expect(action3._).toEqual(['a', 'b', 'c']);
});

test('#action: 局部命令', () => {
    const cli = new Cli({ exit: false });
    const f = jest.fn();

    cli.name('x').global().command('lint').option('vue', 'v').action(f);

    cli.parse(toArgv('lint -v'));
    expect(f.mock.calls).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const action: CliAction = f.mock.calls[0][0];
    // console.log(action);
    expect(action.command).toBe('lint');
    expect(action.arguments).toEqual({});
    expect(action.options).toEqual({ vue: '', help: false });
});

test('#action 局部命令 + 配置', () => {
    const cli = new Cli({ exit: false });
    const f = jest.fn();

    cli.name('xxxxxx')
        .global()
        .command('create')
        .argument('project-name')
        .option('my-vue', 'v')
        .type('boolean')
        .action(f);

    cli.parse(toArgv('create abc -v'));
    expect(f.mock.calls).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const action: CliAction = f.mock.calls[0][0];
    // console.log(action);
    expect(action.command).toBe('create');
    expect(action.arguments).toEqual({ 'project-name': 'abc', projectName: 'abc' });
    expect(action.options).toEqual({
        'my-vue': true,
        myVue: true,
        help: false
    });
});

test('#action() --version', () => {
    const cli = new Cli({ exit: false });
    const f = jest.fn();

    cli.global().action(f);
    cli.parse(toArgv('--version'));
    expect(f.mock.calls).toHaveLength(0);
});

test('#action() --help', () => {
    const cli = new Cli({ exit: false });
    const f = jest.fn();

    cli.global().action(f);
    cli.parse(toArgv('--help'));
    expect(f.mock.calls).toHaveLength(0);
});

test('#action: not-found', () => {
    const cli = new Cli({ exit: false });
    const f = jest.fn();

    cli.on('not-found', f);
    cli.name('demo').global();
    cli.parse(toArgv('abc'));

    expect(f.mock.calls).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const parsed: ParsedArgs = f.mock.calls[0][0];
    // console.log(parsed);
    expect(parsed._).toEqual(['abc']);
});

test('#action: no-action', () => {
    const cli = new Cli({ exit: false });
    const f = jest.fn();

    cli.on('no-action', f);
    cli.name('demo').global();
    cli.command('abc');
    cli.parse(toArgv('abc'));

    expect(f.mock.calls).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const commander: CliCommander = f.mock.calls[0][0];
    // console.log(commander);
    expect(commander.global).toBe(false);
    expect(commander.command).toBe('abc');
});

test('#action: not-match', () => {
    const cli = new Cli({ exit: false });
    const f1 = jest.fn();
    const f2 = jest.fn();

    cli.on('not-match', f1);
    cli.name('demo').global().command('abc').argument('def').action(f2).parse(toArgv('abc def xyz'));

    expect(f1.mock.calls).toHaveLength(1);
    expect(f2.mock.calls).toHaveLength(0);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const commander: CliCommander = f1.mock.calls[0][0];
    // console.log(commander);
    expect(commander.global).toBe(false);
    expect(commander.command).toBe('abc');
});

test('#action: 全局 help/version', () => {
    const cli = new Cli({ exit: false });

    cli.name('xxxxx').version('1.2.3').global().desc('一个命令行');

    cli.parse(toArgv('--help'));
    cli.parse(toArgv('-h'));
    cli.parse(toArgv('--version'));
    cli.parse(toArgv('-v'));
});

test('#action: 局部 help', () => {
    const cli = new Cli({ exit: false });

    cli.name('xxxxx').version('1.2.3').global().desc('一个命令行').command('abc').desc('一个命令哦');

    cli.parse(toArgv('help abc'));
    cli.parse(toArgv('abc -h'));
});

test('#action: error', () => {
    const cli = new Cli({ debug: true, exit: false });

    cli.name('xxxxx')
        .version('1.2.3')
        .global()
        .action(() => {
            throw new Error('123');
        });

    cli.parse();
});

test('#printHelp() 全局帮助：没有用例', () => {
    const cli = new Cli({ exit: false });

    cli.bin('demo')
        .global()
        .desc('样例命令')
        .option('abc', 'a')
        .option('def', 'd')
        .message('指定德尔福')
        .option('override')
        .message('是否覆盖已有内容');

    const prints = cli.printHelp();
    let i = 0;
    expect(prints[i++]).toBe('Usages:');
    expect(prints[i++]).toBe('  demo [options] 样例命令');
    expect(prints[i++]).toBe('');
    expect(prints[i++]).toBe('Options:');
    expect(prints[i++]).toBe('  --abc, -a');
    expect(prints[i++]).toBe('  --def, -d      指定德尔福');
    expect(prints[i++]).toBe('  --override     是否覆盖已有内容');
    expect(prints[i++]).toBe(undefined);
});

test('#printHelp() 全局帮助：指定用例', () => {
    const cli = new Cli({ exit: false });

    cli.name('demo')
        .global()
        .desc('样例命令')
        .usage('demo web <web-dir>', '启动一个 web 服务')
        .usage('demo down <url> [dest]', '下载一个远程资源')
        .option('abc', 'a')
        .option('def', 'd')
        .message('指定德尔福')
        .option('override')
        .message('是否覆盖已有内容');

    const prints = cli.printHelp();
    let i = 0;
    expect(prints[i++]).toBe('Usages:');
    expect(prints[i++]).toBe('  样例命令');
    expect(prints[i++]).toBe('  demo web <web-dir>     启动一个 web 服务');
    expect(prints[i++]).toBe('  demo down <url> [dest] 下载一个远程资源');
    expect(prints[i++]).toBe('');
    expect(prints[i++]).toBe('Options:');
    expect(prints[i++]).toBe('  --abc, -a');
    expect(prints[i++]).toBe('  --def, -d              指定德尔福');
    expect(prints[i++]).toBe('  --override             是否覆盖已有内容');
    expect(prints[i++]).toBe(undefined);
});

test('#printHelp(command) 局部帮助：不含用例', () => {
    const cli = new Cli({ exit: false });

    cli.bin('demo')
        .command('didi')
        .desc('样例命令')
        .usage('web <web-dir>', '启动一个 web 服务')
        .usage('down <url> [dest]', '下载一个远程资源')
        .option('abc', 'a')
        .option('def', 'd')
        .message('指定德尔福')
        .option('override')
        .message('是否覆盖已有内容');

    const prints = cli.printHelp('didi');
    let i = 0;
    expect(prints[i++]).toBe('Usages:');
    expect(prints[i++]).toBe('  demo didi [options]    样例命令');
    expect(prints[i++]).toBe('  demo web <web-dir>     启动一个 web 服务');
    expect(prints[i++]).toBe('  demo down <url> [dest] 下载一个远程资源');
    expect(prints[i++]).toBe('');
    expect(prints[i++]).toBe('Options:');
    expect(prints[i++]).toBe('  --abc, -a');
    expect(prints[i++]).toBe('  --def, -d              指定德尔福');
    expect(prints[i++]).toBe('  --override             是否覆盖已有内容');
    expect(prints[i++]).toBe(undefined);
});

test('#prinetHelp() 包含 banner', () => {
    const cli = new Cli({ exit: false });

    cli.banner('BANNER').bin('demo').global().parse();

    const prints = cli.printHelp();
    let i = 0;
    expect(prints[i++]).toBe('BANNER');
    expect(prints[i++]).toBe('');
    expect(prints[i++]).toBe('Usages:');
    expect(prints[i++]).toBe('  demo [options]');
    expect(prints[i++]).toBe('');
    expect(prints[i++]).toBe('Options:');
    expect(prints[i++]).toBe('  --help, -h     打印帮助信息');
    expect(prints[i++]).toBe(undefined);
});

test('#prinetHelp() 换行', () => {
    const cli = new Cli({ exit: false });

    cli.banner('BANNER')
        .bin('demo')
        .global()
        .option('longlong', 'l')
        .type('string')
        .message(
            '一段很长的消息，还需要换行一段很长的消息，还需要换行\n一段很长的消息，还需要换行一段很长的消息，还需要换行\n一段很长的消息，还需要换行'
        )
        .parse();

    const prints = cli.printHelp();
    let i = 0;
    expect(prints[i++]).toBe('BANNER');
    expect(prints[i++]).toBe('');
    expect(prints[i++]).toBe('Usages:');
    expect(prints[i++]).toBe('  demo [options]');
    expect(prints[i++]).toBe('');
    expect(prints[i++]).toBe('Options:');
    expect(prints[i++]).toBe(
        '' /******************** 为了折行 *******************/ +
            '  --longlong, -l 一段很长的消息，还需要换行一段很长的消息，还需要换行\n' +
            '                 一段很长的消息，还需要换行一段很长的消息，还需要换行\n' +
            '                 一段很长的消息，还需要换行'
    );
    expect(prints[i++]).toBe('  --help, -h     打印帮助信息');
    expect(prints[i++]).toBe(undefined);
});

test('#printHelp(not-found-command): 不存在的命令', () => {
    const cli = new Cli({ exit: false });

    cli.name('demo').global().command('abc');

    const prints = cli.printHelp('def');
    let i = 0;
    expect(prints[i++]).toBe('Usages:');
    expect(prints[i++]).toBe('   <command> [options]');
    expect(prints[i++]).toBe('');
    expect(prints[i++]).toBe('Commands:');
    expect(prints[i++]).toBe('  abc');
    expect(prints[i++]).toBe(undefined);
});

test('#printVersion(): no banner', () => {
    const cli = new Cli({ exit: false });

    cli.name('demo').version('1.0.0');

    const prints = cli.printVersion();
    let i = 0;
    expect(prints[i++]).toBe('demo 1.0.0');
    expect(prints[i++]).toBe(undefined);
});

test('#printVersion(): has banner', () => {
    const cli = new Cli({ exit: false });

    cli.banner('BANNER').name('demo').version('1.0.0');

    const prints = cli.printVersion();
    let i = 0;
    expect(prints[i++]).toBe('BANNER');
    expect(prints[i++]).toBe('');
    expect(prints[i++]).toBe('demo 1.0.0');
    expect(prints[i++]).toBe(undefined);
});

describe('完整的命令行', () => {
    const cli = new Cli({ exit: false });

    cli.name('jsc-cli').bin('isc').version('1.2.3').global().desc('指令集团队集中式命令行');

    cli.command('create')
        .argument('project-name', true)
        .desc('创建一个指定类型的前端工程')
        .option('static-stack', 's')
        .message('前端静态工程')
        .option('full-stack', 'f')
        .message('前端全栈工程')
        .option('npm')
        .message('前端 NPM 工程');

    cli.command('build')
        .argument('project', true)
        .desc('构建一个前端工程')
        .usage('build <vue-project>', '构建 vue 工程')
        .usage('build <nuxt-project>', '构建 nuxt 工程')
        .usage('build <npm-project>', '构建 npm 工程');

    cli.parse();

    test('全局帮助', () => {
        const prints = cli.printHelp();

        let i = 0;
        expect(prints[i++]).toBe('Usages:');
        expect(prints[i++]).toBe('  isc <command> [options]         指令集团队集中式命令行');
        expect(prints[i++]).toBe('');
        expect(prints[i++]).toBe('Commands:');
        expect(prints[i++]).toBe('  create <project-name> [options] 创建一个指定类型的前端工程');
        expect(prints[i++]).toBe('  build <project> [options]       构建一个前端工程');
        expect(prints[i++]).toBe('  help <command>                  打印指定命令的帮助信息');
        expect(prints[i++]).toBe('');
        expect(prints[i++]).toBe('Options:');
        expect(prints[i++]).toBe('  --version, -v                   打印版本信息');
        expect(prints[i++]).toBe('  --help, -h                      打印帮助信息');
        expect(prints[i++]).toBe(undefined);
    });

    test('未知命令：全局帮助', () => {
        const prints = cli.printHelp('not-found');

        let i = 0;
        expect(prints[i++]).toBe('Usages:');
        expect(prints[i++]).toBe('  isc <command> [options]         指令集团队集中式命令行');
        expect(prints[i++]).toBe('');
        expect(prints[i++]).toBe('Commands:');
        expect(prints[i++]).toBe('  create <project-name> [options] 创建一个指定类型的前端工程');
        expect(prints[i++]).toBe('  build <project> [options]       构建一个前端工程');
        expect(prints[i++]).toBe('  help <command>                  打印指定命令的帮助信息');
        expect(prints[i++]).toBe('');
        expect(prints[i++]).toBe('Options:');
        expect(prints[i++]).toBe('  --version, -v                   打印版本信息');
        expect(prints[i++]).toBe('  --help, -h                      打印帮助信息');
        expect(prints[i++]).toBe(undefined);
    });

    test('局部帮助：有配置', () => {
        const prints = cli.printHelp('create');

        let i = 0;
        expect(prints[i++]).toBe('Usages:');
        expect(prints[i++]).toBe('  isc create <project-name> [options] 创建一个指定类型的前端工程');
        expect(prints[i++]).toBe('');
        expect(prints[i++]).toBe('Options:');
        expect(prints[i++]).toBe('  --static-stack, -s                  前端静态工程');
        expect(prints[i++]).toBe('  --full-stack, -f                    前端全栈工程');
        expect(prints[i++]).toBe('  --npm                               前端 NPM 工程');
        expect(prints[i++]).toBe('  --help, -h                          打印帮助信息');
        expect(prints[i++]).toBe(undefined);
    });

    test('局部帮助：无配置', () => {
        const prints = cli.printHelp('build');

        let i = 0;
        expect(prints[i++]).toBe('Usages:');
        expect(prints[i++]).toBe('  isc build <project>      构建一个前端工程');
        expect(prints[i++]).toBe('  isc build <vue-project>  构建 vue 工程');
        expect(prints[i++]).toBe('  isc build <nuxt-project> 构建 nuxt 工程');
        expect(prints[i++]).toBe('  isc build <npm-project>  构建 npm 工程');
        expect(prints[i++]).toBe('');
        expect(prints[i++]).toBe('Options:');
        expect(prints[i++]).toBe('  --help, -h               打印帮助信息');
        expect(prints[i++]).toBe(undefined);
    });
});

test('边界：只能配置一次全局命令', () => {
    const cli = new Cli({ exit: false });

    cli.name('demo').global();

    expect(() => cli.global()).toThrow('只能配置一次全局命令');
});

test('边界：配置类型时，必须先注册命令', () => {
    const cli = new Cli({ exit: false });

    cli.name('demo');

    expect(() => cli.type('string')).toThrow('必须先注册命令');
});

test('边界：配置类型时，必须先配置命令选项', () => {
    const cli = new Cli({ exit: false });

    cli.name('demo').global();

    expect(() => cli.type('string')).toThrow('必须先配置命令选项');
});

test('边界：全局命令配置选项不能重复', () => {
    const cli = new Cli({ exit: false });

    cli.name('demo').global().option('aa', 'a');

    expect(() => cli.option('aa')).toThrow('全局命令已经配置了 aa 长选项');
    expect(() => cli.option('bb', 'a')).toThrow('全局命令已经配置了 a 短选项');
});

test('边界：局部命令配置选项不能重复', () => {
    const cli = new Cli({ exit: false });

    cli.name('demo').command('didi').option('aa', 'a');

    expect(() => cli.option('aa')).toThrow('didi 命令已经配置了 aa 长选项');
    expect(() => cli.option('bb', 'a')).toThrow('didi 命令已经配置了 a 短选项');
});
