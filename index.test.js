import { compareFiles } from './index';

describe('prioritize files', () => {
  it('should prioritize files', () => {
    const files = [
      { id: 'atest\\2-file', content: 'content1' },
      { id: 'atest\\4-file', content: 'content2' },
      { id: 'atest\\3-file', content: 'content3' },
      { id: 'VoiceCommandListener\\VoiceCommandListener.scss', content: "content4" },
      { id: 'design-system\\src\\styles\\1-reset.scss', content: "content5"},

    ];
    const sortedFiles = files.sort(compareFiles);
    expect(sortedFiles[0].id).toEqual('design-system\\src\\styles\\1-reset.scss');
    expect(sortedFiles[1].id).toEqual('atest\\2-file');
    expect(sortedFiles[2].id).toEqual('atest\\3-file');
    expect(sortedFiles[3].id).toEqual('atest\\4-file');


  });
})
