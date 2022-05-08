import LocalizedStrings from 'react-native-localization';
import english from './en.js'
import french from './fr.js'

const strings = new LocalizedStrings({
    en: english,
    fr: french,
})

export default {
    changeLanguage: (languageKey) => {
        strings.setLanguage(languageKey)
    },
    strings
}