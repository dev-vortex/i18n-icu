import { expect } from 'chai'
import sinon from 'sinon'
import { InitOptions } from 'i18next'
import { init } from '../src'
import {
    I18nIcuInitOptions,
    I18nIcuParseErrorHandlerFunction,
    I18nInitOptions,
    MissingKeyHandler,
} from '../src/types'

const Locale = {
    EN_US: 'en-US',
    SV_SE: 'sv-SE',
    HR_HR: 'hr-HR',
    AR_AR: 'ar-AR',
} as const
type AppLocaleKeys = keyof typeof Locale
type AppLocaleValues = typeof Locale[keyof typeof Locale]
const isValidLocale = (toVerify: unknown): toVerify is AppLocaleValues => {
    const toReturn = !!Object.keys(Locale).find(
        value => Locale[value as AppLocaleKeys] === toVerify,
    )
    return toReturn
}

let deviceLangMock = 'en-US'
const deviceLocale = () => deviceLangMock
const debgErrorReport = () => undefined
const debugParseErrorReportSpy = sinon.spy(debgErrorReport)
const debugMissingKeyErrorReportSpy = sinon.spy(debgErrorReport)
const icuParseErrorHandler: I18nIcuParseErrorHandlerFunction = (
    _error,
    _key,
    _res,
    options,
) => {
    if (options.debug) {
        debugParseErrorReportSpy()
    }
    return 'ICU_ERROR'
}
const icuParseErrorHandlerSpy = sinon.spy(icuParseErrorHandler)
const parseMissingKeyHandler = (key: string) => key
const parseMissingKeyHandlerSpy = sinon.spy(parseMissingKeyHandler)

const missingKeyHandler: MissingKeyHandler = (
    _lngs,
    _ns,
    _key,
    _fallbackValue,
    _updateMissing,
    options,
) => {
    if (options.debug) {
        debugMissingKeyErrorReportSpy()
    }
    return
}
const missingKeyHandlerSpy = sinon.spy(missingKeyHandler)

const initOptions: I18nInitOptions = {
    checkValidLocale: isValidLocale,
}
const i18nOptions: InitOptions = {
    debug: false,
    fallbackLng: false,
    lng: deviceLocale(),
    saveMissing: true,
    parseMissingKeyHandler: parseMissingKeyHandlerSpy,
    missingKeyHandler: missingKeyHandlerSpy,
    resources: {
        [Locale.EN_US]: {
            translation: require(`./mocks/${Locale.EN_US}.json`),
        },
        [Locale.SV_SE]: {
            translation: require(`./mocks/${Locale.SV_SE}.json`),
        },
        [Locale.HR_HR]: {
            translation: require(`./mocks/${Locale.HR_HR}.json`),
        },
        [Locale.AR_AR]: {
            translation: require(`./mocks/${Locale.AR_AR}.json`),
        },
    },
}

const i18nIcuOptions: I18nIcuInitOptions = {
    errorHandler: icuParseErrorHandlerSpy,
}

let api = init(initOptions, i18nOptions, i18nIcuOptions)

