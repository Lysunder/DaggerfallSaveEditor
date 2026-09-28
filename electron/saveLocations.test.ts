import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  emptySettings,
  findEnclosingPortableInstall,
  findInstallBaseDir,
  isSaveFolderInRoots,
  listSaves,
  readSaveSetting,
  readSettingsFile,
  regularPersistentDir,
  resolveFolder,
  resolveLocations,
  resolvePortable,
  resolveSaveRoot,
  writeSettingsFile,
} from './saveLocations';
import type { SaveLocation } from './saveTypes';

let tmp: string;

const write = async (relative: string, content = '') => {
  const file = path.join(tmp, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
  return file;
};
const mkdir = async (relative: string) => {
  const dir = path.join(tmp, relative);
  await fs.mkdir(dir, { recursive: true });
  return dir;
};
const saveInfo = (characterName: string, saveName: string) =>
  JSON.stringify({ saveVersion: 1, saveName, characterName, dateAndTime: { gameTime: 12617127056, realTime: 639261171192014848 }, dfuVersion: '1.1.1' });
const ini = (savePath?: string) =>
  `[Daggerfall]\nMyDaggerfallPath = C:\\dosgames\\DAGGER\n${savePath === undefined ? '' : `MyDaggerfallUnitySavePath = ${savePath}\n`}\n[Video]\nResolutionWidth = 1920\n`;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'dfse-'));
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('regularPersistentDir', () => {
  it('uses Unity persistentDataPath per platform', () => {
    expect(regularPersistentDir({ platform: 'win32', homedir: 'H' })).toBe(path.join('H', 'AppData', 'LocalLow', 'Daggerfall Workshop', 'Daggerfall Unity'));
    expect(regularPersistentDir({ platform: 'darwin', homedir: 'H' })).toBe(path.join('H', 'Library', 'Application Support', 'Daggerfall Workshop', 'Daggerfall Unity'));
    expect(regularPersistentDir({ platform: 'linux', homedir: 'H' })).toBe(path.join('H', '.config', 'unity3d', 'Daggerfall Workshop', 'Daggerfall Unity'));
  });
});

describe('readSaveSetting', () => {
  it('reads MyDaggerfallUnitySavePath from the [Daggerfall] section', async () => {
    await write('data/settings.ini', ini('D:\\Saves'));
    expect(await readSaveSetting(path.join(tmp, 'data'))).toBe('D:\\Saves');
  });

  it('treats a blank value or missing file as unset', async () => {
    await write('blank/settings.ini', ini(''));
    await mkdir('none');
    expect(await readSaveSetting(path.join(tmp, 'blank'))).toBeUndefined();
    expect(await readSaveSetting(path.join(tmp, 'none'))).toBeUndefined();
  });

  it('accepts a distribution-suffixed settings file', async () => {
    await write('dist/settings_mydist.ini', ini('Saves'));
    expect(await readSaveSetting(path.join(tmp, 'dist'))).toBe('Saves');
  });

  it('ignores the key in other sections', async () => {
    await write('other/settings.ini', '[Video]\nMyDaggerfallUnitySavePath = Nope\n');
    expect(await readSaveSetting(path.join(tmp, 'other'))).toBeUndefined();
  });
});

