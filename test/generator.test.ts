import { Generator } from '../src/generator';
import path from 'path';
import fse from 'fs-extra';

const parent = path.resolve('generator');
const source = path.resolve('generator/source');
const target = path.resolve('generator/target');

beforeEach(() => {
    fse.ensureDirSync(source);
    fse.emptyDirSync(source);
    fse.ensureDirSync(target);
    fse.emptyDirSync(target);
});

afterEach(() => {
    fse.removeSync(parent);
});

test('resolve', () => {
    const generator = new Generator({ source, target });

    expect(generator.resolveSource('1', '2')).toEqual(path.join(source, '1', '2'));
    expect(generator.resolveTarget('1', '2')).toEqual(path.join(target, '1', '2'));
});

test('copy one file', () => {
    const generator = new Generator({ source, target, logBase: 'my-proj' });

    const file = path.join(source, 'a/b/c/1.json');
    fse.outputJsonSync(file, { a: 1 });

    generator.copy('a/b/c/1.json', { log: false });
    generator.copy('a/b/c/1.json', 'x', { rename: () => '2.json' });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'a/b/c/1.json')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, '2.json')).a).toBe(1);
});

test('copy underscore file', () => {
    const generator = new Generator({ source, target });

    const file = path.join(source, 'a/b/c/__1.json');
    fse.outputJsonSync(file, { a: 1 });

    generator.copy('a/b/c/__1.json');
    generator.copy('a/b/c/__1.json', 'x', { rename: (src, dest) => path.join('y', src) });
    generator.copy('a/b/c/__1.json', 'z', { convertUnderscoreFile: false });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'a/b/c/_1.json')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'y/a/b/c/_1.json')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'z/a/b/c/__1.json')).a).toBe(1);
});

test('copy dot file', () => {
    const generator = new Generator({ source, target });

    const file = path.join(source, 'a/b/c/_1.json');
    fse.outputJsonSync(file, { a: 1 });

    generator.copy('a/b/c/_1.json');
    generator.copy('a/b/c/_1.json', 'x', { rename: (src, dest) => path.join('y', src) });
    generator.copy('a/b/c/_1.json', 'z', { convertDotFile: false });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'a/b/c/.1.json')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'y/a/b/c/.1.json')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'z/a/b/c/_1.json')).a).toBe(1);
});

test('copy ejs file', () => {
    const generator = new Generator({ source, target });

    const file = path.join(source, 'a/b/c/1.json.ejs');
    fse.outputJsonSync(file, { a: 1 });

    generator.copy('a/b/c/1.json.ejs');
    generator.copy('a/b/c/1.json.ejs', 'x', { rename: (src, dest) => path.join('y', src) });
    generator.copy('a/b/c/1.json.ejs', 'z', { convertDotFile: false });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'a/b/c/1.json.ejs')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'y/a/b/c/1.json.ejs')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'z/a/b/c/1.json.ejs')).a).toBe(1);
});

test('copy underscore + ejs file', () => {
    const generator = new Generator({ source, target });

    const file = path.join(source, 'a/b/c/__1.json.ejs');
    fse.outputJsonSync(file, { a: 1 });

    generator.copy('a/b/c/__1.json.ejs');
    generator.copy('a/b/c/__1.json.ejs', 'x', { rename: (src, dest) => path.join('y', src) });
    generator.copy('a/b/c/__1.json.ejs', 'z', { convertUnderscoreFile: false });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'a/b/c/_1.json.ejs')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'y/a/b/c/_1.json.ejs')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'z/a/b/c/__1.json.ejs')).a).toBe(1);
});

test('copy dot + ejs file', () => {
    const generator = new Generator({ source, target });

    const file = path.join(source, 'a/b/c/_1.json.ejs');
    fse.outputJsonSync(file, { a: 1 });

    generator.copy('a/b/c/_1.json.ejs');
    generator.copy('a/b/c/_1.json.ejs', 'x', { rename: (src, dest) => path.join('y', src) });
    generator.copy('a/b/c/_1.json.ejs', 'z', { convertDotFile: false });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'a/b/c/.1.json.ejs')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'y/a/b/c/.1.json.ejs')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'z/a/b/c/_1.json.ejs')).a).toBe(1);
});