describe('i18n-icu', () => {
    beforeEach(() => {
        deviceLangMock = 'en-US'
        api = init(initOptions, i18nOptions, i18nIcuOptions)
        // api.setLanguage(Locale.EN_US)
    })

    describe('init - full setup', () => {
        it('should return interface', () => {
            // const api = init(initOptions, i18nOptions, i18nIcuOptions)
            expect(api).to.haveOwnProperty('getLanguage')
            expect(api).to.haveOwnProperty('normalizeLocale')
            expect(api).to.haveOwnProperty('setLanguage')
            expect(api).to.haveOwnProperty('translate')
        })
    })
    describe('init - no isValidLocale provided', () => {
        it('should assume it is valid', () => {
            const apiLocal = init(
                {} as I18nInitOptions,
                i18nOptions,
                i18nIcuOptions,
            )
            expect(apiLocal).to.haveOwnProperty('getLanguage')
            expect(apiLocal).to.haveOwnProperty('normalizeLocale')
            expect(apiLocal).to.haveOwnProperty('setLanguage')
            expect(apiLocal).to.haveOwnProperty('translate')

            const result = apiLocal.normalizeLocale('pt_PT')
            expect(result).to.be.equal('pt_PT')
        })
    })
    describe('init - no ICU errorHandler provided', () => {
        it('should assume it is valid', () => {
            const apiLocal = init(initOptions, i18nOptions, {
                errorHandler: undefined,
            } as I18nIcuInitOptions)
            expect(apiLocal).to.haveOwnProperty('getLanguage')
            expect(apiLocal).to.haveOwnProperty('normalizeLocale')
            expect(apiLocal).to.haveOwnProperty('setLanguage')
            expect(apiLocal).to.haveOwnProperty('translate')

            const result = apiLocal.normalizeLocale('sv_SE')
            expect(result).to.be.equal('sv-SE')
        })

        it('should call error ICU default error handler', () => {
            const apiLocal = init(initOptions, i18nOptions, {
                errorHandler: undefined,
            } as I18nIcuInitOptions)
            const textA = apiLocal.translate('ICU_CORRECT_KEY_A', {
                not_count: 100,
            })
            expect(textA).to.be.equal('')
            expect(icuParseErrorHandlerSpy.called).to.be.false
        })
        it('should call error ICU debug Error handler', () => {
            const apiLocal = init(
                initOptions,
                i18nOptions,
                i18nIcuOptions,
                true,
            )
            const textA = apiLocal.translate('ICU_CORRECT_KEY_A', {
                not_count: 100,
            })
            expect(textA).to.be.equal('ICU_ERROR')
            expect(icuParseErrorHandlerSpy.called).to.be.true
        })
    })
    describe('getLanguage', () => {
        it('should return current active language `en-US`', () => {
            const currentLanguage = api.getLanguage()
            expect(currentLanguage).to.equal('en-US')
        })
        it('should return current active language after change language to `sv-SE`', () => {
            api.setLanguage(Locale.SV_SE)
            const currentLanguage = api.getLanguage()
            expect(currentLanguage).to.equal(Locale.SV_SE)
        })
    })
    describe('setLanguage', () => {
        it('should update if a valid language is provided', () => {
            api.setLanguage(Locale.SV_SE)
            const currentLanguage = api.getLanguage()
            expect(currentLanguage).to.equal(Locale.SV_SE)
        })
        it('should not change the language if the provided locale is invalid', () => {
            api.setLanguage(Locale.SV_SE)
            api.setLanguage('en-SE')
            const currentLanguage = api.getLanguage()
            expect(currentLanguage).to.equal(Locale.SV_SE)
        })
        it('should not change the language if no languuage is provided', () => {
            api.setLanguage(Locale.SV_SE)
            api.setLanguage()
            const currentLanguage = api.getLanguage()
            expect(currentLanguage).to.equal(Locale.SV_SE)
        })
    })
    describe('normalizeLocale', () => {
        it('should return same if proovided locale is valid', () => {
            const normalized = api.normalizeLocale('en-US')
            expect(normalized).to.equal('en-US')
        })
        it('should return undefined if nothing is provided', () => {
            const normalized = api.normalizeLocale()
            expect(normalized).to.undefined
        })
        it('should return undefined if invalid locale provided', () => {
            const normalized = api.normalizeLocale('en')
            expect(normalized).to.undefined
        })
        it('should return undefined if locale not valid', () => {
            const normalized = api.normalizeLocale('en_PT')
            expect(normalized).to.undefined
        })
    })
    describe('normalizeLocale : `_` separator', () => {
        it('should correct `en_us` into `en-US`', () => {
            const normalized = api.normalizeLocale('en_us')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `en_US` into `en-US`', () => {
            const normalized = api.normalizeLocale('en_US')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `EN_us` into `en-US`', () => {
            const normalized = api.normalizeLocale('EN_us')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `EN_US` into `en-US`', () => {
            const normalized = api.normalizeLocale('EN_US')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `EN_US_GB` into `en-US`', () => {
            const normalized = api.normalizeLocale('EN_US_GB')
            expect(normalized).to.equal('en-US')
        })
    })

    describe('normalizeLocale : `/` separator', () => {
        it('should correct `en/us` into `en-US`', () => {
            const normalized = api.normalizeLocale('en/us')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `en/US` into `en-US`', () => {
            const normalized = api.normalizeLocale('en/US')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `EN/us` into `en-US`', () => {
            const normalized = api.normalizeLocale('EN/us')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `EN/US` into `en-US`', () => {
            const normalized = api.normalizeLocale('EN/US')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `EN/US/GB` into `en-US`', () => {
            const normalized = api.normalizeLocale('EN/US/GB')
            expect(normalized).to.equal('en-US')
        })
    })

    describe('normalizeLocale : `:` separator', () => {
        it('should correct `en:us` into `en-US`', () => {
            const normalized = api.normalizeLocale('en:us')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `en:US` into `en-US`', () => {
            const normalized = api.normalizeLocale('en:US')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `EN:us` into `en-US`', () => {
            const normalized = api.normalizeLocale('EN:us')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `EN:US` into `en-US`', () => {
            const normalized = api.normalizeLocale('EN:US')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `EN:US:GB` into `en-US`', () => {
            const normalized = api.normalizeLocale('EN:US:GB')
            expect(normalized).to.equal('en-US')
        })
    })

    describe('normalizeLocale : `.` separator', () => {
        it('should correct `en.us` into `en-US`', () => {
            const normalized = api.normalizeLocale('en.us')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `en.US` into `en-US`', () => {
            const normalized = api.normalizeLocale('en.US')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `EN.us` into `en-US`', () => {
            const normalized = api.normalizeLocale('EN.us')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `EN.US` into `en-US`', () => {
            const normalized = api.normalizeLocale('EN.US')
            expect(normalized).to.equal('en-US')
        })

        it('should correct `EN.US.GB` into `en-US`', () => {
            const normalized = api.normalizeLocale('EN.US.GB')
            expect(normalized).to.equal('en-US')
        })
    })

    describe('translate : simple - provide all', () => {
        beforeEach(() => {
            api.setLanguage(Locale.EN_US)
            parseMissingKeyHandlerSpy.resetHistory()
        })
        it('should return the key if key does not exist', () => {
            const text = api.translate('UNKNOWN.KEY')
            expect(text).to.equal('UNKNOWN.KEY')
            expect(parseMissingKeyHandlerSpy.called).to.equals(true)
            expect(parseMissingKeyHandlerSpy.callCount).to.equals(1)
        })
        it('should return the text for the key', () => {
            const textA = api.translate('SIMPLE_KEY_A')
            expect(textA).to.equal('SIMPLE_KEY_A_EN')

            api.setLanguage(Locale.SV_SE)
            const textB = api.translate('SIMPLE_KEY_A')
            expect(textB).to.equal('SIMPLE_KEY_A_SV')
            expect(parseMissingKeyHandlerSpy.called).to.equals(false)
        })
        it('should return the simple text for the key with the variable', () => {
            const attributes = { test: 'TEST_VALUE' }
            const textA = api.translate('SIMPLE_KEY_C', attributes)
            expect(textA).to.equal(`SIMPLE_KEY_C_EN ${attributes.test}`)

            api.setLanguage(Locale.SV_SE)
            const textB = api.translate('SIMPLE_KEY_C', attributes)
            expect(textB).to.equal(`SIMPLE_KEY_C_SV ${attributes.test}`)
            expect(parseMissingKeyHandlerSpy.called).to.equals(false)
        })
    })

    describe('translate : simple - without parseMissingKeyHandler', () => {
        before(() => {
            deviceLangMock = 'en_US'
            delete i18nOptions.parseMissingKeyHandler
            api = init(initOptions, i18nOptions, i18nIcuOptions)
        })
        beforeEach(() => {
            api.setLanguage(Locale.EN_US)
            parseMissingKeyHandlerSpy.resetHistory()
        })
        it('should return the key if key does not exist', () => {
            const text = api.translate('UNKNOWN.KEY')
            expect(text).to.equal('UNKNOWN.KEY')
            expect(parseMissingKeyHandlerSpy.called).to.equals(false)
            expect(parseMissingKeyHandlerSpy.callCount).to.equals(0)
        })
        it('should return the text for the key', () => {
            const textA = api.translate('SIMPLE_KEY_A')
            expect(textA).to.equal('SIMPLE_KEY_A_EN')

            api.setLanguage(Locale.SV_SE)
            const textB = api.translate('SIMPLE_KEY_A')
            expect(textB).to.equal('SIMPLE_KEY_A_SV')
            expect(parseMissingKeyHandlerSpy.called).to.equals(false)
        })
        it('should return the simple text for the key with the variable', () => {
            const attributes = { test: 'TEST_VALUE' }
            const textA = api.translate('SIMPLE_KEY_C', attributes)
            expect(textA).to.equal(`SIMPLE_KEY_C_EN ${attributes.test}`)

            api.setLanguage(Locale.SV_SE)
            const textB = api.translate('SIMPLE_KEY_C', attributes)
            expect(textB).to.equal(`SIMPLE_KEY_C_SV ${attributes.test}`)
            expect(parseMissingKeyHandlerSpy.called).to.equals(false)
        })
    })

    describe('translate : simple - without parseMissingKeyHandler and missingKeyHandler', () => {
        before(() => {
            deviceLangMock = 'en_US'
            delete i18nOptions.parseMissingKeyHandler
            delete i18nOptions.missingKeyHandler
            api = init(initOptions, i18nOptions, i18nIcuOptions)
        })
        beforeEach(() => {
            api.setLanguage(Locale.EN_US)
            parseMissingKeyHandlerSpy.resetHistory()
        })
        it('should return the key if key does not exist', () => {
            const text = api.translate('UNKNOWN.KEY')
            expect(text).to.equal('UNKNOWN.KEY')
            expect(parseMissingKeyHandlerSpy.called).to.equals(false)
            expect(parseMissingKeyHandlerSpy.callCount).to.equals(0)
        })
        it('should return the text for the key', () => {
            const textA = api.translate('SIMPLE_KEY_A')
            expect(textA).to.equal('SIMPLE_KEY_A_EN')

            api.setLanguage(Locale.SV_SE)
            const textB = api.translate('SIMPLE_KEY_A')
            expect(textB).to.equal('SIMPLE_KEY_A_SV')
            expect(parseMissingKeyHandlerSpy.called).to.equals(false)
        })
        it('should return the simple text for the key with the variable', () => {
            const attributes = { test: 'TEST_VALUE' }
            const textA = api.translate('SIMPLE_KEY_C', attributes)
            expect(textA).to.equal(`SIMPLE_KEY_C_EN ${attributes.test}`)

            api.setLanguage(Locale.SV_SE)
            const textB = api.translate('SIMPLE_KEY_C', attributes)
            expect(textB).to.equal(`SIMPLE_KEY_C_SV ${attributes.test}`)
            expect(parseMissingKeyHandlerSpy.called).to.equals(false)
        })
    })

    describe('translate : ICU - Plurals Simple languages', () => {
        before(() => {
            deviceLangMock = 'en_US'
            delete i18nOptions.parseMissingKeyHandler
            delete i18nOptions.missingKeyHandler
            api = init(initOptions, i18nOptions, i18nIcuOptions)
        })
        beforeEach(() => {
            api.setLanguage(Locale.EN_US)
            parseMissingKeyHandlerSpy.resetHistory()
        })
        it('should return the key if key does not exist', () => {
            const text = api.translate('UNKNOWN.KEY')
            expect(text).to.equal('UNKNOWN.KEY')
            expect(parseMissingKeyHandlerSpy.called).to.equals(false)
            expect(parseMissingKeyHandlerSpy.callCount).to.equals(0)
        })
        it('should return the text for the key', () => {
            const attributes = { count: 0 }
            let textA = api.translate('ICU_CORRECT_KEY_A', attributes)
            expect(textA).to.equal('NO_PHOTOS_EN')

            attributes.count = 1
            textA = api.translate('ICU_CORRECT_KEY_A', attributes)
            expect(textA).to.equal('ONE_PHOTO_EN')

            attributes.count = 2
            textA = api.translate('ICU_CORRECT_KEY_A', attributes)
            expect(textA).to.equal('OTHER_PHOTOS_EN')

            api.setLanguage(Locale.SV_SE)
            attributes.count = 0
            textA = api.translate('ICU_CORRECT_KEY_A', attributes)
            expect(textA).to.equal('NO_PHOTOS_SV')

            attributes.count = 1
            textA = api.translate('ICU_CORRECT_KEY_A', attributes)
            expect(textA).to.equal('ONE_PHOTO_SV')

            attributes.count = 2
            textA = api.translate('ICU_CORRECT_KEY_A', attributes)
            expect(textA).to.equal('OTHER_PHOTOS_SV')
        })
    })

    describe('translate : ICU - Plurals complex languages', () => {
        before(() => {
            deviceLangMock = 'en_US'
            delete i18nOptions.parseMissingKeyHandler
            delete i18nOptions.missingKeyHandler
            api = init(initOptions, i18nOptions, i18nIcuOptions)
        })
        beforeEach(() => {
            api.setLanguage(Locale.AR_AR)
            parseMissingKeyHandlerSpy.resetHistory()
        })
        it('should return the key if key does not exist', () => {
            const text = api.translate('UNKNOWN.KEY')
            expect(text).to.equal('UNKNOWN.KEY')
            expect(parseMissingKeyHandlerSpy.called).to.equals(false)
            expect(parseMissingKeyHandlerSpy.callCount).to.equals(0)
        })
        it('should return the text NO_...', () => {
            const textA = api.translate('ICU_CORRECT_KEY_A', { count: 0 })
            expect(textA).to.equal('NO_PHOTOS_AR')
        })
        it('should return the text ONE_...', () => {
            const textA = api.translate('ICU_CORRECT_KEY_A', { count: 1 })
            expect(textA).to.equal('ONE_PHOTO_AR')
        })
        it('should return the text TWO_...', () => {
            const textA = api.translate('ICU_CORRECT_KEY_A', { count: 2 })
            expect(textA).to.equal('TWO_PHOTOS_AR')
        })
        it('should return the text FEW_...', () => {
            const textA = api.translate('ICU_CORRECT_KEY_A', { count: 3 })
            expect(textA).to.equal('FEW_PHOTOS_AR')

            const textB = api.translate('ICU_CORRECT_KEY_A', { count: 7 })
            expect(textB).to.equal('FEW_PHOTOS_AR')
        })
        it('should return the text MANY_...', () => {
            const textA = api.translate('ICU_CORRECT_KEY_A', { count: 11 })
            expect(textA).to.equal('MANY_PHOTOS_AR')

            const textB = api.translate('ICU_CORRECT_KEY_A', { count: 26 })
            expect(textB).to.equal('MANY_PHOTOS_AR')
        })
        it('should return the text OTHER_...', () => {
            const textA = api.translate('ICU_CORRECT_KEY_A', { count: 100 })
            expect(textA).to.equal('OTHER_PHOTOS_AR')
        })

        it('should call error Handler', () => {
            const textA = api.translate('ICU_CORRECT_KEY_A', {
                not_count: 100,
            })
            expect(textA).to.be.equal('ICU_ERROR')
            expect(icuParseErrorHandlerSpy.called).to.be.true
        })
    })
})
