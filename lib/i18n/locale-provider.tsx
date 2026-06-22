"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./config";
import { makeT, type Dictionary, type TFunction } from "./resolve";

type LocaleContextValue = {
  locale: Locale;
  dict: Dictionary;
  t: TFunction;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo<LocaleContextValue>(
    () => ({ locale, dict, t: makeT(dict) }),
    [locale, dict]
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useTranslations/useLocale must be used within <LocaleProvider>");
  }
  return ctx;
}

/** Returns the translation function `t(key, params?)`. */
export function useTranslations(): TFunction {
  return useLocaleContext().t;
}

/** Returns the current locale ("fr" | "en"). */
export function useLocale(): Locale {
  return useLocaleContext().locale;
}
