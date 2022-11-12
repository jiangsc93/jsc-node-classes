import { Printer } from '../src/cli';

test('#pushLine 纯色', () => {
    const printer = new Printer();

    printer.pushLine().left('abc').right('红啊红啊');
    printer.pushLine().left('defdef').right('密麻麻密麻麻');

    const prints = printer.plainify();
    console.log(printer.colorify().join('\n'));
    let i = 0;
    expect(prints[i++]).toBe('abc    红啊红啊');
    expect(prints[i++]).toBe('defdef 密麻麻密麻麻');
    expect(prints[i++]).toBe(undefined);
    expect(printer.length).toBe(i - 1);
});

test('#unshiftLine 带色', () => {
    const printer = new Printer();

    printer.unshiftLine().left('abc', ['bold', 'green']).right('红啊红啊');
    printer.unshiftLine().left('defdef', ['bold', 'yellow']).right('密麻麻密麻麻');

    const prints = printer.plainify();
    console.log(printer.colorify().join('\n'));
    let i = 0;
    expect(prints[i++]).toBe('defdef 密麻麻密麻麻');
    expect(prints[i++]).toBe('abc    红啊红啊');
    expect(prints[i++]).toBe(undefined);
    expect(printer.length).toBe(i - 1);
});

test('独立一行', () => {
    const printer = new Printer();

    printer.pushLine().alone('alone');
    printer.unshiftLine().left('defdef', ['bold', 'yellow']).right('密麻麻密麻麻');

    const prints = printer.plainify();
    console.log(printer.colorify().join('\n'));
    let i = 0;
    expect(prints[i++]).toBe('defdef 密麻麻密麻麻');
    expect(prints[i++]).toBe('alone');
    expect(prints[i++]).toBe(undefined);
    expect(printer.length).toBe(i - 1);
});

test('自由设置左宽度', () => {
    const printer = new Printer();

    printer.pushLine().left('a').right('好');
    printer.pushLine().left('bcdef');

    printer.leftWidth = 10;
    const prints = printer.plainify();
    let i = 0;
    expect(prints[i++]).toBe('a          好');
    expect(prints[i++]).toBe('bcdef');
    expect(prints[i++]).toBe(undefined);
    expect(printer.length).toBe(i - 1);
});

test('#边界：必须先定义行', () => {
    const printer = new Printer();

    expect(() => printer.left('1')).toThrow('定义');
    expect(() => printer.right('1')).toThrow('定义');
});
