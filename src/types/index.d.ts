import { InitOptions } from 'i18next'

export type I18nIcuBackendOptions = {
    // per default icu functions are parsed once and cached for subsequent calls
    memoize?: boolean

    // memoize if not having a lookup and just using the key fallback as value
    memoizeFallback?: boolean

    // which events should clear the cache, can be set to false or string of events separated by " "
    bindI18n?: string

    // which events on resourceSource should clear the cache, can be set to false or string of events separated by " "
    bindI18nStore?: string

    // Will be run when parser throws an error. Can return any string, which can be used as a fallback, in case of broken translation.
    // If omitted, the default swallows the error and returns the unsubstituted string (res)
    parseErrorHandler?: I18nIcuParseErrorHandlerFunction

    debug?: boolean
}

export type I18nIcuParseErrorHandlerFunction = (
    error: Error,
    key: string,
    res: string,
    options: I18nIcuBackendOptions,
) => string

export interface I18nIcuInitOptions {
    errorHandler?: I18nIcuParseErrorHandlerFunction
}

export type CheckValidLocaleFunction = (locale: unknown) => boolean

export interface I18nInitOptions {
    checkValidLocale: CheckValidLocaleFunction
}

export type ParseMissingKeyHandler = (
    key: string,
    defaultValue?: string,
) => string

export type MissingKeyHandler =
    | false
    | ((
          lngs: readonly string[],
          ns: string,
          key: string,
          fallbackValue: string,
          updateMissing: boolean,
          options: InitOptions,
      ) => void)

export interface I8nServiceInterface {
    normalizeLocale: (locale?: string) => string | undefined
    setLanguage: (language?: string) => boolean
    getLanguage: () => string | undefined
    translate: (key: string, args?: Record<string, any>) => string
}
