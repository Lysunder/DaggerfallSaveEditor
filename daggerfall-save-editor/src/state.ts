import { atom } from 'recoil';

export const saveDataState = atom<any>({
  key: 'saveDataState',
  default: null,
});

export const filePathState = atom<string | null>({
  key: 'filePathState',
  default: null,
});
