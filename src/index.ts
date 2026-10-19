import { Plugin } from "siyuan";
import { svelteDialog } from "@/libs/dialog";
import CountdownCard from "@/components/CountdownCard.svelte";
import CountdownSettingsPanel from "@/components/CountdownSettings.svelte";
import { countdownState } from "@/countdown-state.svelte";
import {
    ONE_DAY,
    SOON_DAYS,
    format,
    normalizeSettings,
    pad2,
    remainingDays,
    shouldAutoShow,
    targetInfo,
    type CountdownSettings,
} from "@/date";
import "./index.scss";

const SETTINGS_KEY = "new-year-countdown-settings";
const LAST_KEY = "new-year-countdown-last-auto-shown";
const LEGACY_KEY = "new-year-countdown-last-shown";

const ICON_SVG = '<symbol id="iconNewYearCountdown" viewBox="0 0 32 32">' +
    '<circle cx="16" cy="16" r="10.5" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<path d="M16 10v6l4 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M16 2.5v2M29.5 16h-2M16 29.5v-2M2.5 16h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>';

export default class NewYearCountdown extends Plugin {
    private disposed = false;
    private settings: CountdownSettings = normalizeSettings(null);
    private lastAutoShown = 0;
    private topBarButton: HTMLElement | null = null;
    private badgeEl: HTMLSpanElement | null = null;
    private badgeTimer: number | null = null;
    private countdownTimer: number | null = null;
    private countdownDialog: ReturnType<typeof svelteDialog> | undefined;
    private settingsDialog: ReturnType<typeof svelteDialog> | undefined;

    onload() {
        this.disposed = false;
        try {
            this.addIcons(ICON_SVG);
        } catch (error) {
            console.error("[new-year-countdown] addIcons failed", error);
        }
    }

    async onLayoutReady() {
        if (this.disposed) return;
        await this.initStorage();
        if (this.disposed) return;

        if (!this.topBarButton) {
            try {
                this.topBarButton = (this.addTopBar as any)({
                    icon: "iconNewYearCountdown",
                    title: this.t("topBarTitle", "New Year Countdown"),
                    position: "right",
                    callback: () => {
                        if (!this.disposed) this.openCountdown();
                    },
                    contextMenu: (menu: any) => {
                        menu.addItem({
                            icon: "iconNewYearCountdown",
                            label: this.t("openCountdown", "Open countdown"),
                            click: () => this.openCountdown(),
                        });
                        menu.addItem({
                            icon: "iconSettings",
                            label: this.t("settings", "Settings"),
                            click: () => this.openSettings(),
                        });
                    },
                }) as HTMLElement;
                if (this.topBarButton) {
                    this.topBarButton.classList.add("nyc-topbar");
                    this.badgeEl = document.createElement("span");
                    this.badgeEl.className = "nyc-badge";
                    this.badgeEl.setAttribute("aria-hidden", "true");
                    this.topBarButton.appendChild(this.badgeEl);
                }
            } catch (error) {
                console.error("[new-year-countdown] addTopBar failed", error);
            }
        }
        if (this.badgeTimer === null) {
            this.badgeTimer = window.setInterval(() => this.updateBadge(), 60000);
        }
        this.updateBadge();

        if (shouldAutoShow(this.settings, this.lastAutoShown)) {
            this.openCountdown();
            if (this.countdownDialog) this.setLastShown(Date.now());
        }
    }

    onunload() {
        this.disposed = true;
        this.clearTimers();
        this.countdownDialog?.close();
        this.settingsDialog?.close();
        this.countdownDialog = undefined;
        this.settingsDialog = undefined;
        this.badgeEl?.remove();
        this.badgeEl = null;
        this.topBarButton = null;
    }

    private t(key: string, fallback: string): string {
        const value = (this.i18n as Record<string, unknown>)[key];
        return typeof value === "string" && value ? value : fallback;
    }

    private labels(): Record<string, string> {
        const keys = [
            "title", "titleCustom", "topBarTitle", "topBarTip", "day", "subtitle",
            "subtitleSoon", "subtitleTomorrow", "greeting", "greetingSub",
            "customGreeting", "customGreetingSub", "passed", "passedSub", "close",
            "hint", "settings", "save", "cancel", "targetLabel", "targetGregorian",
            "targetCustom", "customDate", "popupLabel", "popupDaily", "popupWeekly",
            "popupOnce", "popupOff", "showTime", "effects", "showBadge",
            "invalidDate", "pastDate", "openCountdown",
        ];
        const result: Record<string, string> = {};
        for (const key of keys) result[key] = this.t(key, key);
        return result;
    }

    private readLocal(key: string): string | null {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    private writeLocal(key: string, value: string) {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            // storage unavailable
        }
    }

