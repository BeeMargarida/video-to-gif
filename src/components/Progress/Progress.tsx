import type { Component } from 'solid-js';

import styles from './Progress.module.css';

type ProgressProps = {
    value: number;
}

const Progress: Component<ProgressProps> = (props: ProgressProps) => (
    <div class={styles.root}>
        <div class={styles.inner} style={{ width: `${props.value * 100}%` }} />
    </div>
);

export default Progress;
