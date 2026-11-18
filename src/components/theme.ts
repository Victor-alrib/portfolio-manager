import { useEffect } from "react";
import { useStore } from "../store/store";
import { SERIES } from "../lib/constants";

export function useTheme() {
  const theme = useStore((s) => s.settings.theme);
  const update = useStore((s) => s.updateSettings);
  return { theme, dark: theme === "dark", toggle: () => update({ theme: theme === "dark" ? "light" : "dark" }) };
}

export function useApplyTheme() {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
  }, [theme]);
}

/** Cores de gráfico por tema (paleta validada, passos escolhidos para cada superfície). */
export function useChartTheme() {
  const dark = useStore((s) => s.settings.theme === "dark");
  return {
    dark,
    series: dark ? SERIES.dark : SERIES.light,
    grid: dark ? "#2c2c30" : "#e4e4e0",
    axis: dark ? "#8c8b84" : "#82817c",
    text: dark ? "#c3c2b7" : "#52514e",
    surface: dark ? "#161618" : "#ffffff",
    tooltipBg: dark ? "#1e1e21" : "#ffffff",
    accent: dark ? "#9085e9" : "#6250d6",
    track: dark ? "#2c2c30" : "#ececea",
  };
}
