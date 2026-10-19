<script lang="ts">
    interface Props {
        state: {
            mode: "count" | "greeting";
            title: string;
            days: number;
            daysLabel: string;
            clock: string;
            subtitle: string;
            greeting: string;
            greetingSub: string;
            soon: boolean;
            showTime: boolean;
            effects: boolean;
            progress: number;
        };
        labels: Record<string, string>;
        onSettings: () => void;
        onClose: () => void;
    }

    let { state, labels, onSettings, onClose }: Props = $props();

    const flakes = Array.from({ length: 18 }, (_, index) => ({
        left: (index * 5.6 + 3) % 100,
        delay: (index * 0.47) % 6,
        duration: 5 + ((index * 1.7) % 6),
        size: 3 + (index % 4),
        drift: ((index % 5) - 2) * 8,
    }));
</script>

<div class="nyc-card" class:nyc-card--soon={state.soon}>
    {#if state.effects}
        <div class="nyc-snow" aria-hidden="true">
            {#each flakes as flake, index (index)}
                <span
                    class="nyc-flake"
                    style={`left:${flake.left}%;animation-delay:-${flake.delay}s;animation-duration:${flake.duration}s;width:${flake.size}px;height:${flake.size}px;--drift:${flake.drift}px`}
                ></span>
            {/each}
        </div>
    {/if}

    <button type="button" class="nyc-gear" aria-label={labels.settings} title={labels.settings} onclick={onSettings}>
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M8 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path d="M8 1.6l.7 1.5 1.6-.3 1.4 1.4-.3 1.6 1.5.7v2l-1.5.7.3 1.6-1.4 1.4-1.6-.3-.7 1.5h-2l-.7-1.5-1.6.3-1.4-1.4.3-1.6L1.6 8V6l1.5-.7-.3-1.6 1.4-1.4 1.6.3.7-1.5h2Z" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round" />
        </svg>
    </button>

    <div class="nyc-content">
        {#if state.mode === "greeting"}
            <div class="nyc-greeting">{state.greeting}</div>
            <div class="nyc-greeting-sub">{state.greetingSub}</div>
        {:else}
            <div class="nyc-title">{state.title}</div>
            <div class="nyc-days">
                <span class="nyc-days-num">{state.days}</span>
                <span class="nyc-days-label">{state.daysLabel}</span>
            </div>
            {#if state.showTime}
                <div class="nyc-clock">{state.clock}</div>
            {/if}
            <div class="nyc-subtitle">{state.subtitle}</div>
            <div class="nyc-progress"><span style={`width:${state.progress}%`}></span></div>
        {/if}
    </div>

    <div class="nyc-actions">
        <span class="nyc-hint">{labels.hint}</span>
        <button type="button" class="b3-button" onclick={onClose}>{labels.close}</button>
    </div>
</div>

<style>
    .nyc-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 18px;
        height: 100%;
        min-height: 0;
        box-sizing: border-box;
        padding: 34px 28px 22px;
        overflow: hidden;
        border-radius: 10px;
        background: var(--b3-theme-background);
        color: var(--b3-theme-on-background);
        text-align: center;
    }

    .nyc-card--soon {
        box-shadow: inset 0 0 0 2px var(--b3-theme-primary);
    }

    .nyc-gear {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--b3-theme-on-surface);
        cursor: pointer;
    }

    .nyc-gear:hover {
        background: var(--b3-theme-surface);
        color: var(--b3-theme-primary);
    }

    .nyc-content {
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        max-width: 420px;
    }

    .nyc-title {
        color: var(--b3-theme-on-surface);
        font-size: 14px;
        letter-spacing: 0.02em;
    }

    .nyc-days {
        display: flex;
        align-items: baseline;
        gap: 8px;
    }

    .nyc-days-num {
        font-size: 76px;
        font-weight: 700;
        line-height: 1;
        color: var(--b3-theme-primary);
    }

    .nyc-days-label {
        color: var(--b3-theme-on-surface);
        font-size: 16px;
    }

    .nyc-clock {
        font-variant-numeric: tabular-nums;
        color: var(--b3-theme-on-surface);
        font-size: 20px;
        letter-spacing: 0.08em;
    }

    .nyc-subtitle {
        color: var(--b3-theme-on-surface);
        font-size: 13px;
    }

    .nyc-progress {
        width: 240px;
        height: 4px;
        overflow: hidden;
        border-radius: 2px;
        background: var(--b3-theme-surface);
    }

    .nyc-progress span {
        display: block;
        height: 100%;
        border-radius: 2px;
        background: var(--b3-theme-primary);
        transition: width 0.4s ease;
    }

    .nyc-greeting {
        font-size: 34px;
        font-weight: 700;
        color: var(--b3-theme-primary);
    }

    .nyc-greeting-sub {
        color: var(--b3-theme-on-surface);
        font-size: 14px;
    }

    .nyc-actions {
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 14px;
        margin-top: auto;
    }

    .nyc-hint {
        color: var(--b3-theme-on-surface);
        font-size: 11px;
        opacity: 0.75;
    }

    .nyc-snow {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
    }

    .nyc-flake {
        position: absolute;
        top: -8px;
        border-radius: 50%;
        background: var(--b3-theme-primary);
        opacity: 0.28;
        animation-name: nyc-fall;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
    }

    @keyframes nyc-fall {
        from {
            transform: translate(0, -10px);
        }
        to {
            transform: translate(var(--drift), 560px);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .nyc-flake {
            display: none;
        }
        .nyc-progress span {
            transition: none;
        }
    }
</style>
