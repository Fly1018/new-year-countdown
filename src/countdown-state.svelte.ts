export const countdownState = $state({
    mode: "count" as "count" | "greeting",
    title: "",
    days: 0,
    daysLabel: "Days",
    clock: "",
    subtitle: "",
    greeting: "",
    greetingSub: "",
    soon: false,
    showTime: false,
    effects: true,
    progress: 0,
});
