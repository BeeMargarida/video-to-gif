import { createSignal, onCleanup, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { createFFmpeg, fetchFile, type FFmpeg } from '@ffmpeg/ffmpeg';

import { Alert, Button, GithubIcon, Progress } from './components';
import styles from './App.module.css';

const TYPE_LOG_OUT = "ffout";
const TYPE_LOG_ERR = "fferr";
const MESSAGE_LOG_END = "FFMPEG_END";
const MESSAGE_LOG_ERR_OOM = "pthread sent an error";

const App: Component = () => {
  let ffmpeg: FFmpeg;
  let input: any; // @TODO: fix this

  const [files, setFiles] = createSignal<File[]>([]);
  const [processing, setProcessing] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  const [error, setError] = createSignal<string | null>("");
  const [success, setSuccess] = createSignal<string | null>("");

  onMount(async () => {
    ffmpeg = createFFmpeg({ log: true });
    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    ffmpeg.setProgress(({ ratio }) => {
      setProgress(ratio);
    });

    ffmpeg.setLogger(({ type, message }) => {
      if (message === MESSAGE_LOG_END && type === TYPE_LOG_OUT) {
        setSuccess("The file was successfully converted to a GIF.");
        return;
      }

      if (type === TYPE_LOG_ERR && message.includes(MESSAGE_LOG_ERR_OOM)) {
        const file = files()[0];
        const fileName = (file.name.substring(0, file.name.lastIndexOf('.')) || file.name) + ".gif";

        setError(`The file provided is too big. Please try doing it locally with the command 'ffmpeg -i ${file.name} -vf "fps=20,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 ${fileName}'`);
        setProcessing(false);

        ffmpeg.FS("unlink", file.name);
        ffmpeg.FS("unlink", fileName);
        ffmpeg.exit();

      }
    });

    window.onerror = () => {
      setError("An error occured while converting. Check if your file is not too big.");
      setProcessing(false); 
      ffmpeg.exit();
    }
  });

  onCleanup(() => ffmpeg.exit());

  async function videoToGif(file: File, fileName: string): Promise<Uint8Array> {
    ffmpeg.FS('writeFile', file.name, await fetchFile(file));
    await ffmpeg.run('-i', file.name, '-vf', 'fps=20,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', '-loop', '0', fileName);
    return ffmpeg.FS('readFile', fileName);
  }

  async function downloadGif(data: ArrayBuffer, fileName: string) {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    link.remove();

    ffmpeg.FS("unlink", fileName);
  }

  function onFileClick() {
    if (!input) return;
    input.click();
  }

  function onInputChange(e: Event) {
    setFiles(Array.from((e.target as HTMLInputElement).files ?? []))
  }

  async function onConvertClick() {
    setProcessing(true);

    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    const file = files()[0];
    const fileName = (file.name.substring(0, file.name.lastIndexOf('.')) || file.name) + ".gif";
    const gif = await videoToGif(file, fileName);
    downloadGif(gif.buffer, fileName);

    setProcessing(false); 
  }

  return (
    <div class={styles.App}>
      <a class={styles.github} href="https://github.com/BeeMargarida/video-to-gif" target='_blank'>
        <GithubIcon />
      </a>
      <header class={styles.header}>
        <h1>Video to GIF</h1>
        <p>Convert your videos to GIF using the processing power of your PC,<br />powered by ffmpeg using WASM.</p>
        <p class={styles.note}>Please bear in mind that files bigger than 2MB might cause Out of Memory errors.</p>
      </header>
      <div class={styles.buttons}>
        <div class={styles.inputWrapper}>
          <Button onClick={onFileClick} variant="light">
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
          <div class={styles.name}>{files()?.[0]?.name}</div>
        </div>
        <Button
          disabled={files().length === 0}
          loading={processing()}
          onClick={onConvertClick}
        >
          Convert
        </Button>
        {processing() ? (
          <Progress value={progress()} />
        ) : undefined}
        {error() ? (
          <Alert
            class={styles.alert}
            status="error"
            title="Oops"
          >
            {error() as string}
          </Alert>
        ) : undefined}
        {success() ? (
          <Alert
            class={styles.alert}
            status="success"
            title="Success"
          >
            {success() as string}
          </Alert>
        ) : undefined}
      </div>
    </div>
  );
};

export default App;
