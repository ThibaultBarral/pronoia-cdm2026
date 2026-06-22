/**
 * Dictionary resolution helpers shared by the server loader and the client
 * provider. A dictionary is a nested object of strings. Lookups use dot-paths
 * ("navbar.signIn") and support `{var}` interpolation.
 */

export type Dictionary = { [key: string]: string | Dictionary };

/** Deep-merge `override` onto `base` so missing keys fall back to `base`. */
export function deepMerge(base: Dictionary, override: Dictionary): Dictionary {
  const out: Dictionary = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const prev = out[key];
    if (
      value &&
      typeof value === "object" &&
      prev &&
      typeof prev === "object"
    ) {
      out[key] = deepMerge(prev as Dictionary, value as Dictionary);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Resolve a dot-path against a dictionary; returns the key itself if missing. */
export function lookup(dict: Dictionary, path: string): string {
  const parts = path.split(".");
  let node: string | Dictionary | undefined = dict;
  for (const part of parts) {
    if (node && typeof node === "object") {
      node = node[part];
    } else {
      node = undefined;
      break;
    }
  }
  return typeof node === "string" ? node : path;
}

export type TParams = Record<string, string | number>;

/** Interpolate `{name}` placeholders. */
export function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in params ? String(params[k]) : `{${k}}`
  );
}

export type TFunction = (key: string, params?: TParams) => string;

export function makeT(dict: Dictionary): TFunction {
  return (key, params) => interpolate(lookup(dict, key), params);
}
