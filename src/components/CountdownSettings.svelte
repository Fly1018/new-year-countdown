<script lang="ts">
    import { untrack } from "svelte";
    import { parseDateInput, type AutoPopup, type CountdownSettings } from "@/date";

    interface Props {
        labels: Record<string, string>;
        settings: CountdownSettings;
        onSave: (settings: CountdownSettings) => void;
        onCancel: () => void;
    }

    let { labels, settings, onSave, onCancel }: Props = $props();

    const initial = untrack(() => ({ ...settings }));
    let target = $state<CountdownSettings["target"]>(initial.target);
    let customDate = $state(initial.customDate);
    let autoPopup = $state<AutoPopup>(initial.autoPopup);
    let showTime = $state(initial.showTime);
    let effects = $state(initial.effects);
    let showBadge = $state(initial.showBadge);
    let error = $state("");

    function save() {
        error = "";
        if (target === "custom") {
            const date = parseDateInput(customDate);
            if (!date) {
                error = labels.invalidDate;
                return;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date.getTime() < today.getTime()) {
                error = labels.pastDate;
                return;
            }
        }
        onSave({
            target,
            customDate,
            autoPopup,
            showTime,
            effects,
            showBadge,
        });
    }

</script>

<div class="nyc-settings">
    <label class="nyc-field">
        <span class="nyc-field-label">{labels.targetLabel}</span>
        <select class="b3-select" bind:value={target}>
            <option value="gregorian">{labels.targetGregorian}</option>
            <option value="custom">{labels.targetCustom}</option>
        </select>
    </label>

    {#if target === "custom"}
        <label class="nyc-field">
            <span class="nyc-field-label">{labels.customDate}</span>
            <input class="b3-text-field" type="date" bind:value={customDate} />
        </label>
    {/if}

    <label class="nyc-field">
        <span class="nyc-field-label">{labels.popupLabel}</span>
        <select class="b3-select" bind:value={autoPopup}>
            <option value="daily">{labels.popupDaily}</option>
            <option value="weekly">{labels.popupWeekly}</option>
            <option value="once">{labels.popupOnce}</option>
            <option value="off">{labels.popupOff}</option>
        </select>
    </label>

    <label class="nyc-check">
        <input type="checkbox" class="b3-switch" bind:checked={showTime} />
        <span>{labels.showTime}</span>
    </label>
    <label class="nyc-check">
        <input type="checkbox" class="b3-switch" bind:checked={effects} />
        <span>{labels.effects}</span>
    </label>
    <label class="nyc-check">
        <input type="checkbox" class="b3-switch" bind:checked={showBadge} />
        <span>{labels.showBadge}</span>
    </label>

    {#if error}
        <div class="nyc-error">{error}</div>
    {/if}

    <div class="nyc-settings-actions">
        <button type="button" class="b3-button b3-button--cancel" onclick={onCancel}>{labels.cancel}</button>
        <button type="button" class="b3-button b3-button--text" onclick={save}>{labels.save}</button>
    </div>
</div>

<style>
    .nyc-settings {
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 100%;
        box-sizing: border-box;
        padding: 16px;
        overflow: auto;
    }

    .nyc-field {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .nyc-field-label {
        flex: none;
        width: 88px;
        color: var(--b3-theme-on-surface);
        font-size: 13px;
    }

    .nyc-field select,
    .nyc-field input {
        flex: 1;
        min-width: 0;
    }

    .nyc-check {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
    }

    .nyc-error {
        color: var(--b3-theme-error);
        font-size: 12px;
    }

    .nyc-settings-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: auto;
        padding-top: 12px;
    }
</style>
