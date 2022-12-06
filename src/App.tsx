import { createSignal, onCleanup, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { createFFmpeg, fetchFile, type FFmpeg } from '@ffmpeg/ffmpeg';

import { Button, GithubIcon } from './components';
import styles from './App.module.css';

const App: Component = () => {
  let ffmpeg: FFmpeg;
  let input: any; // @TODO: fix this

  const [files, setFiles] = createSignal<File[]>([]);
  const [processing, setProcessing] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
 
  onMount(async () => {
    ffmpeg = createFFmpeg({ log: true });
    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    ffmpeg.setProgress(({ ratio }) => {
      setProgress(ratio);
    });

    ffmpeg.setLogger(({ type, message }) => {
      // @TODO: show alert messages if something goes wrong/right

      // console.log(type, message);
      /*
       * type can be one of following:
       *
       * info: internal workflow debug messages
       * fferr: ffmpeg native stderr output
       * ffout: ffmpeg native stdout output
       */
    });
  });

  onCleanup(() => ffmpeg.exit());
  
  async function videoToGif(): Promise<Uint8Array> {
    setProcessing(true);

    const file = files()[0];
    ffmpeg.FS('writeFile', file.name, await fetchFile(file));
    await ffmpeg.run('-i', file.name, '-vf', 'fps=30,scale=1080:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', '-loop', '0', 'test.gif');
    
    //@TODO: return gif with same name as original file
    const newFile = ffmpeg.FS('readFile', 'test.gif');
    
    return newFile;
  }

  async function downloadGif(data: ArrayBuffer) {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'export.gif');
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    link.remove();
  }

  function onFileClick() {
    if (!input) return;
    input.click();
  }

  function onInputChange(e: Event) {
    setFiles(Array.from((e.target as HTMLInputElement).files ?? []))
  }

  async function onConvertClick() {
    const gif = await videoToGif();
    downloadGif(gif.buffer);
    setProcessing(false);
  }

  return (
    <div class={styles.App}>
      <a class={styles.github} href="https://github.com/BeeMargarida/video-to-gif" target='_blank'>
        <GithubIcon />
      </a>
      <header class={styles.header}>
        <h1>Video to GIF</h1>
        <p>Convert your videos to GIF using the processing power of your PC</p>
        <p>(powered by ffmpeg using WASM)</p>
      </header>
      <div class={styles.buttons}>
        <Button onClick={onFileClick}>
          Upload your video
        </Button>
        <input
          ref={input}
          class={styles.input}
          type="file"
          onChange={onInputChange}
        >
          Add files here
        </input>
        <Button
          disabled={files().length === 0}
          loading={processing()}
          onClick={onConvertClick}
        >
          Convert
        </Button>
        {processing() ? (
          // <Progress progress={progress()}/>
          <div>{progress()}</div>
        ) : undefined}
      </div>
    </div>
  );
};

export default App;