test('copy one folder: no rename', () => {
    const generator = new Generator({ source, target });

    const file1 = path.join(source, 'a/b/c/1.json');
    fse.outputJsonSync(file1, { a: 1 });

    const file2 = path.join(source, 'a/b/c/.2.json');
    fse.outputJsonSync(file2, { b: 2 });

    const file3 = path.join(source, 'a/.b/c/3.json');
    fse.outputJsonSync(file3, { c: 3 });

    generator.copy('a', 'x');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'x/a/b/c/1.json')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'x/a/b/c/.2.json')).b).toBe(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'x/a/.b/c/3.json')).c).toBe(3);
});

test('copy one folder: rename', () => {
    const generator = new Generator({ source, target });

    const file1 = path.join(source, 'a/b/c/1.json');
    fse.outputJsonSync(file1, { a: 1 });

    const file2 = path.join(source, 'a/b/c/2.json');
    fse.outputJsonSync(file2, { b: 2 });

    const file3 = path.join(source, 'a/b/c/3.json');
    fse.outputJsonSync(file3, { c: 3 });

    generator.copy('a', 'x', {
        filter: (src) => !/\/3\.json$/.test(src),
        rename: (src, dest) => path.join('x', path.basename(src))
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'x/1.json')).a).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'x/2.json')).b).toBe(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.existsSync(path.join(target, 'x/3.json'))).toBe(false);
});

test('copy pattern: rename', () => {
    const generator = new Generator({ source, target });

    const file1 = path.join(source, 'a/b/c/1.json');
    fse.outputJsonSync(file1, { a: 1 });

    const file2 = path.join(source, 'a/b/c/2.json');
    fse.outputJsonSync(file2, { b: 2 });

    const file3 = path.join(source, 'a/b/c/3.json');
    fse.outputJsonSync(file3, { c: 3 });

    generator.copy('a/**/{2,3}.json', 'x', {
        filter: (src) => !/\/3\.json$/.test(src),
        rename: (src, dest) => path.join('x', path.basename(src))
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.existsSync(path.join(target, 'x/1.json'))).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.readJsonSync(path.join(target, 'x/2.json')).b).toBe(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fse.existsSync(path.join(target, 'x/3.json'))).toBe(false);
});

test('generate one file: no rename', () => {
    const generator = new Generator({ source, target });

    const value = Date.now().toString();
    const data = { value };
    const file = 'a/b/c/1.txt';
    const srcFile = generator.resolveSource(file);
    fse.outputFileSync(srcFile, '<%= value %>');

    generator.generate(file, data);

    const destFile = generator.resolveTarget(file);
    expect(fse.readFileSync(destFile, 'utf8')).toEqual(value);
});

test('generate one file: rename', () => {
    const generator = new Generator({ source, target });

    const value = Date.now().toString();
    const data = { value };
    const file = 'a/b/c/1.txt';
    const srcFile = generator.resolveSource(file);

    fse.outputFileSync(srcFile, '<%= value %>');
    generator.generate(file, '.', data, {
        rename: (src, dest) => path.join(dest, path.basename(src))
    });

    const destFile = generator.resolveTarget('1.txt');
    expect(fse.readFileSync(destFile, 'utf8')).toEqual(value);
});

test('generate dot file', () => {
    const generator = new Generator({ source, target });

    const value = Date.now().toString();
    const data = { value };
    const file = 'a/b/c/_1.txt';
    const srcFile = generator.resolveSource(file);

    fse.outputFileSync(srcFile, '<%= value %>');
    generator.generate(file, '.', data);

    expect(fse.readFileSync(path.join(target, 'a/b/c/.1.txt'), 'utf8')).toEqual(value);
});

test('generate ejs file', () => {
    const generator = new Generator({ source, target });

    const value = Date.now().toString();
    const data = { value };
    const file = 'a/b/c/1.txt.ejs';
    const srcFile = generator.resolveSource(file);

    fse.outputFileSync(srcFile, '<%= value %>');
    generator.generate(file, data);

    expect(fse.readFileSync(path.join(target, 'a/b/c/1.txt'), 'utf8')).toEqual(value);
});

test('generate dot + ejs file', () => {
    const generator = new Generator({ source, target });

    const value = Date.now().toString();
    const data = { value };
    const file = 'a/b/c/_1.txt.ejs';
    const srcFile = generator.resolveSource(file);

    fse.outputFileSync(srcFile, '<%= value %>');
    generator.generate(file, data);

    expect(fse.readFileSync(path.join(target, 'a/b/c/.1.txt'), 'utf8')).toEqual(value);
});

