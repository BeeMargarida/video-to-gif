import { children, mergeProps } from 'solid-js';
import type { Component } from 'solid-js';

import styles from './Button.module.css';

type ButtonProps = {
    children: Element | string;
    variant?: string;
    disabled?: boolean;
    loading?: boolean
    onClick?: () => void;
}

const Button: Component<ButtonProps> = (props: ButtonProps) => {
    const merged = mergeProps({ variant: "filled", disabled: false, loading: false, onClick: () => {} }, props);
    const c = children(() => merged.children);
    
    return (
        <button
          classList={{ [styles.button]: true, [styles[merged.variant]]: true }}
          disabled={merged.disabled}
          onClick={merged.onClick}
        >
          {merged.loading ? <span class={styles.loader}/> : c()}
        </button>
    )
};

export default Button;
