/**
 * Translations. The language is the `Language` row of the Flags tab
 * ("si" or "en"); `?lang=en` in the URL overrides it. To add a language,
 * copy one block below and translate the values.
 */
const I18N = {
    en: {
        loading: 'Loading...',
        liveUpdates: 'Live updates',
        joinChannel: 'Join the WhatsApp channel',
        joinGroup: 'Join the WhatsApp group',
        realtimeUpdates: 'Realtime updates',
        joinUs: 'Join us',
        ongoing: 'On going now',
        upNext: 'Up next',
        latestResults: 'Latest results',
        eventDetails: 'Event details',
        photos: 'Photos',
        organizedBy: 'Organized by',
        fullscreen: 'Full screen',
        fullscreenHint: 'Tap the button below for the full screen experience.',
        start: 'Start',
        invalidDate: 'Invalid date',
        startsIn: 'Starts in',
        days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds',
        locationTbd: 'Location to be announced',
        noEvents: 'No events',
        stayTuned: 'Stay tuned',
        notSelected: 'Not selected',
        noWinners: 'No winners for this event',
        noWinnersDot: 'No winners are selected for this event.',
        results: 'Results',
        winner: 'Winner',
        first: '1st place', second: '2nd place', third: '3rd place',
        statusPending: 'Scheduled', statusUpNext: 'Up next', statusOngoing: 'On going',
        statusFinished: 'Finished', statusCancelled: 'Cancelled'
    },
    si: {
        loading: 'පූරණය වෙමින්...',
        liveUpdates: 'සජීවී යාවත්කාලීන',
        joinChannel: 'WhatsApp චැනලයට එක්වන්න',
        joinGroup: 'WhatsApp සමූහයට එක්වන්න',
        realtimeUpdates: 'Realtime updates',
        joinUs: 'අප හා එක්වන්න',
        ongoing: 'දැන් පැවැත්වේ',
        upNext: 'මීලගට',
        latestResults: 'නවතම ප්‍රතිඵල',
        eventDetails: 'තරග විස්තර',
        photos: 'පින්තූර',
        organizedBy: 'සංවිධානය',
        fullscreen: 'පූර්ණ තිරය',
        fullscreenHint: 'පූර්ණ තිර අත්දැකීම ලබා ගැනීමට පහත බොත්තම ඔබන්න.',
        start: 'ආරම්භ කරන්න',
        invalidDate: 'දිනය නිවැරදි නැත',
        startsIn: 'උත්සවය ආරම්භ වීමට තව',
        days: 'දින', hours: 'පැය', minutes: 'මිනිත්තු', seconds: 'තත්පර',
        locationTbd: 'ස්ථානය පසුවට දැනුම් දේ',
        noEvents: 'සිදුවීම් නොමැත',
        stayTuned: 'අප හා රැඳී සිටින්න',
        notSelected: 'තේරී නැත',
        noWinners: 'ජයග්‍රාහකයින් තෝරා නොගැනේ',
        noWinnersDot: 'මෙම තරගය සඳහා ජයග්‍රාහකයින් තෝරා නොගැනේ.',
        results: 'ප්‍රතිඵල',
        winner: 'ජයග්‍රාහකයා',
        first: 'ප්‍රථම ස්ථානය', second: 'දෙවන ස්ථානය', third: 'තෙවන ස්ථානය',
        statusPending: 'පැවැත්වීමට නියමිත', statusUpNext: 'මීලගට', statusOngoing: 'දැන් පැවැත්වේ',
        statusFinished: 'නිම විය', statusCancelled: 'අවලංගුයි'
    }
};

const DEFAULT_LANG = 'si';
let currentLang = DEFAULT_LANG;

function setLanguage(code) {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    const wanted = (urlLang || code || DEFAULT_LANG).toString().toLowerCase().trim();
    currentLang = I18N[wanted] ? wanted : DEFAULT_LANG;
    document.documentElement.lang = currentLang;
}

// Translate a key; falls back to English, then the key itself.
function t(key) {
    return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

// Fill every [data-i18n] element in the page.
function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
}