test('generate one folder: no rename', () => {
    const generator = new Generator({ source, target });

    const value1 = Date.now().toString();
    const value2 = Math.random().toString();
    const data = { value1, value2 };

    const file1 = 'a/b/c/1.txt';
    const srcFile1 = generator.resolveSource(file1);
    fse.outputFileSync(srcFile1, '<%= value1 %>');

    const file2 = 'a/b/c/d/2.txt';
    const srcFile2 = generator.resolveSource(file2);
    fse.outputFileSync(srcFile2, '<%= value2 %>');

    const file3 = 'a/b/c/d/3.txt';
    const srcFile3 = generator.resolveSource(file3);
    fse.outputFileSync(srcFile3, '<%= value3 %>');

    generator.generate('a', data, {
        filter: (src) => !/\/3\.txt$/.test(src)
    });

    expect(fse.readFileSync(path.join(target, file1), 'utf8')).toEqual(value1);
    expect(fse.readFileSync(path.join(target, file2), 'utf8')).toEqual(value2);
    expect(fse.existsSync(path.join(target, file3))).toEqual(false);
});

test('generate one folder: rename', () => {
    const generator = new Generator({ source, target });
    const value1 = Date.now().toString();
    const value2 = Math.random().toString();
    const data = { value1, value2 };

    const file1 = 'a/b/c/1.txt';
    const srcFile1 = generator.resolveSource(file1);
    fse.outputFileSync(srcFile1, '<%= value1 %>');

    const file2 = 'a/b/c/d/2.txt';
    const srcFile2 = generator.resolveSource(file2);
    fse.outputFileSync(srcFile2, '<%= value2 %>');

    const file3 = 'a/b/c/d/3.txt';
    const srcFile3 = generator.resolveSource(file3);
    fse.outputFileSync(srcFile3, '<%= value3 %>');

    generator.generate('a', '.', data, {
        filter: (src) => !/\/3\.txt$/.test(src),
        rename: (src, dest) => path.join(dest, path.basename(src))
    });

    expect(fse.readFileSync(path.join(target, '1.txt'), 'utf8')).toEqual(value1);
    expect(fse.readFileSync(path.join(target, '2.txt'), 'utf8')).toEqual(value2);
    expect(fse.existsSync(path.join(target, '3.txt'))).toEqual(false);
});

test('generate pattern: rename', () => {
    const generator = new Generator({ source, target });
    const value1 = Date.now().toString();
    const value2 = Math.random().toString();
    const data = { value1, value2 };

    const file1 = 'a/b/c/1.txt';
    const srcFile1 = generator.resolveSource(file1);
    fse.outputFileSync(srcFile1, '<%= value1 %>');

    const file2 = 'a/b/c/d/2.txt';
    const srcFile2 = generator.resolveSource(file2);
    fse.outputFileSync(srcFile2, '<%= value2 %>');

    const file3 = 'a/b/c/d/3.txt';
    const srcFile3 = generator.resolveSource(file3);
    fse.outputFileSync(srcFile3, '<%= value3 %>');

    generator.generate('a/**/*.txt', '.', data, {
        filter: (src) => !/\/3\.txt$/.test(src),
        rename: (src, dest) => path.join(dest, path.basename(src))
    });

    expect(fse.readFileSync(path.join(target, '1.txt'), 'utf8')).toEqual(value1);
    expect(fse.readFileSync(path.join(target, '2.txt'), 'utf8')).toEqual(value2);
    expect(fse.existsSync(path.join(target, '3.txt'))).toEqual(false);
});

test('create one file', () => {
    const generator = new Generator({ source, target });
    const value1 = Date.now().toString();
    const value2 = Buffer.from(Math.random().toString());

    const file1 = 'x/y/z/1.txt';
    generator.create(file1, value1);
    expect(fse.readFileSync(generator.resolveTarget(file1), 'utf8')).toEqual(value1);

    const file2 = 'x/y/z/2.txt';
    generator.create(file2, value2);
    expect(fse.readFileSync(generator.resolveTarget(file2), 'utf8')).toEqual(value2.toString());
});