    private removeLocal(key: string) {
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            // storage unavailable
        }
    }

    private async initStorage() {
        let storedSettings: any = null;
        let storedLast: any = null;
        try {
            storedSettings = await this.loadData("settings");
        } catch (error) {
            console.warn("[new-year-countdown] load settings failed", error);
        }
        try {
            storedLast = await this.loadData("lastShown");
        } catch (error) {
            console.warn("[new-year-countdown] load last shown failed", error);
        }

        let localSettings: any = null;
        try {
            const raw = this.readLocal(SETTINGS_KEY);
            localSettings = raw ? JSON.parse(raw) : null;
        } catch (error) {
            localSettings = null;
        }
        this.settings = normalizeSettings(storedSettings && typeof storedSettings === "object" ? storedSettings : localSettings);

        const timestamp = Number(storedLast?.timestamp) ||
            Number(this.readLocal(LAST_KEY)) ||
            Number(this.readLocal(LEGACY_KEY)) ||
            0;
        this.lastAutoShown = Number.isFinite(timestamp) ? timestamp : 0;
    }

    private persistSettings() {
        this.writeLocal(SETTINGS_KEY, JSON.stringify(this.settings));
        try {
            const request = this.saveData("settings", this.settings);
            if (request && typeof request.then === "function") {
                request.catch((error: unknown) => console.warn("[new-year-countdown] save settings failed", error));
            }
        } catch (error) {
            console.warn("[new-year-countdown] save settings failed", error);
        }
    }

    private setLastShown(timestamp: number) {
        this.lastAutoShown = timestamp;
        this.writeLocal(LAST_KEY, String(timestamp));
        this.removeLocal(LEGACY_KEY);
        try {
            const request = this.saveData("lastShown", { timestamp });
            if (request && typeof request.then === "function") {
                request.catch((error: unknown) => console.warn("[new-year-countdown] save last shown failed", error));
            }
        } catch (error) {
            console.warn("[new-year-countdown] save last shown failed", error);
        }
    }

    private updateBadge() {
        const target = targetInfo(this.settings);
        const remaining = target.time - Date.now();
        const days = remaining <= 0 ? 0 : remainingDays(remaining);
        if (this.badgeEl) {
            this.badgeEl.hidden = !this.settings.showBadge;
            this.badgeEl.textContent = remaining <= 0 ? "🎉" : String(days);
        }
        if (this.topBarButton) {
            this.topBarButton.title = target.custom
                ? format(this.t("titleCustom", "Countdown to %s"), target.label)
                : format(this.t("topBarTip", "New Year Countdown · %d days left"), days);
        }
    }

    private clearTimers() {
        if (this.badgeTimer !== null) {
            window.clearInterval(this.badgeTimer);
            this.badgeTimer = null;
        }
        if (this.countdownTimer !== null) {
            window.clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }

    private startCountdownTimer() {
        if (this.countdownTimer !== null) window.clearInterval(this.countdownTimer);
        this.countdownTimer = window.setInterval(() => this.updateCountdown(), this.settings.showTime ? 1000 : 60000);
    }

    private updateCountdown() {
        const target = targetInfo(this.settings);
        const remaining = target.time - Date.now();
        countdownState.showTime = this.settings.showTime;
        countdownState.effects = this.settings.effects;
        countdownState.daysLabel = this.t("day", "Days");

        if (remaining <= 0) {
            countdownState.mode = "greeting";
            const passed = target.custom && remaining < -ONE_DAY;
            countdownState.greeting = passed
                ? this.t("passed", "The target date has passed")
                : target.custom
                    ? this.t("customGreeting", "🎉 The day is here!")
                    : this.t("greeting", "🎉 Happy New Year!");
            countdownState.greetingSub = passed
                ? this.t("passedSub", "You can change the target date in Settings.")
                : target.custom
                    ? this.t("customGreetingSub", "Wishing you a great day.")
                    : this.t("greetingSub", "Wishing you a wonderful year ahead.");
            this.updateBadge();
            return;
        }

        const days = remainingDays(remaining);
        countdownState.mode = "count";
        countdownState.title = target.custom
            ? format(this.t("titleCustom", "Countdown to %s"), target.label)
            : format(this.t("title", "Countdown to New Year %d"), target.year);
        countdownState.days = days;
        countdownState.soon = days <= SOON_DAYS;
        countdownState.subtitle = days <= 1
            ? this.t("subtitleTomorrow", "Tomorrow is the day!")
            : days <= SOON_DAYS
                ? format(this.t("subtitleSoon", "Only %d days left!"), days)
                : this.t("subtitle", "Here is how long until the target day.");
        if (this.settings.showTime) {
            const totalSeconds = Math.floor(remaining / 1000);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            countdownState.clock = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
        } else {
            countdownState.clock = "";
        }
        countdownState.progress = Math.max(0, Math.min(100, (1 - remaining / (365 * ONE_DAY)) * 100));
        this.updateBadge();
    }

    private openCountdown() {
        if (this.disposed || this.countdownDialog) return;
        this.updateCountdown();
        this.startCountdownTimer();
        let handle: ReturnType<typeof svelteDialog>;
        handle = svelteDialog({
            title: this.t("topBarTitle", "New Year Countdown"),
            component: CountdownCard,
            width: "520px",
            height: "460px",
            props: {
                state: countdownState,
                labels: this.labels(),
                onSettings: () => this.openSettings(),
                onClose: () => handle.close(),
            },
            callback: () => {
                if (this.countdownDialog === handle) this.countdownDialog = undefined;
                if (this.countdownTimer !== null) {
                    window.clearInterval(this.countdownTimer);
                    this.countdownTimer = null;
                }
            },
        });
        this.countdownDialog = handle;
    }

    private openSettings() {
        if (this.disposed || this.settingsDialog) return;
        let handle: ReturnType<typeof svelteDialog>;
        handle = svelteDialog({
            title: this.t("settings", "Settings"),
            component: CountdownSettingsPanel,
            width: "460px",
            height: "520px",
            props: {
                labels: this.labels(),
                settings: { ...this.settings },
                onSave: (next: CountdownSettings) => {
                    this.settings = normalizeSettings(next);
                    this.persistSettings();
                    handle.close();
                    this.updateBadge();
                    this.updateCountdown();
                    if (this.countdownDialog) this.startCountdownTimer();
                },
                onCancel: () => handle.close(),
            },
            callback: () => {
                if (this.settingsDialog === handle) this.settingsDialog = undefined;
            },
        });
        this.settingsDialog = handle;
    }
}