describe('resolvePortable', () => {
  const install = () => path.join(tmp, 'DFU');

  beforeEach(async () => {
    await write('DFU/Portable.txt');
    await mkdir('DFU/PortableAppdata/Saves');
  });

  it('defaults to PortableAppdata/Saves', async () => {
    expect(await resolvePortable(install())).toEqual({ root: path.join(install(), 'PortableAppdata', 'Saves') });
  });

  it('resolves a relative save path against the install folder, not PortableAppdata', async () => {
    await write('DFU/PortableAppdata/settings.ini', ini('Saves'));
    await mkdir('DFU/Saves');
    expect(await resolvePortable(install())).toEqual({ root: path.join(install(), 'Saves') });
  });

  it('uses an absolute save path as-is', async () => {
    const elsewhere = await mkdir('elsewhere');
    await write('DFU/PortableAppdata/settings.ini', ini(elsewhere));
    expect(await resolvePortable(install())).toEqual({ root: elsewhere });
  });

  it('falls back to PortableAppdata/Saves when the configured folder is missing', async () => {
    await write('DFU/PortableAppdata/settings.ini', ini('Missing'));
    const result = await resolvePortable(install());
    expect(result.root).toBe(path.join(install(), 'PortableAppdata', 'Saves'));
    expect(result.warning).toMatch(/doesn't exist/);
  });

  it('reports an install that is no longer portable or no longer there', async () => {
    await fs.rm(path.join(install(), 'Portable.txt'));
    expect((await resolvePortable(install())).root).toBeNull();
    expect((await resolvePortable(path.join(tmp, 'Gone'))).warning).toMatch(/not found/);
  });
});

describe('resolveSaveRoot (regular install)', () => {
  it('ignores a relative save path when the install folder is unknown, and resolves it when known', async () => {
    const data = await mkdir('LocalLow/DFU');
    await write('LocalLow/DFU/settings.ini', ini('MySaves'));
    const installDir = await mkdir('Games/DFU');
    await mkdir('Games/DFU/MySaves');

    const unknown = await resolveSaveRoot(data);
    expect(unknown.root).toBe(path.join(data, 'Saves'));
    expect(unknown.warning).toMatch(/relative path/);

    expect(await resolveSaveRoot(data, installDir)).toEqual({ root: path.join(installDir, 'MySaves') });
  });

  it('returns no root when the data folder does not exist', async () => {
    expect((await resolveSaveRoot(path.join(tmp, 'nope'))).root).toBeNull();
  });
});

describe('findInstallBaseDir', () => {
  it('detects portable and regular installs', async () => {
    await write('Portable/Portable.txt');
    await mkdir('Regular/DaggerfallUnity_Data');
    await mkdir('Random');
    expect(await findInstallBaseDir(path.join(tmp, 'Portable'))).toEqual({ baseDir: path.join(tmp, 'Portable'), portable: true });
    expect(await findInstallBaseDir(path.join(tmp, 'Regular'))).toEqual({ baseDir: path.join(tmp, 'Regular'), portable: false });
    expect(await findInstallBaseDir(path.join(tmp, 'Random'))).toBeNull();
  });

  it('looks inside a macOS app bundle for Portable.txt', async () => {
    await write('Mac/DaggerfallUnity.app/Contents/MacOS/Portable.txt');
    expect(await findInstallBaseDir(path.join(tmp, 'Mac', 'DaggerfallUnity.app'))).toEqual({
      baseDir: path.join(tmp, 'Mac', 'DaggerfallUnity.app', 'Contents', 'MacOS'),
      portable: true,
    });
  });
});

describe('findEnclosingPortableInstall', () => {
  it('recognises PortableAppdata and its Saves folder as part of the install', async () => {
    await write('DFU/Portable.txt');
    const saves = await mkdir('DFU/PortableAppdata/Saves');
    expect(await findEnclosingPortableInstall(saves)).toBe(path.join(tmp, 'DFU'));
    expect(await findEnclosingPortableInstall(await mkdir('Other/Saves'))).toBeNull();
  });
});

describe('resolveFolder', () => {
  it('uses a folder of save folders directly, or a data folder via its Saves subfolder', async () => {
    await write('Direct/SAVE0/SaveInfo.txt', saveInfo('Lys', 'One'));
    await mkdir('Data/Saves');
    expect(await resolveFolder(path.join(tmp, 'Direct'))).toEqual({ root: path.join(tmp, 'Direct') });
    expect(await resolveFolder(path.join(tmp, 'Data'))).toEqual({ root: path.join(tmp, 'Data', 'Saves') });
  });
});

describe('listSaves', () => {
  it('lists SAVE<n> folders with SaveInfo.txt and flags unreadable ones', async () => {
    await write('Saves/SAVE0/SaveInfo.txt', saveInfo('Lys', 'QuickSave'));
    await write('Saves/SAVE0/Screenshot.jpg', 'jpg');
    await write('Saves/SAVE12/SaveInfo.txt', '{ not json');
    await mkdir('Saves/SAVE3'); // no SaveInfo.txt, so DFU ignores it
    await write('Saves/Backup/SaveInfo.txt', saveInfo('Lys', 'Nope'));

    const location: SaveLocation = { id: 'regular', type: 'regular', label: 'Default', root: path.join(tmp, 'Saves'), removable: false };
    const slots = (await listSaves(location)).sort((a, b) => a.index - b.index);

    expect(slots.map((slot) => slot.folderName)).toEqual(['SAVE0', 'SAVE12']);
    expect(slots[0]).toMatchObject({ index: 0, hasScreenshot: true, info: { characterName: 'Lys', saveName: 'QuickSave' } });
    expect(slots[1]).toMatchObject({ index: 12, hasScreenshot: false, info: null });
    expect(slots[1].error).toMatch(/SaveInfo\.txt/);
  });
});

describe('isSaveFolderInRoots', () => {
  it('only accepts SAVE<n> folders directly inside a root', () => {
    const root = path.join(tmp, 'Saves');
    expect(isSaveFolderInRoots(path.join(root, 'SAVE4'), [root])).toBe(true);
    expect(isSaveFolderInRoots(root, [root])).toBe(false);
    expect(isSaveFolderInRoots(path.join(root, 'SAVE4', 'SAVE5'), [root])).toBe(false);
    expect(isSaveFolderInRoots(path.join(root, '..', 'SAVE4'), [root])).toBe(false);
    expect(isSaveFolderInRoots(path.join(root, 'Other'), [root])).toBe(false);
    expect(isSaveFolderInRoots(path.join(tmp, 'Elsewhere', 'SAVE1'), [root])).toBe(false);
  });
});

describe('resolveLocations and the settings file', () => {
  it('combines the regular location with added installs, including missing ones', async () => {
    const env = { platform: 'win32' as const, homedir: await mkdir('home') };
    await mkdir('home/AppData/LocalLow/Daggerfall Workshop/Daggerfall Unity/Saves');
    await write('DFU/Portable.txt');
    await mkdir('DFU/PortableAppdata/Saves');

    const settingsPath = path.join(tmp, 'editor', 'settings.json');
    await writeSettingsFile(settingsPath, { ...emptySettings(), portableInstalls: [path.join(tmp, 'DFU'), path.join(tmp, 'Moved')] });
    const locations = await resolveLocations(await readSettingsFile(settingsPath), env);

    expect(locations.map((l) => [l.id, l.label, !!l.root])).toEqual([
      ['regular', 'Default', true],
      [`portable:${path.join(tmp, 'DFU')}`, 'Portable – DFU', true],
      [`portable:${path.join(tmp, 'Moved')}`, 'Portable – Moved', false],
    ]);
    expect(locations[2].warning).toMatch(/not found/);
  });

  it('returns empty settings for a missing or corrupt file', async () => {
    expect(await readSettingsFile(path.join(tmp, 'missing.json'))).toEqual(emptySettings());
    expect(await readSettingsFile(await write('bad.json', '{'))).toEqual(emptySettings());
  });
});
