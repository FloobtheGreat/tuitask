import clipboard from 'clipboardy';

export interface ClipboardWriter {
  writeText(text: string): Promise<void>;
}

export const systemClipboard: ClipboardWriter = {
  async writeText(text) {
    await clipboard.write(text);
  },
};
