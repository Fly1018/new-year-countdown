export type TargetMode = "gregorian" | "custom";
export type AutoPopup = "daily" | "weekly" | "once" | "off";

export interface CountdownSettings {
    target: TargetMode;
    customDate: string;
    autoPopup: AutoPopup;
    showTime: boolean;
    effects: boolean;
    showBadge: boolean;
}

export interface TargetInfo {
    time: number;
    year: number;
    custom: boolean;
    label: string;
}

export const ONE_DAY = 24 * 60 * 60 * 1000;
export const SOON_DAYS = 7;

export const DEFAULT_SETTINGS: CountdownSettings = {
    target: "gregorian",
    customDate: "",
    autoPopup: "daily",
    showTime: false,
    effects: true,
    showBadge: true,
};

export function pad2(value: number): string {
    return value < 10 ? "0" + value : String(value);
}

export function dateKey(date: Date): string {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function format(template: string, ...values: unknown[]): string {
    let index = 0;
    return String(template || "").replace(/%[ds]/g, () => {
        const value = values[index];
        index += 1;
        return value === undefined ? "" : String(value);
    });
}

export function parseDateInput(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return date;
}

export function normalizeSettings(raw: any): CountdownSettings {
    const settings = { ...DEFAULT_SETTINGS };
    if (!raw || typeof raw !== "object") return settings;
    if (raw.target === "custom") settings.target = "custom";
    if (typeof raw.customDate === "string") settings.customDate = raw.customDate;
    if (["daily", "weekly", "once", "off"].includes(raw.autoPopup)) settings.autoPopup = raw.autoPopup;
    for (const key of ["showTime", "effects", "showBadge"] as const) {
        if (typeof raw[key] === "boolean") settings[key] = raw[key];
    }
    return settings;
}

export function targetInfo(settings: CountdownSettings): TargetInfo {
    if (settings.target === "custom") {
        const date = parseDateInput(settings.customDate);
        if (date) {
            return {
                time: date.getTime(),
                year: date.getFullYear(),
                custom: true,
                label: settings.customDate,
            };
        }
    }
    const now = Date.now();
    const year = new Date().getFullYear();
    let time = new Date(year, 0, 1, 0, 0, 0, 0).getTime();
    if (now >= time + ONE_DAY) {
        time = new Date(year + 1, 0, 1, 0, 0, 0, 0).getTime();
    }
    return {
        time,
        year: new Date(time).getFullYear(),
        custom: false,
        label: "",
    };
}

export function shouldAutoShow(settings: CountdownSettings, lastShown: number): boolean {
    if (settings.autoPopup === "off") return false;
    if (!lastShown) return true;
    if (settings.autoPopup === "once") return false;
    if (settings.autoPopup === "weekly") return Date.now() - lastShown >= 7 * ONE_DAY;
    return dateKey(new Date(lastShown)) !== dateKey(new Date());
}

export function remainingDays(remaining: number): number {
    return Math.max(0, Math.ceil(remaining / ONE_DAY));
}
