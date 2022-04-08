import i18next, { InitOptions } from 'i18next'
import ICU from 'i18next-icu'
import {
    CheckValidLocaleFunction,
    I18nInitOptions,
    I18nIcuParseErrorHandlerFunction,
    I18nIcuInitOptions,
    ParseMissingKeyHandler,
    MissingKeyHandler,
    I8nServiceInterface,
    I18nIcuBackendOptions,
} from './types'

let debug = false
let providedIsValidLocale: CheckValidLocaleFunction | undefined
let providedIcuParseErrorHandler: I18nIcuParseErrorHandlerFunction | undefined
let providedParseMissingKeyHandler: ParseMissingKeyHandler | undefined
let providedMissingKeyHandler: MissingKeyHandler | undefined

const isValidLocale: CheckValidLocaleFunction = (locale: unknown) => {
    if (providedIsValidLocale) {
        return providedIsValidLocale(locale)
    }
    return true
}
const defaultParseMissingKeyHandler: ParseMissingKeyHandler = (
    key: string,
    defaultValue?: string,
) => {
    if (providedParseMissingKeyHandler) {
        return providedParseMissingKeyHandler(key, defaultValue)
    }
    return key
}
const defaultMissingKeyHandler: MissingKeyHandler = (
    lngs,
    _ns,
    key,
    fallbackValue,
    updateMissing,
    options,
) => {
    if (providedMissingKeyHandler) {
        providedMissingKeyHandler(
            lngs,
            _ns,
            key,
            fallbackValue,
            updateMissing,
            options,
        )
    }
}

const parseIcuErrorHandler = (
    error: Error,
    key: string,
    res: string,
    options: I18nIcuBackendOptions,
) => {
    if (providedIcuParseErrorHandler) {
        return providedIcuParseErrorHandler(error, key, res, {
            ...options,
            debug,
        })
    }
    return ''
}

const normalizeLocaleOutput = (languageCode: string, countryCode: string) => {
    return `${languageCode.toLowerCase()}-${countryCode.toUpperCase()}`
}

const normalizeLocaleFrom = (locale: string, divider: string) => {
    if (locale.indexOf(divider) < 0) {
        return undefined
    }
    let localeParts = locale.trim().split(divider)

    localeParts = localeParts.slice(0, 2)
    const normalizedLocale = normalizeLocaleOutput(
        localeParts[0],
        localeParts[1],
    )
    if (isValidLocale(normalizedLocale)) {
        return normalizedLocale
    }
    return undefined
}

const normalizeLocaleFromAny = (locale: string, dividers: string) => {
    let result: string | undefined
    for (let pos = 0; pos < dividers.length; pos++) {
        result = normalizeLocaleFrom(locale, dividers[pos])
        if (result) {
            break
        }
    }
    return result
}

const normalizeLocale = (locale?: string): string | undefined => {
    if (locale && isValidLocale(locale)) {
        return locale
    } else if (locale) {
        return normalizeLocaleFromAny(locale, '_/:.')
    }
    return undefined
}

const setLanguage = (language?: string): boolean => {
    if (language) {
        const normalized = normalizeLocale(language)
        if (isValidLocale(normalized)) {
            i18next.changeLanguage(normalized) // TODO: Check if we need to better handle since it returns a promise
            return true
        }
    }
    return false
}

const translate = (key: string, args?: Record<string, any>): string => {
    return i18next.t(key, args)
}

const getLanguage = (): string | undefined => normalizeLocale(i18next.language)

const handleInitOptions = (options: I18nInitOptions) => {
    providedIsValidLocale = options.checkValidLocale
}

const handleI18nOptions = (options: InitOptions) => {
    debug = !!options.debug
    providedParseMissingKeyHandler = options.parseMissingKeyHandler
        ? options.parseMissingKeyHandler
        : undefined

    providedMissingKeyHandler = options.missingKeyHandler
        ? options.missingKeyHandler
        : undefined
}

const handleIcuOptions = (options?: I18nIcuInitOptions) => {
    providedIcuParseErrorHandler =
        options && options.errorHandler ? options.errorHandler : undefined
}

export const init = (
    options: I18nInitOptions,
    i18nOptions: InitOptions,
    icuOptions?: I18nIcuInitOptions,
    debug = false,
): I8nServiceInterface => {
    handleInitOptions(options)
    handleI18nOptions({ ...i18nOptions, debug })
    handleIcuOptions(icuOptions)

    const i18nPreparedOptions: InitOptions = Object.assign({}, i18nOptions, {
        parseMissingKeyHandler: defaultParseMissingKeyHandler,
        missingKeyHandler: defaultMissingKeyHandler,
    })

    i18next
        .use(new ICU({ parseErrorHandler: parseIcuErrorHandler }))
        .init(i18nPreparedOptions)

    return {
        normalizeLocale,
        setLanguage,
        translate,
        getLanguage,
    }
}
