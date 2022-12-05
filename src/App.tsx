import { createSignal, onCleanup, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { createFFmpeg, fetchFile, type FFmpeg } from '@ffmpeg/ffmpeg';

import styles from './App.module.css';

const App: Component = () => {
  let ffmpeg: FFmpeg;
  let input: HTMLInputElement = null;

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
  
  async function videoToGif() {
    setProcessing(true);

    const file = files()[0];
    ffmpeg.FS('writeFile', file.name, await fetchFile(file));
    await ffmpeg.run('-i', file.name, '-vf', 'fps=30,scale=1080:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', '-loop', '0', 'test.gif');
    const newFile = ffmpeg.FS('readFile', 'test.gif');
    
    downloadGif(newFile.buffer);
    setProcessing(false);
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

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <h1>Video to GIF</h1>
        <p>Convert your videos to GIF using the processing power of your PC (powered by ffmpeg using WASM)</p>
      </header>

      <div>
        <button class={styles.filesButton} onClick={onFileClick}>Upload your video</button>
        <input ref={input} class={styles.input} type="file" onChange={onInputChange}>Add files here</input>
        <button class={styles.submit} onClick={videoToGif}>Test</button>
        {processing() ? (
          // <Progress progress={progress()}/>
          <div>{progress()}</div>
        ) : undefined}
      </div>
    </div>
  );
};

export default App;
