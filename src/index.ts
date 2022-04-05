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
    if (debug) {
        console.log('i18n-ICU: unknown or missing key', `key ${key}`, 'i18n', {
            lngs,
            _ns,
            key,
        })
    }
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

const parseIcuErrorHandler: I18nIcuParseErrorHandlerFunction = (
    error: Error,
    key: string,
    res: string,
    options: any,
) => {
    if (debug) {
        console.log(
            'i18n-ICU: failed to parse translation',
            `parse error of key '${key}' in '${
                i18next.language
            }'; ${error.toString()}`,
            'ICU',
            { key, res, options },
        )
    }

    if (providedIcuParseErrorHandler) {
        return providedIcuParseErrorHandler(error, key, res, options)
    }
    return ''
}

const normalizeLocaleFrom = (locale: string, divider: string) => {
    let localeParts = locale.trim().split(divider)
    if (localeParts.length >= 2) {
        localeParts[0] = localeParts[0].toLowerCase()
        localeParts[1] = localeParts[1].toUpperCase()
        localeParts = localeParts.slice(0, 2)
        const normalizedLocale = localeParts.join('-')
        if (isValidLocale(normalizedLocale)) {
            return normalizedLocale
        }
    }
    return undefined
}

const normalizeLocaleFromAny = (locale: string, dividers: string) => {
    let result: string | undefined
    for (let pos = 0; pos < dividers.length; pos++) {
        if (locale.indexOf(dividers[pos]) >= 0) {
            result = normalizeLocaleFrom(locale, dividers[pos])
            if (result) {
                break
            }
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
): I8nServiceInterface => {
    handleInitOptions(options)
    handleI18nOptions(i18nOptions)
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
