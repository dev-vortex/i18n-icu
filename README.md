<p align="center">
    <a href="https://travis-ci.com/github/dev-vortex/i18n-icu"><img src="https://badgen.net/travis/dev-vortex/i18n-icu?icon=travis&label=build"/></a>
    <a href="https://www.npmjs.com/package/@dev-vortex/i18n-icu"><img src="https://badgen.net/npm/v/@dev-vortex/i18n-icu?icon=npm&label"/></a>
    <a href="https://www.npmjs.com/package/@dev-vortex/i18n-icu"><img src="https://badgen.net/npm/license/@dev-vortex/i18n-icu?icon=npm"/></a> 
    <a href="https://www.npmjs.com/package/@dev-vortex/i18n-icu"><img src="https://badgen.net/npm/types/@dev-vortex/i18n-icu?icon=typescript"/></a> 
</p>

<p align="center">
    <a href="https://bundlephobia.com/result?p=@dev-vortex/i18n-icu"><img src="https://badgen.net/bundlephobia/min/@dev-vortex/i18n-icu?label=min"/></a> 
    <a href="https://bundlephobia.com/result?p=@dev-vortex/i18n-icu"><img src="https://badgen.net/bundlephobia/minzip/@dev-vortex/i18n-icu?label=min+gz"/></a> 
    <a href="https://lgtm.com/projects/g/dev-vortex/i18n-icu/alerts/"><img src="https://badgen.net/lgtm/grade/g/dev-vortex/i18n-icu?icon=lgtm&label=quality"/></a> 

</p>

<p align="center">
    <a href="https://codeclimate.com/github/dev-vortex/i18n-icu/maintainability"><img src="https://api.codeclimate.com/v1/badges/a863c129e4f1c747c941/maintainability"/></a>
    <a href="https://codeclimate.com/github/dev-vortex/i18n-icu/test_coverage"><img src="https://api.codeclimate.com/v1/badges/a863c129e4f1c747c941/test_coverage"/></a>
</p>

<p align="center">
    <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg"/></a>
    <a href="https://www.conventionalcommits.org/"><img src="https://img.shields.io/badge/conventional-commits-pink"/></a>
</p>

# Internationalization with ICU Library
This library aims to provide an agnostic and reliable mechanism to proivide and support internationaliizatiion with static and live translation file fetching through minimal or no setup.

## Installation
```
yarn add @dev-vortex/i18n-icu
```

or

```
npm install @dev-vortex/i18n-icu
```

## Configuration
> TODO: explain all the config options and how to pass the config to library

## Formatted
> TODO: explain how to format a date, currency, number, etc...

## Translate
### Local files (static)
### Load files (dynamic)



## Quick Start
 1. Import the initialization method to have access to the api
 ```typescript
import type { init } from '@dev-vortex/i18n-icu'
 ```

 2. Prepare the options for the initialization with the locale validator (this can be the type guardian of your app defined locales)
 ```typescript
import type { I18nInitOptions } from '@dev-vortex/i18n-icu'

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

const initOptions: I18nInitOptions = {
    checkValidLocale: isValidLocale,
}
 ```

 3. Prepare the `i18n` and `i18n-icu` option objects.
   > For the `i18n` we can just use the same as `i18next` [here](https://www.i18next.com/overview/configuration-options)
```typescript
const i18nOptions: InitOptions = {
    debug: false,
    fallbackLng: false,
    lng: deviceLocale(),
    saveMissing: true,
    parseMissingKeyHandler: parseMissingKeyHandler,
    missingKeyHandler: missingKeyHandler,
    resources: {
        [Locale.EN_US]: {
            translation: require(`./translations/${Locale.EN_US}.json`),
        },
        ...
    },
}

const i18nIcuOptions: I18nIcuInitOptions = {
    errorHandler: errorHandler,
}
```

1. Call the `init` method to get the api.

```typescript
const api = init(initOptions, i18nOptions, i18nIcuOptions)
```

## API
### Setting the language
Once we got the API we can start by settiing the current language
```typescript
api.setLanguage('se_SV') // Normalizes and set the language
```

### Get the current language
```typescript
const currentLanguuage = api.getLanguage()
```

### Get normalized locale
```typescript
const currentLanguuage = api.normalizeLocale('en_GB')
```

### Get the text for the provided key
```typescript
const text = api.translate('KEY.TO.TEXT')
```