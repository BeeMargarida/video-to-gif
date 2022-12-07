import { children } from 'solid-js';
import type { Component } from 'solid-js';

import styles from './Alert.module.css';

type AlertProps = {
    status: "error" | "success";
    title: string;
    children: string;
    class?: string
}

const Alert: Component<AlertProps> = (props: AlertProps) => {
    const c = children(() => props.children);

    return (
        <div
            classList={{ [styles.root]: true, [styles[props.status]]: true, [props.class ?? '']: true }}
        >
            <div class={styles.title}>{props.title}</div>
            <div class={styles.content}>
                {c()}
            </div>
        </div>
    )
};

export default Alert;
