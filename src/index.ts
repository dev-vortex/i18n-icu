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

const normalizeLocale = (locale?: string): string | undefined => {
    if (locale && isValidLocale(locale)) {
        return locale
    } else if (locale) {
        let localeParts: string[] = []
        if (locale.indexOf('_') >= 0) {
            localeParts = locale.trim().split('_')
        } else if (locale.indexOf('/') >= 0) {
            localeParts = locale.trim().split('/')
        } else if (locale.indexOf(':') >= 0) {
            localeParts = locale.trim().split(':')
        } else if (locale.indexOf('.') >= 0) {
            localeParts = locale.trim().split('.')
        }
        if (localeParts.length >= 2) {
            localeParts[0] = localeParts[0].toLowerCase()
            localeParts[1] = localeParts[1].toUpperCase()
            localeParts = localeParts.slice(0, 2)
            const normalizedLocale = localeParts.join('-')
            if (isValidLocale(normalizedLocale)) {
                return normalizedLocale
            }
        }
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

export const init = (
    options: I18nInitOptions,
    i18nOptions: InitOptions,
    icuOptions?: I18nIcuInitOptions,
): I8nServiceInterface => {
    providedIsValidLocale = options.checkValidLocale
    debug = !!i18nOptions.debug
    if (icuOptions && icuOptions.errorHandler) {
        providedIcuParseErrorHandler = icuOptions.errorHandler
    } else {
        providedIcuParseErrorHandler = undefined
    }
    if (i18nOptions.parseMissingKeyHandler) {
        providedParseMissingKeyHandler = i18nOptions.parseMissingKeyHandler
    } else {
        providedParseMissingKeyHandler = undefined
    }
    if (i18nOptions.missingKeyHandler) {
        // TODO: check if the value false might be a problem
        providedMissingKeyHandler = i18nOptions.missingKeyHandler
    } else {
        providedMissingKeyHandler = undefined
    }
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
