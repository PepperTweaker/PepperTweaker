// ==UserScript==
// @name         PepperTweaker
// @namespace    bearbyt3z
// @version      0.9.4
// @description  Pepper na resorach...
// @author       bearbyt3z
// @match        https://www.pepper.pl/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /***********************************************/
    /***** RUN AT DOCUMENT START (BEFORE LOAD) *****/
    /***********************************************/

    /*** Dark Theme Style ***/
    // if (pepperTweakerConfig.pluginEnabled && pepperTweakerConfig.darkThemeEnabled) {
    if (localStorage.getItem('PepperTweaker.config.pluginEnabled') && localStorage.getItem('PepperTweaker.config.darkThemeEnabled')) {

        // const invertColor = color => '#' + (Number(`0x1${ color.replace('#', '') }`) ^ 0xFFFFFF).toString(16).substr(1);
        const darkBorderColor = '#121212';
        const lightBorderColor = '#5c5c5c';
        const darkBackgroundColor = '#242424';
        const veryDarkBackgroundColor = '#1d1f20';
        const darkestBackgroundColor = '#050c13';
        const lightBackgroundColor = '#35373b';
        const textColor = '#bfbfbf';
        // const greyButtonColor = '#8f949b';
        // const orangeColor = '#d1d5db';

        const style = document.createElement('STYLE');
        const css = `
            .linkGrey, .thread-userOptionLink, .cept-nav-subheadline, .user:not(.thread-user), .tabbedInterface-tab, .subNavMenu, .subNavMenu-btn, .tag, .page-label, .page-subTitle, .userProfile-title--sub, .bg--color-inverted .text--color-white, .comments-pagination--header .pagination-next, .comments-pagination--header .pagination-page, .comments-pagination--header .pagination-previous, .conversationList-msgPreview, .thread-title, .mute--text, .text--color-charcoal, .text--color-charcoalTint, .cept-tt, .cept-description-container, /*.cept-tp,*/ .thread-username, .voucher input, .hide--bigCards1, .hide--toBigCards1 {
                color: ${textColor};
            }
            .speechBubble {
                background-color: ${darkBackgroundColor};
                color: ${textColor};
            }
            .thread--type-card, .thread--type-list, .conversationList-msg--read:not(.conversationList-msg--active), .card, .threadCardLayout--card article, .threadCardLayout--card article span .threadCardLayout--card article span, .vote-box, .cept-comments-link, .subNavMenu-btn {
                background-color: ${darkBackgroundColor} !important;
                border-color: ${darkBorderColor};
            }
            .thread--deal, .thread--discussion {
                background-color: ${darkBackgroundColor};
                border-color: ${darkBorderColor};
                border-top: none; /* there is some problem with the top border => whole article goes up */
                border-radius: 5px;
            }
            .input, .inputBox, .secretCode-codeBox, .toolbar, .voucher-code {
                background-color: ${darkBackgroundColor};
                border-color: ${lightBorderColor};
            }
            /* Arrows */
            .input-caretLeft {
                border-right-color: ${lightBorderColor};
            }
            .input-caretLeft:before {
                border-right-color: ${darkBackgroundColor};
            }
            .popover--layout-s > .popover-arrow:after, .inputBox:after {
                border-bottom-color: ${darkBackgroundColor};
            }
            .popover--layout-n > .popover-arrow:after {
                border-top-color: ${darkBackgroundColor};
            }
            .popover--layout-w > .popover-arrow:after {
                border-left-color: ${darkBackgroundColor};
            }
            .popover--layout-e > .popover-arrow:after {
                border-right-color: ${darkBackgroundColor};
            }
            /* END: Arrows */
            /* Faders */
            .overflow--fade-b-r--l:after, .overflow--fade-b-r--s:after, .overflow--fade-b-r:after, .overflow--fromW3-fade-b-r--l:after, .overflow--fromW3-fade-r--l:after, .thread-title--card:after, .thread-title--list--merchant:after, .thread-title--list:after {
                background: -webkit-linear-gradient(left,hsla(0,0%,100%,0),${darkBackgroundColor} 50%,${darkBackgroundColor});
                background: linear-gradient(90deg,hsla(0,0%,100%,0),${darkBackgroundColor} 50%,${darkBackgroundColor});
                /* filter: brightness(100%) !important; */
            }
            .fadeEdge--r:after, .overflow--fade:after {
                background: -webkit-linear-gradient(left,hsla(0,0%,100%,0),${darkBackgroundColor} 80%);
                background: linear-gradient(90deg,hsla(0,0%,100%,0) 0,${darkBackgroundColor} 80%);
                filter: brightness(100%) !important;
            }
            .text--overlay:before {
                background-image: -webkit-linear-gradient(left,hsla(0,0%,100%,0),${darkBackgroundColor} 90%);
                background-image: linear-gradient(90deg,hsla(0,0%,100%,0),${darkBackgroundColor} 90%);
                filter: brightness(100%) !important;
            }
            /* END: Faders */
            .btn--border, .bg--off, .boxSec--fromW3:not(.thread-infos), .boxSec, .voucher-codeCopyButton, .search input, .img, .userHtml-placeholder, .userHtml img, .popover--subNavMenu .popover-content {
                border: 1px solid ${darkBorderColor} !important;  /* need full border definition for .bg--off */
            }
            .tabbedInterface-tab--selected, .bg--main, .tabbedInterface-tab--horizontal, .tabbedInterface-tab--selected, .comments-item--in-moderation, .comments-item-inner--active, .comments-item-inner--edit, /*.thread.cept-sale-event-thread.thread--deal,*/ .vote-btn, .notification-item:not(.notification-item--read), .search div, .search input, .text--overlay, .popover--brandAccent .popover-content, .popover--brandPrimary .popover-content, .popover--default .popover-content, .popover--menu .popover-content, .popover--red .popover-content {
                background-color: ${darkBackgroundColor} !important;
            }
            .notification-item:hover, .notification-item--read:hover {
                filter: brightness(75%);
            }
            .speechBubble:before, .speechBubble:after, .text--color-white.threadTempBadge--card, .text--color-white.threadTempBadge {
                color: ${darkBackgroundColor};
            }
            .bg--off, .js-pagi-bottom, .js-sticky-pagi--on, .bg--color-grey, .notification-item--read, #main, .subNavMenu--menu .subNavMenu-list {
                background-color: ${lightBackgroundColor} !important;
                color: ${textColor};
            }
            .tabbedInterface-tab--transparent {
                background-color: ${lightBackgroundColor};
            }
            .page-divider, .popover-item, .boxSec-divB, .boxSec--fromW3, .cept-comment-link, .border--color-borderGrey, .border--color-greyTint, .staticPageHtml table, .staticPageHtml td, .staticPageHtml th {
                border-color: ${lightBorderColor};
            }
            .listingProfile, .tabbedInterface-tab--primary:not(.tabbedInterface-tab--selected):hover, .navMenu-trigger, .navMenu-trigger--active, .navMenu-trigger--active:focus, .navMenu-trigger--active:hover, .navDropDown-link:focus, .navDropDown-link:hover {
                background-color: ${veryDarkBackgroundColor} !important;
            }
            .popover--modal .popover-content, .bg--color-white, .listingProfile-header, .profileHeader, .bg--em, nav.comments-pagination {
                background-color: ${veryDarkBackgroundColor};
                color: ${textColor} !important;
            }
            .bg--color-greyPanel {
                background-color: ${darkestBackgroundColor};
            }
            .bg--color-greyTint, .thread-divider, .btn--mode-filter {
                background-color: ${textColor};
            }
            img.avatar[src*="placeholder"] {
                filter: brightness(75%);
            }
            .btn--mode-dark-transparent, .btn--mode-dark-transparent:active, .btn--mode-dark-transparent:focus, button:active .btn--mode-dark-transparent, button:focus .btn--mode-dark-transparent {
                background-color: inherit;
            }
            .boxSec-div, .boxSec-div--toW2 {
                border-top: 1px solid ${darkBorderColor};
            }
            .profileHeader, .nav, .navDropDown-item, .navDropDown-link, .navDropDown-pItem, .subNavMenu--menu .subNavMenu-item--separator {
                border-bottom: 1px solid ${darkBorderColor};
            }
            .footer, .subNav, .voteBar, .comment-item {
                background-color: ${darkBackgroundColor};
                border-bottom: 1px solid ${darkBorderColor};
            }
            .comments-list--top .comments-item:target .comments-item-inner, .comments-list .comments-item, .comments-list .comments-list-item:target .comments-item-inner {
                border-bottom: 1px solid ${darkBorderColor};
            }
            .fadeOuterEdge--l {
                box-shadow: -20px 0 17px -3px ${darkBackgroundColor};
            }
            .vote-box {
                box-shadow: 10px 0 10px -3px ${darkBackgroundColor};
            }
            .btn--mode-boxSec, .btn--mode-boxSec:active, .btn--mode-boxSec:focus, .btn--mode-boxSec:hover, button:active .btn--mode-boxSec, button:focus .btn--mode-boxSec, button:hover .btn--mode-boxSec {
                background-color: ${textColor};
            }
            .overflow--fade:after {
                background-color: linear-gradient(90deg,hsla(0,0%,100%,0) 0,#242424 80%) !important;
            }
            img, .badge {
                filter: invert(5%) brightness(90%);
            }
            .thread--expired > * {
                filter: opacity(40%) brightness(90%);
            }
            .icon--overflow {
                color: ${textColor};
            }
            .input {
                line-height: 1.1rem;
            }
        `;
        (document.head || document.documentElement).insertAdjacentHTML('beforeend', `<style>${css}</style>`);
    }
    /*** END: Dark Theme Style ***/

    /***** END: RUN AT DOCUMENT START (BEFORE LOAD) *****/


    /**********************************************/
    /***** RUN AFTER DOCUMENT HAS BEEN LOADED *****/
    /**********************************************/

    const startPepperTweaker = () => {

        /*** Default configuration ***/

        const backupConfigOnFailureLoad = {
            dealsFilters: true,
            commentsFilters: true,
        };

        /* Plugin Enabled */
        const defaultConfigPluginEnabled = true;

        /* Dark Theme Enabled */
        const defaultConfigDarkThemeEnabled = true;

        /* Improvements */
        const defaultConfigImprovements = {
            repairDealDetailsLinks: true,
            repairDealImageLink: true,
            addLikeButtonsToBestComments: true,
            addSearchInterface: true,
        };

        /* Auto Update */
        const defaultConfigAutoUpdate = {
            dealsDefaultEnabled: false,
            commentsDefaultEnabled: false,
            soundEnabled: true,
            askBeforeLoad: false,
        };

        /* Deals Filters */
        const defaultConfigDealsFilters = [
            { name: 'Alkohol słowa kluczowe', keyword: /\bpiw[oa]\b|\bbeer|alkohol|whiske?y|likier|w[óo]d(ecz)?k[aąieę]|\bwark[aąieę]|\bbols|\bsoplica\b|johnni?(e|y) walker|jim ?beam|gentleman ?jack|beefeater|tequilla|\bmacallan|hennessy|armagnac ducastaing|\bbaczewski|\baperol|\bvodka|carlsberg|kasztelan|okocim|smuggler|martini|\blager[ay]?\b|żywiec|pilsner|\brum[uy]?\b|książęce|\btrunek|amundsen|\bbrandy\b|żubrówk[aąięe]|\bradler\b|\btyskie\b|bourbon|glen moray|\bbrowar|\bgran[td]'?s\b|jagermeister|jack daniel'?s|\blech\b|heineken|\bcalsberg|\bbacardi\b|\bbushmills|\bballantine'?s/i, style: { opacity: '0.3' } },  // don't use: \bwin(a|o)\b <-- to many false positive e.g. Wiedźmin 3 Krew i Wino
            { name: 'Disco Polo', keyword: /disco polo/i, style: { display: 'none' } },
            { name: 'Niezdrowe jedzenie', merchant: /mcdonalds|kfc|burger king/i, style: { opacity: '0.3' } },
            { name: 'Aliexpress/Banggood', merchant: /aliexpress|banggood/i, style: { border: '4px dashed #e00034' } },
            { name: 'Nieuczciwi sprzedawcy', merchant: /empik|komputronik|proline|super-pharm/i, style: { border: '4px dashed #1f7ecb' } },
            { name: 'Największe przeceny', discountAbove: 80, style: { border: '4px dashed #51a704' } },
            { name: 'Spożywcze', groups: /spożywcze/i, style: { opacity: '0.3' } },
            { name: 'Lokalne', local: true, style: { border: '4px dashed #880088' } },
        ];

        /* Comments filters */
        const defaultConfigCommentsFilters = [
            { name: 'SirNiedźwiedź', active: true, user: /SirNiedźwiedź/i, style: { border: '2px dotted #51a704'} },
            { name: 'G... burze by urtedbo', user: /urtedbo/i, keyword: /poo.*burz[eęaą]/i, style: { display: 'none'} },  // can match emoticons (also in brackets) => <i class="emoji emoji--type-poo" title="(poo)"></i>
            { name: 'Brzydkie słowa', keyword: /gówno|gowno|dópa|dupa/i, style: { opacity: '0.3'} },
        ];

        const createNewFilterName = 'Utwórz nowy...';

        const defaultFilterStyleValues = {
            deals : {
                display: 'none',
                opacity: '0.3',
                borderWidth: '4px',
                borderStyle: 'dashed',
                borderColor: '#880088',  // '#ff7900'
            },
            comments : {
                display: 'none',
                opacity: '0.3',
                borderWidth: '2px',
                borderStyle: 'dotted',
                borderColor: '#880088',
            },
        };

        /*** END: Deafult Configuration ***/

        const messageWrongJSONStyle = 'Niewłaściwa składnia w polu stylu. Należy użyć składni JSON.';

        //RegExp.prototype.toJSON = RegExp.prototype.toString;  // to stringify & parse RegExp
        //const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        const newRegExp = (pattern, flags = 'i') => (pattern instanceof RegExp || pattern.constructor.name === 'RegExp') ? pattern : pattern && new RegExp(pattern, flags) || null;
        // const isEmptyObject = Object.entries(value).length === 0 && value.constructor === Object;
        const isBoolean = value => value === true || value === false;  // faster than typeof
        const isNumeric = value => !isNaN(parseFloat(value)) && isFinite(value);
        const isInteger = value => !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
        const isString = value => typeof value === 'string' || value instanceof String;

        const getCSSBorderColor = borderCSS => borderCSS && isString(borderCSS) && (borderCSS.match(/#[a-fA-F0-9]+/) || [''])[0] || null;  // match returns array or null => null will throw an error for index [0]
        const getCSSBorderStyle = borderCSS => borderCSS && isString(borderCSS) && (borderCSS.match(/dashed|dotted|solid|double|groove|ridge|inset|outset/) || [''])[0] || null;

        const arrayDifference = (array1, array2) => array1.filter(value => !array2.includes(value));
        const arrayIntersection = (array1, array2) => array1.filter(value => array2.includes(value));

        const JSONRegExpReplacer = (key, value) => (value instanceof RegExp) ? { __type__: 'RegExp', source: value.source, flags: value.flags } : value;
        const JSONRegExpReviver = (key, value) => (value && value.__type__ === 'RegExp') ? new RegExp(value.source, value.flags) : value;

        const zeroPad = number => (number < 10) ? `0${number}` : number;
        const getCurrentDateTimeString = () => {
            const now = new Date(),
                  year = now.getFullYear(),
                  month = zeroPad(now.getMonth() + 1),  // months starting from 0
                  day = zeroPad(now.getDate()),
                  hours = zeroPad(now.getHours()),
                  minutes = zeroPad(now.getMinutes()),
                  seconds = zeroPad(now.getSeconds());
            return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
        };

        const removeAllChildren = node => {
            while (node.hasChildNodes()) {
                node.removeChild(node.lastChild);
            }
        };

        /*** Configuration Functions ***/
        const setConfig = (configuration = { pluginEnabled, darkThemeEnabled, improvements, autoUpdate, dealsFilters, commentsFilters }, reload = false) => {
            if ((configuration.pluginEnabled !== undefined) && isBoolean(configuration.pluginEnabled)) {
                localStorage.setItem('PepperTweaker.config.pluginEnabled', JSON.stringify(configuration.pluginEnabled));
                pepperTweakerConfig.pluginEnabled = configuration.pluginEnabled;
            }
            if ((configuration.darkThemeEnabled !== undefined) && isBoolean(configuration.darkThemeEnabled)) {
                localStorage.setItem('PepperTweaker.config.darkThemeEnabled', JSON.stringify(configuration.darkThemeEnabled));
                pepperTweakerConfig.darkThemeEnabled = configuration.darkThemeEnabled;
            }
            if (configuration.improvements !== undefined) {  // only one option can be specified here
                configuration.improvements = {  // to ensure only these props are in the autoUpdate object
                    repairDealDetailsLinks: isBoolean(configuration.improvements.repairDealDetailsLinks) ? configuration.improvements.repairDealDetailsLinks : pepperTweakerConfig.improvements.repairDealDetailsLinks,
                    repairDealImageLink: isBoolean(configuration.improvements.repairDealImageLink) ? configuration.improvements.repairDealImageLink : pepperTweakerConfig.improvements.repairDealImageLink,
                    addLikeButtonsToBestComments: isBoolean(configuration.improvements.addLikeButtonsToBestComments) ? configuration.improvements.addLikeButtonsToBestComments : pepperTweakerConfig.improvements.addLikeButtonsToBestComments,
                    addSearchInterface: isBoolean(configuration.improvements.addSearchInterface) ? configuration.improvements.addSearchInterface : pepperTweakerConfig.improvements.addSearchInterface,
                };
                localStorage.setItem('PepperTweaker.config.improvements', JSON.stringify(configuration.improvements));
                pepperTweakerConfig.improvements = configuration.improvements;
            }
            if (configuration.autoUpdate !== undefined) {  // only one option can be specified here
                configuration.autoUpdate = {  // to ensure only these props are in the autoUpdate object
                    dealsDefaultEnabled: isBoolean(configuration.autoUpdate.dealsDefaultEnabled) ? configuration.autoUpdate.dealsDefaultEnabled : pepperTweakerConfig.autoUpdate.dealsDefaultEnabled,
                    commentsDefaultEnabled: isBoolean(configuration.autoUpdate.commentsDefaultEnabled) ? configuration.autoUpdate.commentsDefaultEnabled : pepperTweakerConfig.autoUpdate.commentsDefaultEnabled,
                    soundEnabled: isBoolean(configuration.autoUpdate.soundEnabled) ? configuration.autoUpdate.soundEnabled : pepperTweakerConfig.autoUpdate.soundEnabled,
                    askBeforeLoad: isBoolean(configuration.autoUpdate.askBeforeLoad) ? configuration.autoUpdate.askBeforeLoad : pepperTweakerConfig.autoUpdate.askBeforeLoad,
                };
                localStorage.setItem('PepperTweaker.config.autoUpdate', JSON.stringify(configuration.autoUpdate));
                pepperTweakerConfig.autoUpdate = configuration.autoUpdate;
            }
            if ((configuration.dealsFilters !== undefined) && Array.isArray(configuration.dealsFilters)) {
                localStorage.setItem('PepperTweaker.config.dealsFilters', JSON.stringify(configuration.dealsFilters, JSONRegExpReplacer));
                pepperTweakerConfig.dealsFilters = configuration.dealsFilters;
            }
            if ((configuration.commentsFilters !== undefined) && Array.isArray(configuration.commentsFilters)) {
                localStorage.setItem('PepperTweaker.config.commentsFilters', JSON.stringify(configuration.commentsFilters, JSONRegExpReplacer));
                pepperTweakerConfig.commentsFilters = configuration.commentsFilters;
            }
            if (reload) {
                location.reload();
            }
        };

        const resetConfig = (resetConfiguration = { resetPluginEnabled: true, resetDarkThemeEnabled: true, resetImprovements: true, resetAutoUpdate: true, resetDealsFilters: true, resetCommentsFilters: true }, reload = true) => {
            const setConfigObject = {};
            if (!resetConfiguration || resetConfiguration.resetPluginEnabled === true) {
                setConfigObject.pluginEnabled = defaultConfigPluginEnabled;
            }
            if (!resetConfiguration || resetConfiguration.resetDarkThemeEnabled === true) {
                setConfigObject.darkThemeEnabled = defaultConfigDarkThemeEnabled;
            }
            if (!resetConfiguration || resetConfiguration.resetImprovements === true) {
                setConfigObject.improvements = defaultConfigImprovements;
            }
            if (!resetConfiguration || resetConfiguration.resetAutoUpdate === true) {
                setConfigObject.autoUpdate = defaultConfigAutoUpdate;
            }
            if (!resetConfiguration || resetConfiguration.resetDealsFilters === true) {
                setConfigObject.dealsFilters = defaultConfigDealsFilters;
            }
            if (!resetConfiguration || resetConfiguration.resetCommentsFilters === true) {
                setConfigObject.commentsFilters = defaultConfigCommentsFilters;
            }
            setConfig(setConfigObject, reload);
        };

        const loadConfig = (outputConfig, inputConfig, reload = false) => {
            if (inputConfig) {
                try {
                    outputConfig = JSON.parse(inputConfig, JSONRegExpReviver);
                } catch (error) {
                    return false;
                }
            } else {
                const failedSettings = [];
                try {
                    outputConfig.pluginEnabled = JSON.parse(localStorage.getItem('PepperTweaker.config.pluginEnabled'));
                } catch (error) {
                    failedSettings.push({ name: 'pluginEnabled', error: error.message });
                }
                try {
                    outputConfig.darkThemeEnabled = JSON.parse(localStorage.getItem('PepperTweaker.config.darkThemeEnabled'));
                } catch (error) {
                    failedSettings.push({ name: 'darkThemeEnabled', error: error.message });
                }
                try {
                    outputConfig.improvements = JSON.parse(localStorage.getItem('PepperTweaker.config.improvements'));
                } catch (error) {
                    failedSettings.push({ name: 'improvements', error: error.message });
                }
                try {
                    outputConfig.autoUpdate = JSON.parse(localStorage.getItem('PepperTweaker.config.autoUpdate'));
                } catch (error) {
                    failedSettings.push({ name: 'autoUpdate', error: error.message });
                }
                try {
                    outputConfig.dealsFilters = JSON.parse(localStorage.getItem('PepperTweaker.config.dealsFilters'), JSONRegExpReviver);
                } catch (error) {
                    failedSettings.push({ name: 'dealsFilters', error: error.message });
                }
                try {
                    outputConfig.commentsFilters = JSON.parse(localStorage.getItem('PepperTweaker.config.commentsFilters'), JSONRegExpReviver);
                } catch (error) {
                    failedSettings.push({ name: 'commentsFilters', error: error.message });
                }
                for (const failed of failedSettings) {
                    console.error(`Cannot parse PepperTweaker.config.${failed.name}: ${failed.error}`);
                    console.error(`Value of ${failed.name}: ` + localStorage.getItem(`PepperTweaker.config.${failed.name}`));
                    if (backupConfigOnFailureLoad[failed.name] === true) {
                        localStorage.setItem(`PepperTweaker.config.${failed.name}-backup`, localStorage.getItem(`PepperTweaker.config.${failed.name}`));
                        console.error(`Current ${failed.name} value saved as PepperTweaker.config.${failed.name}-backup`);
                    }
                    outputConfig[failed.name] = null;
                }
            }
            const configToReset = {};
            if (!isBoolean(outputConfig.pluginEnabled)) {
                configToReset.resetPluginEnabled = true;
            }
            if (!isBoolean(outputConfig.darkThemeEnabled)) {
                configToReset.resetDarkThemeEnabled = true;
            }
            if (!outputConfig.improvements
                || !isBoolean(outputConfig.improvements.repairDealDetailsLinks)
                || !isBoolean(outputConfig.improvements.repairDealImageLink)
                || !isBoolean(outputConfig.improvements.addLikeButtonsToBestComments)
                || !isBoolean(outputConfig.improvements.addSearchInterface)) {
                configToReset.resetImprovements = true;
            }
            if (!outputConfig.autoUpdate
                || !isBoolean(outputConfig.autoUpdate.dealsDefaultEnabled)
                || !isBoolean(outputConfig.autoUpdate.commentsDefaultEnabled)
                || !isBoolean(outputConfig.autoUpdate.soundEnabled)
                || !isBoolean(outputConfig.autoUpdate.askBeforeLoad)) {
                configToReset.resetAutoUpdate = true;
            }
            if (!Array.isArray(outputConfig.dealsFilters)) {
                configToReset.resetDealsFilters = true;
            }
            if (!Array.isArray(outputConfig.commentsFilters)) {
                configToReset.resetCommentsFilters = true;
            }
            resetConfig(configToReset, reload);
            return true;
        }

        const saveConfigFile = () => {
            const link = document.createElement('A');
            const file = new Blob([JSON.stringify(pepperTweakerConfig, JSONRegExpReplacer)], { type: 'text/plain' });
            link.href = URL.createObjectURL(file);
            link.download = `PepperTweaker-config-[${getCurrentDateTimeString()}].json`;
            link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        };

        const importConfigFromFile = () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'application/json';
            fileInput.onchange = event => {
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = () => {
                    if (!loadConfig(reader.result)) {
                        alert('Ten plik nie wygląda jak konfiguracja PepperTweakera :/');
                    }
                };
                reader.readAsText(file);
            };
            fileInput.click();
        };
        /*** END: Configuration Functions ***/

        /*** Load Configuration from Local Storage ***/
        const pepperTweakerConfig = {};
        loadConfig(pepperTweakerConfig);
        /*** END: Load configuration ***/

        if (pepperTweakerConfig.pluginEnabled) {

            /*** Change Theme Button ***/
            const messagesButton = document.querySelector('.cept-navDropDown--messages');
            const searchForm = document.querySelector('form.search');
            if (messagesButton) {
                const themeButtonDiv = document.createElement('DIV');
                themeButtonDiv.classList.add('navDropDown', 'hAlign--all-l', 'vAlign--all-m', 'space--r-3', 'hide--toW2');  // space--r-3 => right space
                const themeButtonLink = document.createElement('A');
                themeButtonLink.classList.add('btn', 'btn--square', 'navDropDown-btn', 'navDropDown-trigger', 'cept-trigger-user-activities-dropdown', 'navDropDown-trigger--highlight');
                const themeButtonImg = document.createElement('IMG');
                themeButtonImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAArlBMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADDOkjZAAAAOXRSTlMA3fOZiRSwMxFVoU/YkfKdOwP8Q0hu63cnC4Fw9vtaclSktufqy7H+9dvljTK1JhfKEsWlD3a37i9GF/eYAAAAnklEQVQY04XQ1xLCIBBA0QU0YmKiacbee++6//9jignMMj54n5gzQ1lgyNE0G0EeMVzOC0TaWqMvTfuaxhKYHIJbIY4vIe4WNhFbHn8+4Hqy8ZZUdXGoMM2y84W8wSkukuhXdG4EkasWB4oIi++O1JoBwlgdvrMxr4y4YWyFAWNTio3PRFgH8P5iIuUEx1IOKP5e1O4T4/rXOj1jQfcNdIApApX/xhoAAAAASUVORK5CYII=';
                themeButtonImg.style.filter = 'invert(60%)';
                themeButtonLink.appendChild(themeButtonImg);
                themeButtonDiv.appendChild(themeButtonLink);
                themeButtonDiv.onclick = () => setConfig({ darkThemeEnabled : !pepperTweakerConfig.darkThemeEnabled }, true);
                // messagesButton.parentNode.insertBefore(themeButtonDiv, messagesButton);
                searchForm.parentNode.insertBefore(themeButtonDiv, searchForm);
            }
            /*** END: Change Theme Button ***/

            /*** Menu Links Addition ***/
            const subNav = document.querySelector('section.subNav');
            if (subNav) {
                /* Add my alerts and saved threads links */
                const addSubNavMenuItem = (text, link) => {  // this can be done with cloneNode too...
                    const subNavMenu = document.querySelector('.subNavMenu-list');
                    const savedThreadsElement = document.createElement('LI');
                    savedThreadsElement.classList.add('subNavMenu-item--separator', 'cept-sort-tab');
                    const savedThreadsLink = document.createElement('A');
                    savedThreadsLink.href = link;
                    savedThreadsLink.classList.add('subNavMenu-item', 'subNavMenu-link', 'boxAlign-ai--all-c');
                    const savedThreadsSpan = document.createElement('SPAN');
                    savedThreadsSpan.classList.add('box--all-i', 'size--all-m', 'vAlign--all-m');
                    const savedThreadsText = document.createTextNode(text);
                    savedThreadsSpan.appendChild(savedThreadsText);
                    savedThreadsLink.appendChild(savedThreadsSpan);
                    savedThreadsElement.appendChild(savedThreadsLink);
                    subNavMenu.appendChild(savedThreadsElement);
                }
                let linkElement;
                if (!subNav.querySelector('a[href$="/keyword-alarms"]') && (linkElement = document.querySelector('a[href$="/keyword-alarms"]'))) {
                    addSubNavMenuItem('Lista alertów', linkElement.href);
                }
                if (!subNav.querySelector('a[href$="/saved-deals"]') && (linkElement = document.querySelector('a[href$="/saved-deals"]'))) {
                    addSubNavMenuItem('Ulubione', linkElement.href);
                }
            }
            /*** END: Menu Links Addition ***/
        }

        const createLabeledCheckbox = ({ label = '', id, checked, callback } = {}) => {
            const wrapperDiv = document.createElement('DIV');
            wrapperDiv.classList.add('space--v-1');

            const labelElement = document.createElement('LABEL');
            labelElement.classList.add('checkbox', 'size--all-m');

            const inputElement = document.createElement('INPUT');
            inputElement.classList.add('input', 'checkbox-input');
            inputElement.type = 'checkbox';
            if (id) {
                inputElement.id = id;
            }
            if (checked === true) {
                inputElement.checked = true;
            }
            if (callback) {
                inputElement.onchange = callback;
            }

            const spanGridCell = document.createElement('SPAN');
            spanGridCell.classList.add('tGrid-cell', 'tGrid-cell--shrink');
            const spanCheckboxBox = document.createElement('SPAN');
            spanCheckboxBox.classList.add('checkbox-box', 'flex--inline', 'boxAlign-jc--all-c', 'boxAlign-ai--all-c');
            const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgElement.classList.add('icon', 'icon--tick', 'text--color-white', 'checkbox-tick');
            svgElement.setAttribute('width', '20');
            svgElement.setAttribute('height', '16');
            const useElement = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '/assets/img/ico_37b33.svg#tick');
            svgElement.appendChild(useElement);
            spanCheckboxBox.appendChild(svgElement);
            spanGridCell.appendChild(spanCheckboxBox);

            const spanCheckboxText = document.createElement('SPAN');
            spanCheckboxText.classList.add('checkbox-text', 'tGrid-cell', 'space--l-2');
            spanCheckboxText.textContent = label;

            labelElement.appendChild(inputElement);
            labelElement.appendChild(spanGridCell);
            labelElement.appendChild(spanCheckboxText);

            wrapperDiv.appendChild(labelElement);
            return wrapperDiv;
        };

        const createLabeledButton = ({ label = '', id, className = 'default', callback} = {}) => {
            const wrapperDiv = document.createElement('DIV');
            wrapperDiv.classList.add('space--v-2');

            const buttonElement = document.createElement('BUTTON');
            buttonElement.classList.add('btn', 'width--all-12', 'hAlign--all-c', `btn--mode-${className}`);
            if (id) {
                buttonElement.id = id;
            }
            if (callback) {
                buttonElement.onclick = callback;
            }
            const buttonText = document.createTextNode(label);
            buttonElement.appendChild(buttonText);

            wrapperDiv.appendChild(buttonElement);
            return wrapperDiv;
        };

        const createTextInput = ({ id, value, placeholder, required = false } = {}) => {
            const wrapperDiv = document.createElement('DIV');
            wrapperDiv.classList.add('space--v-2');
            const textInput = document.createElement('INPUT');
            textInput.classList.add('input', 'width--all-12', 'size--all-l');
            if (id) {
                textInput.id = id;
            }
            if (value) {
                textInput.value = value;
            }
            if (placeholder) {
                textInput.placeholder = placeholder;
            }
            if (required === true) {
                textInput.required = true;
            }
            wrapperDiv.appendChild(textInput);
            return wrapperDiv;
        };

        /*** Settings Page ***/
        if (location.pathname.indexOf('/settings') >= 0) {

            let settingsPageConfig = {};  // will be set after function definitions (we need create-function names)

            const filterType = Object.freeze({
                deals: 'deals',
                comments: 'comments',
            });

            const createSettingsBlock = label => {
                const blockContainer = document.createElement('DIV');
                blockContainer.classList.add('iGrid', 'space--v-4', 'page-divider');
                const headerContainer = document.createElement('DIV');
                headerContainer.classList.add('iGrid-item', 'width--all-12', 'width--fromW4-6', 'space--b-2');
                const headerElement = document.createElement('H2');
                headerElement.classList.add('userProfile-title--sub', 'text--b');
                const labelText = document.createTextNode(label);
                headerElement.appendChild(labelText);
                headerContainer.appendChild(headerElement);
                blockContainer.appendChild(headerContainer);
                return blockContainer;
            };

            const createSettingsBlockHeader = (label, divider = true) => {
                const headerContainer = document.createElement('DIV');
                headerContainer.classList.add('formList-row', 'width--all-12', 'space--b-2');
                const headerElement = document.createElement('H2');
                headerElement.classList.add('userProfile-title--sub', 'text--b', 'space--v-4');
                const labelText = document.createTextNode(label);
                headerElement.appendChild(labelText);
                if (divider) {
                    headerContainer.appendChild(createDivider(false));
                }
                headerContainer.appendChild(headerElement);
                return headerContainer;
            };

            const createSettingsRow = label => {
                const rowDiv = document.createElement('DIV');
                rowDiv.classList.add('formList-row');
                const labelSpan = document.createElement('SPAN');
                labelSpan.classList.add('formList-label');
                const labelText = document.createTextNode(label);
                const contentDiv = document.createElement('DIV');
                contentDiv.classList.add('formList-content');
                labelSpan.appendChild(labelText);
                rowDiv.appendChild(labelSpan);
                rowDiv.appendChild(contentDiv);
                return rowDiv;
            }

            const addSelectOptionElement = (selectElement, optionValue) => {
                const optionElement = document.createElement('OPTION');
                optionElement.value = optionValue;
                optionElement.appendChild(document.createTextNode(optionValue))
                selectElement.appendChild(optionElement);
                return optionElement;
            };

            // Works only in settings page because of cloneNode() !!!
            const createSelectInput = ({ options = [ createNewFilterName ], value, id, callback } = {}) => {
                const select = document.querySelector('#defaultLandingPage .select').cloneNode(true);
                const selectCtrl = select.querySelector('.select-ctrl');
                selectCtrl.name = 'filter_selection';
                if (id) {
                    selectCtrl.id = id;
                }
                if (callback) {
                    selectCtrl.onchange = callback;
                }
                removeAllChildren(selectCtrl);
                for (const optionValue of options) {
                    addSelectOptionElement(selectCtrl, optionValue);
                }
                if (value && options.includes(value)) {
                    selectCtrl.value = value;
                }
                select.querySelector('.js-select-val').textContent = options[selectCtrl.selectedIndex];
                return select;
            };

            const createLabeledInput = ({ id, beforeLabel = '', afterLabel = '', min, max, step } = {}) => {
                const wrapperDiv = document.createElement('DIV');
                wrapperDiv.classList.add('space--v-2');

                const spanElement = document.createElement('SPAN');
                spanElement.classList.add('formList-label-content', 'lbox--v-1');
                const spanText = document.createTextNode(beforeLabel);
                spanElement.appendChild(spanText);

                const divElement = document.createElement('DIV');
                divElement.classList.add('tGrid', 'tGrid--auto', 'width--all-12');
                const inputElement = document.createElement('INPUT');
                inputElement.classList.add('input', 'width--all-12', 'bRad--r-r');
                inputElement.type = 'number';
                if (id) {
                    inputElement.id = id;
                }
                if (isNumeric(min)) {
                    inputElement.min = min;
                }
                if (isNumeric(max) && (max >= min)) {
                    inputElement.max = max;
                }
                if (isNumeric(step)) {
                    inputElement.step = step;
                }
                const labelElement = document.createElement('LABEL');
                labelElement.classList.add('tGrid-cell', 'tGrid-cell--shrink', 'btn', 'bRad--l-r', 'vAlign--all-m');
                const labelText = document.createTextNode(afterLabel);
                labelElement.appendChild(labelText);
                divElement.appendChild(inputElement);
                divElement.appendChild(labelElement);

                wrapperDiv.appendChild(spanElement);
                wrapperDiv.appendChild(divElement);
                return wrapperDiv;
            };

            const createColorInput = ({ color = '#000000', id, callback, wrapper = false, style: { width = '36px', height = '30px', ...restStyle } = {} } = {}) => {
                const colorInput = document.createElement('INPUT');
                colorInput.type = 'color';
                colorInput.value = color;
                Object.assign(colorInput.style, { width, height, restStyle });  // default values for style.width and/or style.height will be overwritten if supplied to style parameter
                if (id) {
                    colorInput.id = id;
                }
                if (callback) {
                    colorInput.onchange = callback;
                }
                if (wrapper === true) {
                    const wrapperDiv = document.createElement('DIV');
                    wrapperDiv.classList.add('space--v-1');
                    wrapperDiv.appendChild(colorInput);
                    return wrapperDiv;
                }
                return colorInput;
            };

            const createDivider = (verticalSpace = true) => {
                const wrapperDiv = document.createElement('DIV');
                if (verticalSpace) {
                    wrapperDiv.classList.add('space--v-4');
                }
                const dividerDiv = document.createElement('DIV');
                dividerDiv.classList.add('page-divider');
                dividerDiv.style.width = '582px';  // TODO: set to 100% some how...
                wrapperDiv.appendChild(dividerDiv);
                return wrapperDiv;
            };

            // display: { id: 'deals-filter-style-display', label: 'Ukrycie' },
            // opacity: { id: 'deals-filter-style-opacity', label: 'Przezroczystość' },
            // border: { id: 'deals-filter-style-border', label: 'Ramka' },
            const createStylingBlock = ({ display, opacity, border, borderColor, borderStyle, styleText, callback } = {}) => {
            // const createStylingBlock = ({
            //     display: { label: displayLabel = 'Ukrycie', id: displayId, checked: displayChecked = false } = {},
            //     opacity, border, borderColor, styleText, callback
            // } = {}) => {
                const wrapperDiv = document.createElement('DIV');
                if (display) {
                    wrapperDiv.appendChild(createLabeledCheckbox({ label: display.label, id: display.id, checked: display.checked, callback }));
                }
                // if (true) {
                //     wrapperDiv.appendChild(createLabeledCheckbox({ label: displayLabel, id: displayId, checked: displayChecked, callback }));
                // }
                if (opacity) {
                    wrapperDiv.appendChild(createLabeledCheckbox({ label: opacity.label, id: opacity.id, checked: opacity.checked, callback }));
                }
                if (border) {
                    const borderBlock = createLabeledCheckbox({ label: border.label, id: border.id, checked: border.checked, callback });
                    borderBlock.style.display = 'flex';
                    borderBlock.style.justifyContent = 'space-between';
                    borderBlock.style.alignItems = 'center';
                    if (borderColor) {
                        borderBlock.appendChild(createColorInput({ color: borderColor.color, id: borderColor.id, callback }));
                    }
                    if (borderStyle) {
                        const borderStyleSelect = createSelectInput({ options: ['dashed', 'dotted', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'], value: borderStyle.value, id: borderStyle.id, callback });
                        borderStyleSelect.classList.replace('width--all-12', 'width--all-6');
                        borderBlock.appendChild(borderStyleSelect);
                    }
                    wrapperDiv.appendChild(borderBlock);
                }
                if (styleText) {
                    wrapperDiv.appendChild(createTextInput({ id: styleText.id }));
                }
                return wrapperDiv;
            };

            const getFilterType = elementId => {
                for (const type of Object.values(filterType)) {
                    for (const rowBlock of Object.values(settingsPageConfig[type].rows)) {
                        for (const rowEntry of Object.values(rowBlock.entries)) {
                            if ((rowEntry.params.id === elementId) || Object.values(rowEntry.params).some(item => item.id === elementId)) {
                                return type;
                            }
                        }
                    }
                }
                return undefined;
            }

            const filterSelectionChange = event => {
                const filterType = getFilterType(event.target.id);
                const selectedFilter = pepperTweakerConfig[`${filterType}Filters`].find(filter => filter.name === event.target.value);
                updateFilterInputs(filterType, selectedFilter);
            };

            const updateFilterStyle = event => {
                const filterType = getFilterType(event.target.id);
                const styleBlock = settingsPageConfig[filterType].rows.filterStyle.entries.style;
                const styleTextInput = document.getElementById(styleBlock.params.styleText.id);
                let styleValue = {};
                if (styleTextInput.value) {
                    try {
                        styleValue = styleBlock.parse(styleTextInput.value);
                    } catch (error) {
                        alert(messageWrongJSONStyle);
                    }
                }
                styleValue.display = styleBlock.params.display && document.getElementById(styleBlock.params.display.id).checked ? defaultFilterStyleValues[filterType].display : undefined;
                styleValue.opacity = styleBlock.params.opacity && document.getElementById(styleBlock.params.opacity.id).checked ? defaultFilterStyleValues[filterType].opacity : undefined;
                if (styleBlock.params.border) {
                    let borderColor = defaultFilterStyleValues[filterType].borderColor;
                    let borderStyle = defaultFilterStyleValues[filterType].borderStyle;
                    let enableBorderCheckbox = false;
                    if (styleBlock.params.borderColor) {
                        borderColor = document.getElementById(styleBlock.params.borderColor.id).value;
                        if (event.target.id === styleBlock.params.borderColor.id) {
                            enableBorderCheckbox = true;
                        }
                    }
                    if (styleBlock.params.borderStyle) {
                        borderStyle = document.getElementById(styleBlock.params.borderStyle.id).value;
                        if (event.target.id === styleBlock.params.borderStyle.id) {
                            enableBorderCheckbox = true;
                        }
                    }
                    if (enableBorderCheckbox) {
                        document.getElementById(styleBlock.params.border.id).checked = true;
                    }
                    styleValue.border = document.getElementById(styleBlock.params.border.id).checked ? `${defaultFilterStyleValues[filterType].borderWidth} ${borderStyle} ${borderColor}` : undefined;
                }
                styleTextInput.value = styleBlock.stringify(styleValue);
            };

            const updateFilterInputs = (filterType, filter) => {
                const filterSelectionInput = document.getElementById(settingsPageConfig[filterType].rows.filterSelection.entries.filterSelectionInput.params.id);
                const filterOptionElement = filter && filter.name && filterSelectionInput.querySelector(`option[value="${filter.name}"]`) || null;
                filterSelectionInput.value = filterOptionElement && filterOptionElement.value || createNewFilterName;
                filterSelectionInput.parentNode.querySelector('.js-select-val').textContent = filter && filter.name || createNewFilterName;

                for (const settingRow of Object.values(settingsPageConfig[filterType].rows)) {
                    for (const [key, value] of Object.entries(settingRow.entries)) {
                        switch (value.create) {
                            case createTextInput:
                                document.getElementById(value.params.id).value = filter && filter[key] && (filter[key].source || filter[key]) || '';
                                break;
                            case createLabeledInput:
                                document.getElementById(value.params.id).value = filter && filter[key] || '';
                                break;
                            case createLabeledCheckbox:
                                document.getElementById(value.params.id).checked = (filter && isBoolean(filter[key])) ? filter[key] : value.params.checked;
                                break;
                            case createStylingBlock:
                                document.getElementById(value.params.display.id).checked = (filter && filter.style && filter.style.display === 'none') ? true : false;
                                document.getElementById(value.params.opacity.id).checked = (filter && filter.style && filter.style.opacity && parseFloat(filter.style.opacity) < 1) ? true : false;
                                document.getElementById(value.params.border.id).checked = (filter && filter.style && filter.style.border && filter.style.border !== 'none') ? true : false;
                                document.getElementById(value.params.borderColor.id).value = filter && filter.style && filter.style.border && getCSSBorderColor(filter.style.border) || defaultFilterStyleValues[filterType].borderColor;
                                document.getElementById(value.params.borderStyle.id).value = filter && filter.style && filter.style.border && getCSSBorderStyle(filter.style.border) || defaultFilterStyleValues[filterType].borderStyle;
                                document.getElementById(value.params.borderStyle.id).parentNode.querySelector('.js-select-val').textContent = document.getElementById(value.params.borderStyle.id).value;
                                document.getElementById(value.params.styleText.id).value = filter && filter.style && JSON.stringify(filter.style) || '';
                        }
                    }
                }
            };

            const applyFilterChanges = event => {
                const filterType = getFilterType(event.target.id);
                const filterArrayName = `${filterType}Filters`;
                const filterSelectionInput = document.getElementById(settingsPageConfig[filterType].rows.filterSelection.entries.filterSelectionInput.params.id);
                const filterName = filterSelectionInput.value;
                const filterIndex = (filterSelectionInput.selectedIndex === 0) ? pepperTweakerConfig[filterArrayName].length : pepperTweakerConfig[filterArrayName].findIndex(item => item.name === filterName);  // if selectedIndex === 0 => add new filter

                if (event.target.id === settingsPageConfig[filterType].rows.filterSaveRemove.entries.removeButton.params.id) {
                    if (filterSelectionInput.selectedIndex === 0) {
                        alert('Musisz wybrać filtr, aby go usunąć.');
                        return;
                    }
                    if (confirm(`Potwierdź usunięcie filtra: ${filterName}`)) {
                        pepperTweakerConfig[filterArrayName].splice(filterIndex, 1);
                        filterSelectionInput.querySelector(`option[value="${filterName}"]`).remove();
                        localStorage.setItem(`PepperTweaker.config.${filterArrayName}`, JSON.stringify(pepperTweakerConfig[filterArrayName], JSONRegExpReplacer));
                        updateFilterInputs(filterType, null);
                    }
                }
                else if (event.target.id === settingsPageConfig[filterType].rows.filterSaveRemove.entries.saveButton.params.id) {
                    const newFilter = {};
                    let isEmptyFilter = true;
                    for (const settingRow of Object.values(settingsPageConfig[filterType].rows)) {
                        for (const [key, value] of Object.entries(settingRow.entries)) {
                            switch (value.create) {
                                case createTextInput:
                                case createLabeledInput:
                                    const inputNode = document.getElementById(value.params.id);
                                    const inputValue = inputNode && inputNode.value.trim();
                                    if (inputValue) {
                                        newFilter[key] = value.parse ? value.parse(inputValue) : inputValue;
                                        if (value.filtering !== false) {
                                            isEmptyFilter = false;
                                        }
                                    } else if (inputNode.required) {
                                        alert(`Musisz wypełnić pole ${settingRow.label.toLowerCase()}`);
                                        return;
                                    }
                                    break;
                                case createLabeledCheckbox:
                                    const inputChecked = document.getElementById(value.params.id).checked;
                                    if (inputChecked !== value.params.checked) {
                                        newFilter[key] = inputChecked;
                                        if (value.filtering !== false) {
                                            isEmptyFilter = false;
                                        }
                                    }
                                    break;
                                case createStylingBlock:  // this can be combine with Text & Labeled above
                                    newFilter[key] = document.getElementById(value.params.styleText.id).value.trim();
                                    if (newFilter[key].length < 1) {
                                        alert('Nie wybrano żadnego stylu dla filtra.');
                                        return;
                                    }
                                    try {
                                        newFilter[key] = value.parse(newFilter[key]);
                                    } catch (error) {
                                        alert(messageWrongJSONStyle);
                                        return;
                                    }
                                    if (Object.entries(newFilter[key]).length === 0) {
                                        alert('Podany styl jest obiektem pustym.');
                                        return;
                                    }
                                    break;
                            }
                        }
                    }

                    if (isEmptyFilter) {
                        alert('Wszystkie parametry nie mogą być puste. Taki filtr nie ma sensu ;)');
                        return;
                    }

                    const confirmMessage = (filterSelectionInput.selectedIndex === 0) ? `Czy chcesz utworzyć nowy filtr: ${newFilter.name}?` : `Czy rzeczywiście nadpisać filtr: ${filterName}?`;
                    if (confirm(confirmMessage)) {
                        filterSelectionInput.options[filterSelectionInput.selectedIndex || filterSelectionInput.options.length] = new Option(newFilter.name, newFilter.name, false, true);
                        pepperTweakerConfig[filterArrayName][filterIndex] = newFilter;
                        localStorage.setItem(`PepperTweaker.config.${filterArrayName}`, JSON.stringify(pepperTweakerConfig[filterArrayName], JSONRegExpReplacer));
                        updateFilterInputs(filterType, pepperTweakerConfig[filterArrayName][filterIndex]);
                    }
                }
            };

            /* Settings Page Configuration */
            settingsPageConfig = {
                global: {
                    header: 'Ustawienia ogólne',
                    rows: {
                        pluginEnabled: {
                            label: 'Włącz/Wyłącz plugin',
                            entries: {
                                pluginEnabledCheckbox: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'PepperTweaker aktywny',
                                        id: 'plugin-enabled',
                                        checked: pepperTweakerConfig.pluginEnabled,
                                        callback: event => setConfig({ pluginEnabled: event.target.checked }, true),
                                    },
                                },
                            },
                        },
                        darkThemeEnabled: {
                            label: 'Ciemny motyw',
                            entries: {
                                darkThemeCheckbox: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'Ciemny motyw włączony',
                                        id: 'dark-theme-enabled',
                                        checked: pepperTweakerConfig.darkThemeEnabled,
                                        callback: event => setConfig({ darkThemeEnabled: event.target.checked }, true),
                                    },
                                },
                            },
                        },
                        improvements: {
                            label: 'Poprawki / Ulepszenia',
                            entries: {
                                repairDealDetailsLinksCheckbox: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'Napraw linki w opisach ofert i komentarzach',
                                        id: 'repair-deal-details-links',
                                        checked: pepperTweakerConfig.improvements.repairDealDetailsLinks,
                                        callback: event => setConfig({ improvements: { repairDealDetailsLinks: event.target.checked } }, false),
                                    },
                                },
                                repairDealImageLinkCheckbox: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'Klik na miniaturce oferty zawsze otwiera pełnowymiarowy obrazek',
                                        id: 'repair-deal-image-link',
                                        checked: pepperTweakerConfig.improvements.repairDealImageLink,
                                        callback: event => setConfig({ improvements: { repairDealImageLink: event.target.checked } }, false),
                                    },
                                },
                                addLikeButtonsToBestCommentsCheckbox: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'Dodaj przyciski "Like" do najlepszych komentarzy',
                                        id: 'add-like-buttons-to-best-comments',
                                        checked: pepperTweakerConfig.improvements.addLikeButtonsToBestComments,
                                        callback: event => setConfig({ improvements: { addLikeButtonsToBestComments: event.target.checked } }, false),
                                    },
                                },
                                addSearchInterfaceCheckbox: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'Dodaj interfejs wyszukiwania (Google, Ceneo, Skąpiec)',
                                        id: 'add-search-interface',
                                        checked: pepperTweakerConfig.improvements.addSearchInterface,
                                        callback: event => setConfig({ improvements: { addSearchInterface: event.target.checked } }, false),
                                    },
                                },
                            },
                        },
                        autoUpdate: {
                            label: 'Automatyczne odświeżanie',
                            entries: {
                                dealsDeafultCheckbox: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'Domyślne odświeżanie listy ofert',
                                        id: 'autoupdate-deals-default-enabled',
                                        checked: pepperTweakerConfig.autoUpdate.dealsDefaultEnabled,
                                        callback: event => setConfig({ autoUpdate: { dealsDefaultEnabled: event.target.checked } }, false),
                                    },
                                },
                                commentsDefaultCheckbox: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'Domyślne odświeżanie komentarzy',
                                        id: 'autoupdate-comments-default-enabled',
                                        checked: pepperTweakerConfig.autoUpdate.commentsDefaultEnabled,
                                        callback: event => setConfig({ autoUpdate: { commentsDefaultEnabled: event.target.checked } }, false),
                                    },
                                },
                                soundEnabledCheckbox: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'Powiadom dzwiękiem',
                                        id: 'autoupdate-sound-enabled',
                                        checked: pepperTweakerConfig.autoUpdate.soundEnabled,
                                        callback: event => setConfig({ autoUpdate: { soundEnabled: event.target.checked } }, false),
                                    },
                                },
                                askBeforeLoadCheckbox: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'Pytaj przed załadowaniem',
                                        id: 'autoupdate-ask-before-load',
                                        checked: pepperTweakerConfig.autoUpdate.askBeforeLoad,
                                        callback: event => setConfig({ autoUpdate: { askBeforeLoad: event.target.checked } }, false),
                                    },
                                },
                            },
                        },
                        importExportConfig: {
                            label: 'Import/Export ustawień',
                            entries: {
                                importButton: {
                                    create: createLabeledButton,
                                    params: {
                                        label: 'Import z pliku',
                                        className: 'default',
                                        callback: importConfigFromFile
                                    },
                                },
                                exportButton: {
                                    create: createLabeledButton,
                                    params: {
                                        label: 'Export do pliku',
                                        className: 'default',
                                        callback: saveConfigFile
                                    },
                                },
                            },
                        },
                        resetConfig: {
                            label: 'Reset ustawień',
                            entries: {
                                importButton: {
                                    create: createLabeledButton,
                                    params: {
                                        label: 'Zresetuj wszystkie ustawienia',
                                        className: 'error',
                                        callback: () => {
                                            if (confirm('Czy zresetować wszystkie ustawienia do wartości domyślnych pluginu?')) {
                                                resetConfig();
                                                updateFilterInputs(filterType.deals, null);
                                                updateFilterInputs(filterType.comments, null);
                                            }
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                deals: {
                    header: 'Filtry okazji',
                    rows: {
                        filterSelection: {
                            label: 'Wybierz filtr',
                            entries: {
                                filterSelectionInput: {
                                    create: createSelectInput,
                                    params: {
                                        id: 'deals-filter-selection',
                                        options: [createNewFilterName, ...pepperTweakerConfig.dealsFilters.map(filter => filter.name)],
                                        callback: filterSelectionChange,
                                    },
                                },
                            },
                        },
                        filterName: {
                            label: 'Nazwa filtra',
                            entries: {
                                name: {
                                    create: createTextInput,
                                    params: {
                                        id: 'deals-filter-name',
                                        placeholder: 'Wpisz nazwę filtra',
                                        required: true,
                                    },
                                    filtering: false,
                                },
                            },
                        },
                        filterKeyword: {
                            label: 'Słowa kluczowe',
                            entries: {
                                keyword: {
                                    create: createTextInput,
                                    params: {
                                        id: 'deals-filter-keyword',
                                    },
                                    parse: newRegExp,
                                },
                            },
                        },
                        filterMerchant: {
                            label: 'Sprzedawca',
                            entries: {
                                merchant: {
                                    create: createTextInput,
                                    params: {
                                        id: 'deals-filter-merchant',
                                    },
                                    parse: newRegExp,
                                },
                            },
                        },
                        filterUser: {
                            label: 'Użytkownik',
                            entries: {
                                user: {
                                    create: createTextInput,
                                    params: {
                                        id: 'deals-filter-user',
                                    },
                                    parse: newRegExp,
                                },
                            },
                        },
                        filterGroup: {
                            label: 'Grupy',
                            entries: {
                                groups: {
                                    create: createTextInput,
                                    params: {
                                        id: 'deals-filter-groups',
                                    },
                                    parse: newRegExp,
                                },
                            },
                        },
                        filterLocal: {
                            label: 'Oferty lokalne',
                            entries: {
                                local: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'Filtr tylko dla ofert lokalnych',
                                        id: 'deals-filter-local',
                                        checked: false,
                                    },
                                },
                            },
                        },
                        filterPrice: {
                            label: 'Cena',
                            entries: {
                                priceBelow: {
                                    create: createLabeledInput,
                                    params: {
                                        id: 'deals-filter-price-below',
                                        beforeLabel: 'Cena poniżej',
                                        afterLabel: 'zł',
                                        min: 0,
                                        step: 0.01,
                                    },
                                    parse: parseFloat,
                                },
                                priceAbove: {
                                    create: createLabeledInput,
                                    params: {
                                        id: 'deals-filter-price-above',
                                        beforeLabel: 'Cena powyżej',
                                        afterLabel: 'zł',
                                        min: 0,
                                        step: 0.01,
                                    },
                                    parse: parseFloat,
                                },
                                discountBelow: {
                                    create: createLabeledInput,
                                    params: {
                                        id: 'deals-filter-discount-below',
                                        beforeLabel: 'Wielkość rabatu poniżej',
                                        afterLabel: '%',
                                        min: 0,
                                        max: 100,
                                        step: 1,
                                    },
                                    parse: parseInt,
                                },
                                discountAbove: {
                                    create: createLabeledInput,
                                    params: {
                                        id: 'deals-filter-discount-above',
                                        beforeLabel: 'Wielkość rabatu powyżej',
                                        afterLabel: '%',
                                        min: 0,
                                        max: 100,
                                        step: 1,
                                    },
                                    parse: parseInt,
                                },
                            },
                        },
                        filterStyle: {
                            label: 'Styl (CSS)',
                            entries: {
                                style: {
                                    create: createStylingBlock,
                                    params: {
                                        display: { id: 'deals-filter-style-display', label: 'Ukrycie' },
                                        opacity: { id: 'deals-filter-style-opacity', label: 'Przezroczystość' },
                                        border: { id: 'deals-filter-style-border', label: 'Ramka' },
                                        borderColor: { id: 'deals-filter-style-border-color', color: defaultFilterStyleValues.deals.borderColor },
                                        borderStyle: { id: 'deals-filter-style-border-style', value: defaultFilterStyleValues.deals.borderStyle },
                                        styleText: { id: 'deals-filter-style-text' },
                                        callback: updateFilterStyle,
                                    },
                                    parse: JSON.parse,
                                    stringify: JSON.stringify,
                                    filtring: false,
                                },
                            },
                        },
                        filterActive: {
                            label: 'Włącz/Wyłącz filtr',
                            entries: {
                                active: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'Filtr aktywny',
                                        id: 'deals-filter-active',
                                        checked: true,
                                    },
                                    filtring: false,
                                },
                            },
                        },
                        filterSaveRemove: {
                            label: 'Zapisz/Usuń filtr',
                            entries: {
                                saveButton: {
                                    create: createLabeledButton,
                                    params: {
                                        label: 'Zapisz filtr',
                                        id: 'deals-filter-save',
                                        className: 'success',
                                        callback: applyFilterChanges
                                    },
                                },
                                removeButton: {
                                    create: createLabeledButton,
                                    params: {
                                        label: 'Usuń filtr',
                                        id: 'deals-filter-remove',
                                        className: 'error',
                                        callback: applyFilterChanges
                                    },
                                },
                            },
                        },
                    },
                },
                comments: {
                    header: 'Filtry komentarzy',
                    rows: {
                        filterSelection: {
                            label: 'Wybierz filtr',
                            entries: {
                                filterSelectionInput: {
                                    create: createSelectInput,
                                    params: {
                                        id: 'comments-filter-selection',
                                        options: [createNewFilterName, ...pepperTweakerConfig.commentsFilters.map(filter => filter.name)],
                                        callback: filterSelectionChange,
                                    },
                                },
                            },
                        },
                        filterName: {
                            label: 'Nazwa filtra',
                            entries: {
                                name: {
                                    create: createTextInput,
                                    params: {
                                        id: 'comments-filter-name',
                                        placeholder: 'Wpisz nazwę filtra',
                                        required: true,
                                    },
                                    filtering: false,
                                },
                            },
                        },
                        filterKeyword: {
                            label: 'Słowa kluczowe',
                            entries: {
                                keyword: {
                                    create: createTextInput,
                                    params: {
                                        id: 'comments-filter-keyword',
                                    },
                                    parse: newRegExp,
                                },
                            },
                        },
                        filterUser: {
                            label: 'Użytkownik',
                            entries: {
                                user: {
                                    create: createTextInput,
                                    params: {
                                        id: 'comments-filter-user',
                                    },
                                    parse: newRegExp,
                                },
                            },
                        },
                        filterStyle: {
                            label: 'Styl (CSS)',
                            entries: {
                                style: {
                                    create: createStylingBlock,
                                    params: {
                                        display: { id: 'comments-filter-style-display', label: 'Ukrycie' },
                                        opacity: { id: 'comments-filter-style-opacity', label: 'Przezroczystość' },
                                        border: { id: 'comments-filter-style-border', label: 'Ramka' },
                                        borderColor: { id: 'comments-filter-style-border-color', color: defaultFilterStyleValues.comments.borderColor },
                                        borderStyle: { id: 'comments-filter-style-border-style', value: defaultFilterStyleValues.comments.borderStyle },
                                        styleText: { id: 'comments-filter-style-text' },
                                        callback: updateFilterStyle,
                                    },
                                    parse: JSON.parse,
                                    stringify: JSON.stringify,
                                    filtring: false,
                                },
                            },
                        },
                        filterActive: {
                            label: 'Włącz/Wyłącz filtr',
                            entries: {
                                active: {
                                    create: createLabeledCheckbox,
                                    params: {
                                        label: 'Filtr aktywny',
                                        id: 'comments-filter-active',
                                        checked: true,
                                    },
                                    filtring: false,
                                },
                            },
                        },
                        filterSaveRemove: {
                            label: 'Zapisz/Usuń filtr',
                            entries: {
                                saveButton: {
                                    create: createLabeledButton,
                                    params: {
                                        label: 'Zapisz filtr',
                                        id: 'comments-filter-save',
                                        className: 'success',
                                        callback: applyFilterChanges
                                    },
                                },
                                removeButton: {
                                    create: createLabeledButton,
                                    params: {
                                        label: 'Usuń filtr',
                                        id: 'comments-filter-remove',
                                        className: 'error',
                                        callback: applyFilterChanges
                                    },
                                },
                            },
                        },
                    },
                },
            };

            const preferencesTabLink = document.querySelector('a[href="#preferences"]');
            const filtersTabLink = preferencesTabLink.cloneNode(true);
            filtersTabLink.href = '#peppertweaker';
            filtersTabLink.classList.remove('tabbedInterface-tab--selected');
            filtersTabLink.querySelector('svg use').setAttribute('xlink:href', '/assets/img/ico_37b33.svg#filter');
            const filtersTabLinkInner = filtersTabLink.querySelector('.js-tabbedInterface-tab--inner-preferences');
            filtersTabLinkInner.classList.remove('js-tabbedInterface-tab--inner-preferences');
            filtersTabLinkInner.classList.add('js-tabbedInterface-tab--inner-filters');
            filtersTabLinkInner.textContent = 'PepperTweaker';
            preferencesTabLink.parentNode.appendChild(filtersTabLink);
            const preferencesTab = document.getElementById('tab-preferences');
            const filtersTab = preferencesTab.cloneNode(true);
            filtersTab.id = 'tab-peppertweaker';
            const filtersTitle = filtersTab.querySelector('.userProfile-title');
            filtersTitle.textContent = 'PepperTweaker';

            const rowsContainer = filtersTab.querySelector('.formList');
            removeAllChildren(rowsContainer);

            for (const settingsBlock of Object.values(settingsPageConfig)) {
                rowsContainer.appendChild(createSettingsBlockHeader(settingsBlock.header));
                for (const rowBlock of Object.values(settingsBlock.rows)) {
                    const newRowNode = createSettingsRow(rowBlock.label);
                    const newRowNodeContent = newRowNode.querySelector('.formList-content');
                    for (const rowEntry of Object.values(rowBlock.entries)) {
                        const newRowEntryNode = rowEntry.create(rowEntry.params);
                        if (rowEntry.style) {
                            Object.assign(newRowEntryNode.style, rowEntry.style);
                        }
                        newRowNodeContent.appendChild(newRowEntryNode);
                    }
                    rowsContainer.appendChild(newRowNode);
                }
            }

            preferencesTab.parentNode.insertBefore(filtersTab, preferencesTab.parentNode.querySelector('.userProfile-footer'));
            updateFilterInputs(filterType.deals, null);
            updateFilterInputs(filterType.comments, null);
            if (location.hash.indexOf('peppertweaker') >= 0) {
                filtersTab.classList.remove('hide');
                filtersTabLink.classList.add('tabbedInterface-tab--selected');
            }
            return;
        }
        /*** END: Settings Page ***/

        const searchEngine = Object.freeze({
            google: { name: 'Google', url: 'https://www.google.pl/search?q=' },
            ceneo: { name: 'Ceneo', url: 'https://www.ceneo.pl/;szukaj-' },  // ?nocatnarrow=1
            skapiec: { name: 'Skąpiec', url: 'https://www.skapiec.pl/szukaj/w_calym_serwisie/' },
        });
        const createSearchButton = (engine, query, marginRight = 2, marginLeft = 0) => {
            const searchLink = document.createElement('A');
            if (query instanceof Function) {
                searchLink.onclick = () => {
                    searchLink.href = engine.url + encodeURIComponent(query());
                    return true;
                };
            } else {
                searchLink.href = engine.url + encodeURIComponent(query);
            }
            searchLink.target = '_blank';
            searchLink.appendChild(document.createTextNode(`Szukaj w ${engine.name}`));
            searchLink.classList.add('subNavMenu-btn', `space--mr-${marginRight}`, `space--ml-${marginLeft}`);
            const wrapper = document.createElement('DIV');
            wrapper.classList.add('subNavMenu', 'subNavMenu--menu', 'tGrid-cell', 'vAlign--all-m', 'subNav-item');
            wrapper.appendChild(searchLink);
            return wrapper;
        };

        /*** Search Page ***/
        if (pepperTweakerConfig.improvements.addSearchInterface && (location.pathname.indexOf('/search') >= 0) && (location.search.indexOf('q=') >= 0)) {
            const searchSubheadline = document.querySelector('h1.cept-nav-subheadline');
            if (searchSubheadline) {
                const searchQuery = `site:${location.host.replace('www.', '')} ${searchSubheadline.textContent.replace(/Szukaj |"/gi, '')}`;
                const subNavMenu = document.querySelector('.subNavMenu--menu');
                subNavMenu.parentNode.insertBefore(createSearchButton(searchEngine.google, searchQuery), subNavMenu);
            }
            return;
        }
        /*** END: Search Page ***/

        const DEFAULT_NOTIFICATION_SOUND = new Audio('data:audio/mp3;base64,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bIckFua2x/PXG9Wzjds03FjQZJc4zjOM4///x///q1bSyQoMkskskOAJTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7ksTsA5lODPADGTICysFTCDM+uVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=');

        class BlinkingPageTitle {
            // #running = false;  // not implemented in FF yet (only experimental, set to false as default :/)
            constructor({ playSound = false, stopOnFocus = true, delay = 1100, soundSource = DEFAULT_NOTIFICATION_SOUND } = {}) {
                if (BlinkingPageTitle._instance) {
                  throw new Error(`Only one instance of ${this.constructor.name} class is allowed`);
                }
                BlinkingPageTitle._instance = this;
                this._running = false;
                this._interval = null;
                this._isOriginalTitle = true;

                this.stop = this.stop.bind(this);  // bind 'this' to stop() function

                this.originalTitle = document.title;
                this.playSound = playSound;
                this.stopOnFocus = stopOnFocus;
                this.delay = delay;

                this._soundSource = (soundSource instanceof HTMLAudioElement) ? soundSource : DEFAULT_NOTIFICATION_SOUND;
            }
            get soundSource() {
                return this._soundSource;
            }
            set soundSource(newSource) {
                if (newSource instanceof HTMLAudioElement) {
                    this._soundSource = newSource;
                }
            }
            run(message, callback) {
                if (this._running === true) {
                    // console.warn(`${this.constructor.name}: run() was called but running already`);
                    return false;
                }
                this._running = true;
                this._callback = callback;
                this._changeTitle(message);
                if (this.stopOnFocus === true) {
                    if (document.hidden || !document.hasFocus()) {
                        document.addEventListener('visibilitychange', this.stop);
                        window.addEventListener('focus', this.stop);  // must be window not document!
                        this._interval = setInterval(() => this._changeTitle(message), this.delay);
                    } else {
                        setTimeout(this.stop, this.delay);
                    }
                } else {
                    this._interval = setInterval(() => this._changeTitle(message), this.delay);
                    if (this._callback instanceof Function) {
                        this._callback(this);
                    }
                }
                return true;
            }
            stop() {
                if (!this._running) {
                    console.warn(`${this.constructor.name}: stop() was called but not running`);
                    return false;
                }
                if (this._interval) {
                    clearInterval(this._interval);
                    this._interval = null;
                }
                if (this.stopOnFocus === true) {
                    document.removeEventListener('visibilitychange', this.stop);
                    window.removeEventListener('focus', this.stop);  // must be window not document!
                    if (this._callback instanceof Function) {
                        this._callback(this);
                    }
                }
                document.title = this.originalTitle;
                this._running = false;
                return true;
            }
            _changeTitle(message) {
                if (this._isOriginalTitle) {
                    document.title = message;
                    if (this.playSound === true) {
                        this._soundSource.play();
                    }
                } else {
                    document.title = this.originalTitle;
                }
                this._isOriginalTitle = !this._isOriginalTitle;
            }
        }

        const arrayFilterIndexes = (array, callback) => {
            if (!array) { return null; }
            const arrayLength = array.length;
            const result = new Array();
            for (let i = 0; i < arrayLength; i++) {
                if (callback(array[i], i)) {
                    result.push(i);
                }
            }
            return result;
        };

        const removeAttributeRecursively = (node, attribute) => {
            node.removeAttribute(attribute);
            for (let i = 0, childrenLength = node.children.length; i < childrenLength; i++) {
                removeAttributeRecursively(node.children[i], attribute);
            }
            return node;
        };

        const removeDataAttributesRecursively = node => {
            for (const dataKey of Object.keys(node.dataset)) {
                delete node.dataset[dataKey];
            }
            for (let i = 0, childrenLength = node.children.length; i < childrenLength; i++) {
                removeDataAttributesRecursively(node.children[i]);
            }
            return node;
        };

        const nodeListDifference = (list1, list2, { ignoreInlineStyle = false, ignoreClassList = false, ignoreDataAttributes = false, deepCompare = false } = {}) => {
            if (!(list1 instanceof NodeList) || !(list2 instanceof NodeList)) { return null; }
            let array1, array2;
            if (deepCompare === true) {  // will check entire nodes
                array1 = Array.from(list1).map(node => node.cloneNode(true));
                array2 = Array.from(list2).map(node => node.cloneNode(true));
            } else {  // will check outer nodes only (without children)
                array1 = Array.from(list1).map(node => node.cloneNode(false));
                array2 = Array.from(list2).map(node => node.cloneNode(false));
            }
            let reducersToApply = [];
            if (ignoreInlineStyle === true) {
                reducersToApply.push(node => removeAttributeRecursively(node, 'style'));
            }
            if (ignoreClassList === true) {
                reducersToApply.push(node => removeAttributeRecursively(node, 'class'));  // node.classList.remove(...node.classList)
            }
            if (ignoreDataAttributes === true) {
                reducersToApply.push(node => removeDataAttributesRecursively(node));
            }
            if (reducersToApply.length > 0) {
                array1 = array1.map(node => reducersToApply.reduce((result, reducer) => reducer(result), node));
                array2 = array2.map(node => reducersToApply.reduce((result, reducer) => reducer(result), node));
                // array1 = array1.map(node => {
                //     reducersToApply.forEach(reducer => reducer(node));
                //     return node;
                // });
                // array2 = array2.map(node => {
                //     reducersToApply.forEach(reducer => reducer(node));
                //     return node;
                // });
            }
            return arrayFilterIndexes(array1, node1 => !array2.some(node2 => node2.isEqualNode(node1))).map(index => list1[index]);
        }

        class RemoteChildrenUpdateObserver {
            constructor({ containerSelector, childrenSelector, remoteUrl, updateCallback, tickCallback = undefined, errorCallback = undefined, ignoreInlineStyle = true, ignoreClassList = true, ignoreDataAttributes = true, deepCompare = false }) {
                if (!(updateCallback instanceof Function) || (tickCallback && !(updateCallback instanceof Function))) {
                    throw new TypeError(`${this.constructor.name}: updateCallback parameter must be a function (value: ${updateCallback})`);
                }
                Object.assign(this, { containerSelector, childrenSelector, remoteUrl, updateCallback, tickCallback, errorCallback, ignoreInlineStyle, ignoreClassList, ignoreDataAttributes, deepCompare });
                this._interval = null;
                this._running = false;
            }
            observe() {
                if (this._running) { return false; }
                this._interval = setInterval(() => {
                    fetch(this.remoteUrl, { cache: 'no-store' })
                        .then(response => {
                            if (response.ok) {
                                return response.text();
                            }
                            throw new Error(`fetch() resulted with status ${response.status} for url: ${this.remoteUrl}`);
                        })
                        .then(text => {
                            const htmlDoc = (new DOMParser()).parseFromString(text, 'text/html');
                            const cloudflareAlert = htmlDoc.documentElement.querySelector('#cf_alert_div');
                            if (cloudflareAlert) {
                                console.warn(`${this.constructor.name}: fetch() got the Cloudflare response (alert div with id: ${cloudflareAlert.id}) => this response will not be processed`);
                                return false;
                            }
                            this.container = document.querySelector(this.containerSelector);  // container can change, so we need to search it everytime
                            if (!this.container) {
                                console.warn(`${this.constructor.name}: this.container not found (value: ${this.container})`);
                                return false;
                            }
                            this.children = this.container.querySelectorAll(this.childrenSelector);
                            this.remoteContainer = htmlDoc.documentElement.querySelector(this.containerSelector);
                            if (!this.remoteContainer) {
                                console.warn(`${this.constructor.name}: this.remoteContainer not found (value: ${this.remoteContainer})`);
                                return false;
                            }
                            this.remoteChildren = this.remoteContainer.querySelectorAll(this.childrenSelector);
                            this.newChildren = nodeListDifference(this.remoteChildren, this.children, { ignoreInlineStyle: this.ignoreInlineStyle, ignoreClassList: this.ignoreClassList, ignoreDataAttributes: this.ignoreDataAttributes, deepCompare: this.deepCompare });
                            if (this.newChildren.length > 0) {
                                this.updateCallback(this);
                            }
                            if (this.tickCallback) {
                                this.tickCallback(this);
                            }
                            // console.log('Observer check done at: ' + (new Date()).toISOString());
                        })
                        .catch(error => {
                            console.error(`${this.constructor.name}: ${error}`);
                            if (this.errorCallback instanceof Function) {
                                this.errorCallback(this);
                            }
                        });
                }, 10 * 1000);
                this._running = true;
                return true;
            }
            disconnect() {
                if (!this._running) { return false; }
                if (this._interval) {
                    clearInterval(this._interval);
                    this._interval = null;
                }
                this._running = false;
                // console.log('Observer disconnect() at: ' + (new Date()).toISOString());
                return true;
            }
        }

        const blinkingTitle = new BlinkingPageTitle({
            stopOnFocus: !pepperTweakerConfig.autoUpdate.askBeforeLoad,
            playSound: pepperTweakerConfig.autoUpdate.soundEnabled,
        });

        const repairSvgWithUseChildren = element => {
            const svgChildren = element.querySelectorAll('svg');
            for (const svgChild of svgChildren) {
                const svgReplacement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                for (const svgChildAttribute of svgChild.attributes) {
                    svgReplacement.setAttribute(svgChildAttribute.name, svgChildAttribute.value);
                }
                const useChild = svgChild.querySelector('use');
                const useReplacement = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                useReplacement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', useChild.href.baseVal);
                svgReplacement.appendChild(useReplacement);
                svgChild.parentNode.insertBefore(svgReplacement, svgChild);
                svgChild.remove();
            }
            return element;
        };

        const openConfirmDialog = (title, message, confirmCallback, cancelCallback) => {
            const modalSection = document.createElement('SECTION');
            modalSection.classList.add('js-layer', 'popover', 'popover--modal', 'popover--fade', 'popover--layout-modal', 'popover--visible');
            const popoverContent = document.createElement('DIV');
            popoverContent.classList.add('popover-content', 'popover-content--expand');
            popoverContent.classList.add('space--h-3', 'space--v-3');
            const titleBox = document.createElement('H1');
            titleBox.classList.add('formList-label', 'size--all-xl', 'space--v-1');
            titleBox.style.textAlign = 'center';
            titleBox.appendChild(document.createTextNode(title));
            const messageBox = document.createElement('DIV');
            messageBox.classList.add('space--v-2', 'space--h-2');
            messageBox.style.textAlign = 'center';
            messageBox.style.lineHeight = '1.5';
            for (const messageLine of message.split('\n')) {
                const newLine = document.createElement('P');
                newLine.appendChild(document.createTextNode(messageLine));
                messageBox.appendChild(newLine);
            }
            const confirmButton = createLabeledButton({ label: 'Potwierdź', className: 'success', callback: () => {
                if (confirmCallback instanceof Function) {
                    confirmCallback();
                }
                modalSection.remove();
            }});
            confirmButton.classList.add('space--h-2');
            const cancelButton = createLabeledButton({ label: 'Anuluj', className: 'error', callback: () => {
                if (cancelCallback instanceof Function) {
                    cancelCallback();
                }
                modalSection.remove();
            }});
            cancelButton.classList.add('space--h-2');
            const buttonsBox = document.createElement('DIV');
            buttonsBox.classList.add('space--v-1');
            buttonsBox.style.display = 'flex';
            buttonsBox.style.justifyContent = 'center';
            buttonsBox.style.alignItems = 'center';
            buttonsBox.append(confirmButton, cancelButton);
            popoverContent.append(titleBox, messageBox, buttonsBox);
            modalSection.style.position = 'fixed';
            modalSection.style.top = '50%';
            modalSection.style.left = '50%';
            modalSection.style.zIndex = 2002;
            modalSection.role = 'dialog';
            popoverContent.style.transform = 'translate(-50%, -50%)';  // cannot do translate with modalSection (overlay disappears)
            const popoverCover = document.createElement('DIV');
            popoverCover.classList.add('popover-cover');
            modalSection.append(popoverContent, popoverCover);
            document.body.appendChild(modalSection);
        }

        /*** Deal Details Page ***/
        if (pepperTweakerConfig.pluginEnabled && location.pathname.match(/promocje|kupony|dyskusji|feedback/)) {

            const hideCommentMessage = 'Ten komentarz został ukryty (kliknij, aby go pokazać)';
            const showCommentMessage = 'Kliknij ponownie, aby ukryć poniższy komentarz';

            const animationDuration = 150;
            const animationEasing = 'linear';

            const showCommentOnClick = event => {
                event.stopPropagation();
                const commentRoot = event.target.parentNode;
                const commentContent = commentRoot.getElementsByClassName('comments-item-inner')[0];
                jQuery(commentContent).show(animationDuration, animationEasing);
                event.target.style.borderBottomWidth = '0';
                event.target.textContent = showCommentMessage;
                event.target.onclick = hideCommentOnClick;
            };
            const hideCommentOnClick = event => {
                event.stopPropagation();
                const commentRoot = event.target.parentNode;
                const commentContent = commentRoot.getElementsByClassName('comments-item-inner')[0];
                jQuery(commentContent).hide(animationDuration, animationEasing);
                setTimeout(function(){ event.target.style.borderBottomWidth = '1px'; }, animationDuration);
                event.target.textContent = hideCommentMessage;
                event.target.onclick = showCommentOnClick;
            };

            const createHiddenCommentBar = (textContent, callback) => {
                const hiddenCommentBar = document.createElement('DIV');
                hiddenCommentBar.textContent = textContent;
                hiddenCommentBar.style.textAlign = 'center';
                hiddenCommentBar.style.cursor = 'pointer';
                hiddenCommentBar.style.filter = 'opacity(50%)';  // change text color a little to differentiate from comments
                hiddenCommentBar.style.padding = '3px';
                hiddenCommentBar.style.height = '21px';
                hiddenCommentBar.onclick = callback;
                return hiddenCommentBar;
            };

            const comments = document.querySelectorAll('article[id^="comment-"]');
            for (const comment of comments) {
                for (const filter of pepperTweakerConfig.commentsFilters) {
                    //if (Object.keys(filter).length === 0) continue;  // if the filter is empty => continue (otherwise empty filter will remove all elements!)
                    if ((filter.active === false) || !filter.keyword && !filter.user) {
                        continue;
                    }

                    let commentAuthor = comment.querySelector('.comment-header a[href*="/profile/"');
                    commentAuthor = commentAuthor && commentAuthor.textContent;

                    if ((!filter.user || commentAuthor && commentAuthor.match(newRegExp(filter.user, 'i')))
                        && (!filter.keyword || comment.innerHTML.match(newRegExp(filter.keyword, 'i')))) {  // innerHTML here for emoticon match too (e.g. <i class="emoji emoji--type-poo" title="(poo)"></i>)

                        if (filter.style.display === 'none') {
                            comment.insertBefore(createHiddenCommentBar(hideCommentMessage, showCommentOnClick), comment.firstChild);
                        }
                        const commentContent = comment.querySelector('.comments-item-inner');
                        Object.assign(commentContent.style, filter.style);
                        break;  // comment has style applied => stop checking next filters
                    }
                }
            }

            /* Add Profile Info */
            const addProfileInfo = element => {  // this function is used in comments addition
                const profileLinks = element.querySelectorAll('.cept-thread-main a[href*="/profile/"], .comment-header a[href*="/profile/"]');
                for (const profileLink of profileLinks) {
                    if (profileLink && profileLink.href) {
                        fetch(profileLink.href)
                            .then(response => response.text())
                            .then(text => {
                                let htmlDoc = (new DOMParser()).parseFromString(text, 'text/html');
                                const profileSubHeaders = htmlDoc.documentElement.querySelectorAll('.profileHeader-bodyMaxWidth span.profileHeader-text');
                                const profileLinkParent = profileLink.parentNode;
                                const wrapper = document.createElement('DIV');
                                for (const subHeader of profileSubHeaders) {
                                    const clonedNode = subHeader.cloneNode(true);
                                    clonedNode.classList.add('space--mr-3');
                                    wrapper.appendChild(clonedNode);
                                }
                                wrapper.classList.add('space--ml-3', 'text--color-greyShade');
                                profileLink.classList.remove('space--mr-1');
                                const spaceBox = profileLinkParent.querySelector('.lbox.space--mr-2');
                                if (spaceBox) {
                                    spaceBox.remove();
                                }
                                profileLinkParent.appendChild(wrapper);
                            })
                            .catch(error => console.error(error));
                    }
                }
            };
            addProfileInfo(document);

            /* Repair Deal Details Links */  // and comment links
            if (pepperTweakerConfig.improvements.repairDealDetailsLinks) {
                const links = document.querySelectorAll('a[title^="http"]');
                for (const link of links) {
                    link.href = link.title;
                }
            }

            /* Repair Thread Image Link */  // -> to open an image in the box not a deal in new tab
            if (pepperTweakerConfig.improvements.repairDealImageLink) {
                const replaceClickoutLinkWithPopupImage = clickoutLink => {
                    if (!clickoutLink) return null;
                    const img = clickoutLink.querySelector('img.thread-image').cloneNode(true);
                    const srcFullScreen = img.src.replace('/thread_large/', '/thread_full_screen/');
                    img.setAttribute('data-handler', 'track lightbox');
                    img.setAttribute('data-track', '{"action":"show_full_image","label":"engagement"}');
                    img.setAttribute('data-lightbox', `{"images":[{"width":640,"height":474,"unattached":"","uid":"","url":"${srcFullScreen}"}]}`);
                    const popupDiv = clickoutLink.querySelector('div.threadItem-imgCell--wide').cloneNode(true);
                    popupDiv.setAttribute('data-handler', 'track lightbox');
                    popupDiv.setAttribute('data-track', '{"action":"show_full_image","label":"engagement"}');
                    popupDiv.setAttribute('data-lightbox', `{"images":[{"width":640,"height":474,"unattached":"","uid":"","url":"${srcFullScreen}"}]}`);
                    const imgFrameDiv = document.createElement('DIV');
                    imgFrameDiv.classList.add('imgFrame', 'imgFrame--noBorder', 'threadItem-imgFrame', 'box--all-b', 'clickable', 'cept-thread-img');
                    imgFrameDiv.append(img, popupDiv);
                    clickoutLink.replaceWith(imgFrameDiv);
                    return imgFrameDiv;
                };

                const dealImageLink = document.querySelector('article .cept-thread-image-clickout');
                replaceClickoutLinkWithPopupImage(dealImageLink);
            }

            /* Add Like Buttons to Best Comments */
            if (pepperTweakerConfig.improvements.addLikeButtonsToBestComments) {
                const firstLikeButtonNotBlue = document.querySelector('.cept-like-comment');
                if (firstLikeButtonNotBlue) {  // only if any like button exists
                    const bestComments = document.querySelectorAll('.comments-list--top article[id]');
                    for (const bestComment of bestComments) {
                        const newLikeButton = repairSvgWithUseChildren(firstLikeButtonNotBlue.cloneNode(true));
                        const bestCommentId = bestComment.id.replace('comment-', '');
                        const likeCountButton = bestComment.querySelector('.cept-like-comment-count');
                        let buttonAction, buttonLabel;
                        if (likeCountButton.classList.contains('text--color-blue')) {
                            newLikeButton.classList.add('linkBlue');
                            newLikeButton.classList.remove('linkMute');
                            buttonAction = 'unlike';
                            buttonLabel = 'Nie lubię';
                        } else {
                            newLikeButton.classList.add('linkMute');
                            newLikeButton.classList.remove('linkBlue');
                            buttonAction = 'like';
                            buttonLabel = 'Lubię to';
                        }
                        newLikeButton.querySelector('span span').textContent = buttonLabel;
                        newLikeButton.setAttribute('data-track', newLikeButton.getAttribute('data-track').replace(/(un)?like/, buttonAction));
                        //data-replace="{"endpoint":"https://www.pepper.pl/promocje/lenovo-ideapad-s340-15iwl-156-intel-core-i5-8265u-8gb-ram-256gb-dysk-mx250-grafika-win10-194390/comments/2997677/like","replaces":["$self",{"target":"body/.js-like-comment-2997677","key":"option","seal":null}]}"
                        let dataReplaceAttribute = newLikeButton.getAttribute('data-replace');
                        dataReplaceAttribute = dataReplaceAttribute.replace(/\/comments\/\d+\/(un)?like/, `/comments/${bestCommentId}/${buttonAction}`).replace(/like-comment-\d+/, `like-comment-${bestCommentId}`);
                        newLikeButton.setAttribute('data-replace', dataReplaceAttribute);
                        const permalinkButton = bestComment.querySelector('button[data-popover*="permalink"]');
                        permalinkButton.parentNode.insertBefore(newLikeButton, permalinkButton);
                    }
                }
            }

            /* Add Search Interface */
            if (pepperTweakerConfig.improvements.addSearchInterface && location.pathname.match(/promocje|kupony/)) {
                const voteBox = document.querySelector('.cept-vote-box');
                const dealTitleSpan = document.querySelector('article .thread-title--item');
                const dealTitleInput = createTextInput({ value: dealTitleSpan.textContent.trim() });
                dealTitleSpan.replaceWith(dealTitleInput);
                const getDealTitleInputValue = () => {
                    return dealTitleInput.querySelector('input').value.trim();
                };
                const searchButtonsWrapper = document.createElement('DIV');
                searchButtonsWrapper.append(
                    createSearchButton(searchEngine.google, getDealTitleInputValue),
                    createSearchButton(searchEngine.ceneo, getDealTitleInputValue),
                    createSearchButton(searchEngine.skapiec, getDealTitleInputValue, 0)
                );
                voteBox.parentNode.style.justifyContent = 'space-between';
                voteBox.parentNode.style.width = '100%';
                voteBox.parentNode.appendChild(searchButtonsWrapper);
            }

            /* Auto Update */
            const insertNewCommentsBarBefore = commentNode => {
                let newCommentsBar = document.getElementById('comments-new');
                if (!newCommentsBar) {
                    // <div id="comments-new" class="comments-division--landslide"><h2 class="space--v-2 hAlign--all-c aGrid zIndex--above comments-marker-up ">Nowy komentarz</h2></div>
                    newCommentsBar = document.createElement('DIV');
                    newCommentsBar.id = 'comments-new';
                    newCommentsBar.classList.add('comments-division--landslide');
                    const newCommentsHeader = document.createElement('H2');
                    newCommentsHeader.classList.add('space--v-2', 'hAlign--all-c', 'aGrid', 'zIndex--above', 'comments-marker-up');
                    newCommentsHeader.appendChild(document.createTextNode('Nowy komentarz'));
                    newCommentsBar.appendChild(newCommentsHeader);
                }
                commentNode.parentNode.insertBefore(newCommentsBar, commentNode);
            };

            const insertNewComments = observer => {
                for (const newComment of observer.newChildren) {
                    addProfileInfo(newComment);
                    observer.container.insertBefore(repairSvgWithUseChildren(newComment), observer.children[0]);
                }
                const firstCurrentComment = observer.newChildren[observer.newChildren.length - 1].nextSibling;
                const newCommentsBar = document.getElementById('comments-new');
                if (newCommentsBar) {
                    newCommentsBar.remove();
                }
                insertNewCommentsBarBefore(firstCurrentComment);

                // Update comments list pagination:
                const remoteHeaderPaginationNav = observer.remoteContainer.parentNode.querySelector('nav.comments-pagination.comments-pagination--header');
                const remoteFooterPaginationNav = observer.remoteContainer.parentNode.querySelector('nav.comments-pagination:not(.comments-pagination--header)');
                if (remoteHeaderPaginationNav && remoteFooterPaginationNav) {
                    const headerPaginationNav = observer.container.parentNode.querySelector('nav.comments-pagination.comments-pagination--header');
                    const footerPaginationNav = observer.container.parentNode.querySelector('nav.comments-pagination:not(.comments-pagination--header)');
                    if (headerPaginationNav) {
                        headerPaginationNav.remove();
                    }
                    if (footerPaginationNav) {
                        footerPaginationNav.remove();
                    }
                    observer.container.parentNode.insertBefore(repairSvgWithUseChildren(remoteHeaderPaginationNav), observer.container);
                    observer.container.parentNode.insertBefore(repairSvgWithUseChildren(remoteFooterPaginationNav), observer.container.nextSibling);
                    observer.container.classList.add('comments-list--paginated');  // don't need to check if the class exists: "If these classes already exist in the element's class attribute they are ignored."
                }

                // Update number of comments:
                const commentsCountSpan = observer.container.parentNode.querySelector('#thread-comments .icon--comment').nextSibling;
                const remoteCommentsCountSpan = observer.remoteContainer.parentNode.querySelector('#thread-comments .icon--comment').nextSibling;
                commentsCountSpan.replaceWith(remoteCommentsCountSpan);
            };

            const commentsObserver = new RemoteChildrenUpdateObserver({
                containerSelector: 'section#comments .comments-list:not(.comments-list--top)',
                childrenSelector: 'article[id]',
                remoteUrl: location.href,  // TODO: ?page=2 etc.
                tickCallback: observer => {
                    // Update current comments:
                    for (const comment of observer.children) {
                        const matchingRemoteComment = Array.from(observer.remoteChildren).find(remoteComment => remoteComment.id === comment.id);
                        if (matchingRemoteComment) {
                            // Update comment time:
                            const commentTime = comment.querySelector('time');
                            const remoteCommentTime = matchingRemoteComment.querySelector('time');
                            if (commentTime && remoteCommentTime) {
                                commentTime.textContent = remoteCommentTime.textContent;
                            }
                            // Update comment likes:
                            const commentLikes = comment.querySelector('.cept-like-comment-count');
                            let remoteCommentLikes = matchingRemoteComment.querySelector('.cept-like-comment-count');
                            if (remoteCommentLikes) {
                                remoteCommentLikes = repairSvgWithUseChildren(remoteCommentLikes);
                                if (commentLikes) {
                                    commentLikes.replaceWith(remoteCommentLikes);
                                } else {
                                    const commentHeader = comment.querySelector('.comment-header');
                                    commentHeader.appendChild(remoteCommentLikes);
                                }
                            }
                            // Update comment body in case of edit:
                            const commentBody = comment.querySelector('.comment-body');
                            const remoteCommentBody = matchingRemoteComment.querySelector('.comment-body');
                            if (commentBody && remoteCommentBody) {
                                commentBody.replaceWith(remoteCommentBody);
                            }
                            // Update comment buttons in case of liked/reported state changed:
                            const commentFooter = comment.querySelector('.comment-footer');
                            const remoteCommentFooter = matchingRemoteComment.querySelector('.comment-footer');
                            if (commentFooter && remoteCommentFooter) {
                                commentFooter.replaceWith(repairSvgWithUseChildren(remoteCommentFooter));
                            }
                        } else {  // comment not found in remoteChildren => remove it
                            comment.remove();
                        }
                    }
                },
                updateCallback: observer => blinkingTitle.run('NOWE komentarze', () => {
                    if (pepperTweakerConfig.autoUpdate.askBeforeLoad) {
                        openConfirmDialog(
                            'Nowe komentarze',
                            'Czy załadować nowe komentarze?\n(anulowanie przerwie obserwację)',
                            () => {
                                blinkingTitle.stop();
                                insertNewComments(observer);
                            },
                            () => {
                                blinkingTitle.stop();
                                observer.disconnect();
                                autoUpdateCheckbox.querySelector('input').checked = false;
                            }
                        );
                    } else {
                        insertNewComments(observer);
                    }
                }),
                errorCallback: observer => {
                    if (confirm(`Wystąpił błąd podczas pobierania strony (status: ${observer.responseStatus}).\nCzy przerwać obserwowanie?`)) {
                        observer.disconnect();
                        autoUpdateCheckbox.querySelector('input').checked = false;
                    }
                },
            });

            const autoUpdateCheckbox = createLabeledCheckbox({ label: 'Obserwuj', callback: event => {
                if (event.target.checked) {
                    commentsObserver.observe();
                } else {
                    commentsObserver.disconnect();
                }
            }});
            autoUpdateCheckbox.classList.add('space--ml-3');
            autoUpdateCheckbox.title = 'Aktualizuj komentarze';
            if (pepperTweakerConfig.autoUpdate.commentsDefaultEnabled) {
                autoUpdateCheckbox.querySelector('input').checked = true;
                commentsObserver.observe();
            }
            const threadCommentsIcon = document.querySelector('#thread-comments .icon--comment');
            if (threadCommentsIcon) {  // TODO: this check should be before the whole auto upgrade start
                threadCommentsIcon.parentNode.appendChild(autoUpdateCheckbox);
            }

            return;
        }
        /*** END: Deal Details Page ***/

        /*** Deals List ***/
        if (pepperTweakerConfig.pluginEnabled && ((location.pathname.length < 2) || location.pathname.match(/\?page=|search\?|gor%C4%85ce|nowe|grupa|om%C3%B3wione|profile/))) {

            /* Deals Filtering */
            const checkFilters = (filters, deal) => {
                let resultStyle = {};
                for (const filter of filters) {
                    //if (Object.keys(filter).length === 0) { continue; }  // if the filter is empty => continue (otherwise empty filter will remove all elements!)
                    if ((filter.active === false) || !filter.keyword && !filter.merchant && !filter.user && !filter.groups && !(filter.local === true) && !filter.priceBelow && !filter.priceAbove && !filter.discountBelow && !filter.discountAbove) {
                        continue;
                    }

                    if ((!filter.keyword || (deal.title && deal.title.search(newRegExp(filter.keyword, 'i')) >= 0) || (deal.description && deal.description.search(newRegExp(filter.keyword, 'i')) >= 0) || (deal.merchant && deal.merchant.search(newRegExp(filter.keyword, 'i')) >= 0))
                        && (!filter.merchant || (deal.merchant && deal.merchant.search(newRegExp(filter.merchant, 'i')) >= 0))
                        && (!filter.user || (deal.user && deal.user.search(newRegExp(filter.user, 'i')) >= 0))
                        && (!filter.groups || (deal.groups && (deal.groups.length > 0) && deal.groups.findIndex(group => newRegExp(filter.groups, 'i').test(group)) >= 0))
                        && (!filter.local || deal.local)
                        && (!filter.priceBelow || (deal.price && deal.price < filter.priceBelow))
                        && (!filter.priceAbove || (deal.price && deal.price > filter.priceAbove))
                        && (!filter.discountBelow || (deal.discount && deal.discount < filter.discountBelow))
                        && (!filter.discountAbove || (deal.discount && deal.discount > filter.discountAbove))) {
                        Object.assign(resultStyle, filter.style);
                    }
                }
                return resultStyle;
            };

            const checkFiltersAndApplyStyle = (element, deal) => {
                const styleToApply = checkFilters(pepperTweakerConfig.dealsFilters, deal);
                if (Object.keys(styleToApply).length > 0) {
                    if ((styleToApply.display === 'none') && element.classList.contains('thread--type-card')) {
                        element.parentNode.style.display = 'none';
                    } else {
                        Object.assign(element.style, styleToApply);
                    }
                }
            };

            const processElement = (element, deepSearch = false) => {
                if ((element.nodeName === 'DIV') && element.classList.contains('threadCardLayout--card')) {
                    element = element.querySelector('article[id^="thread"]');
                }
                if ((element.nodeName === 'ARTICLE') && (element.id.indexOf('thread') === 0)) {

                    let title = element.querySelector('.cept-tt');
                    title = title && title.textContent;

                    let description = element.querySelector('.cept-description-container');
                    description = description && description.textContent;

                    let merchant = element.querySelector('.cept-merchant-name');
                    merchant = merchant && merchant.textContent;

                    let user = element.querySelector('.thread-username');
                    user = user && user.textContent;

                    let price = element.querySelector('.cept-tp');
                    price = price && parseFloat(price.textContent.replace('.', '').replace(',', '.'));

                    let discount = element.querySelector('.threadCardLayout--row--small.overflow--fade.space--l-3 .space--ml-1.size--all-l');
                    discount = discount && parseInt(discount.textContent.replace(/[-%]/, ''));

                    const link = element.querySelector('a.cept-tt');
                    if (deepSearch && link && link.href && link.href.length > 0) {
                        fetch(link.href)
                            .then(response => {
                                if (response.ok) {
                                    return response.text();
                                }
                                throw new Error(`fetch() resulted with status ${response.status} for url: ${link.href}`);
                            })
                            .then(text => {
                                let htmlDoc = (new DOMParser()).parseFromString(text, 'text/html');
                                const groupLinks = htmlDoc.documentElement.querySelectorAll('section.card--type-horizontal a.cept-thread-groups-in-carousel');
                                const groups = [];
                                for (const groupLink of groupLinks) {
                                    groups.push(groupLink.textContent);
                                }

                                const local = htmlDoc.documentElement.querySelector('article .cept-thread-content svg.icon--location') !== null;

                                htmlDoc = null; // inform GC to clear parsed doc???

                                checkFiltersAndApplyStyle(element, { title, description, merchant, user, groups, local, price, discount });
                            })
                            .catch(error => {
                                console.error(`processElement: ${error}`);
                                checkFiltersAndApplyStyle(element, { title, description, merchant, user, price, discount });
                            });
                    } else {
                        checkFiltersAndApplyStyle(element, { title, description, merchant, user, price, discount });
                    }
                }
            }

            let dealsSectionSelector;
            const dealsSection = document.querySelector(dealsSectionSelector = 'section.gridLayout') || document.querySelector(dealsSectionSelector = 'div.gridLayout') || document.querySelector(dealsSectionSelector = 'section.listLayout .js-threadList') || document.querySelector(dealsSectionSelector = 'div.listLayout');
            // cannot combine as one selector => div.gridLayout appears before section.gridLayout on the main page
            const isGridLayout = dealsSectionSelector.indexOf('gridLayout') >= 0;

            const deepSearch = pepperTweakerConfig.dealsFilters.findIndex(filter => (filter.active !== false) && (filter.groups || (filter.local === true))) >= 0;

            if (dealsSection) {

                /* Process already visible elements */
                for (let childNode of dealsSection.childNodes) {
                    processElement(childNode, deepSearch);
                }

                /* Set the observer to process elements on addition */
                const dealsSectionObserver = new MutationObserver(function(allMutations, observer) {
                    allMutations.every(function(mutation){
                        for (const addedNode of mutation.addedNodes) {
                            processElement(addedNode, deepSearch);
                        }
                        return false;
                    });
                });
                dealsSectionObserver.observe(dealsSection, { childList: true });
                /* END: Deals Filtering */

                /* Auto Update */
                const updateGridWidgetsPosition = (isGridLayout, container, dealsSelector) => {
                    if (isGridLayout) {
                        const allCurrentDeals = container.querySelectorAll(dealsSelector);
                        if (allCurrentDeals.length < 13) {  // only 3 widgets => index: 4 + 2 * 4 => 12 (but starting from 0)
                            return false;
                        }
                        const widgets = container.querySelectorAll('.gridLayout-item.hide--toW4[data-grid-pin="n!"]');
                        for (let i = 0, widgetsLength = widgets.length; i < widgetsLength; i++) {
                            container.insertBefore(widgets[i], allCurrentDeals[4 + i * 4].parentNode);
                        }
                        return true;
                    }
                };

                const insertNewDeals = observer => {
                    for (let newDeal of observer.newChildren) {
                        // if deal is already present => remove it
                        const dealToReplace = Array.from(observer.children).find(child => child.id === newDeal.id);
                        if (dealToReplace) {
                            dealToReplace.replaceWith(newDeal);
                            continue;
                        }
                        let firstCurrentDeal = observer.container.querySelector(observer.childrenSelector);  // first deal can change in the tickCallback!
                        if (isGridLayout) {
                            newDeal = newDeal.parentNode;
                            if (firstCurrentDeal) {
                                firstCurrentDeal = firstCurrentDeal.parentNode;
                            }
                        }
                        newDeal = repairSvgWithUseChildren(newDeal);
                        observer.container.insertBefore(newDeal, firstCurrentDeal);
                        processElement(newDeal, deepSearch);
                    }
                    updateGridWidgetsPosition(isGridLayout, observer.container, observer.childrenSelector);
                    const refreshBar = document.querySelector('div[class=""][data-handler="vue"]');
                    removeAllChildren(refreshBar);
                    // observer.container.replaceWith(repairSvgWithUseChildren(observer.remoteContainer));
                };

                const replaceElementDatasetWith = (targetDataset, sourceDataset) => {
                    for (const key of Object.keys(targetDataset)) {
                        delete targetDataset[key];
                    }
                    for (const key of Object.keys(sourceDataset)) {
                        targetDataset[key] = sourceDataset[key];
                    }
                    return targetDataset;
                };

                const newDealsObserver = new RemoteChildrenUpdateObserver({
                    containerSelector: dealsSectionSelector,
                    childrenSelector: 'article[id]',
                    remoteUrl: location.href,  // TODO: ?page=2 etc.  //.replace(location.search, '')
                    tickCallback: observer => {
                        // if (observer.remoteChildren.length < 20) {  // no remote children => there will be no matching deals
                        //     return;
                        // }
                        let updateWidgets = false;
                        // updating deals details:
                        for (const deal of observer.children) {
                            const matchingRemoteDeal = Array.from(observer.remoteChildren).find(remoteDeal => remoteDeal.id === deal.id);
                            if (matchingRemoteDeal) {
                                deal.classList = matchingRemoteDeal.classList;  // update class list
                                replaceElementDatasetWith(deal.dataset, matchingRemoteDeal.dataset);  // update data attributes
                                removeAllChildren(deal);
                                Array.from(matchingRemoteDeal.children).forEach(child => deal.appendChild(repairSvgWithUseChildren(child)));
                                processElement(deal, deepSearch);
                            } else {  // deal not found in remoteChildren => remove it
                                if (isGridLayout) {
                                    deal.parentNode.remove();
                                } else {
                                    deal.remove();
                                }
                                updateWidgets = true;
                            }
                        }
                        if (updateWidgets) {
                            updateGridWidgetsPosition(isGridLayout, observer.container, observer.childrenSelector);
                        }
                    },
                    updateCallback: observer => blinkingTitle.run('NOWE oferty', () => {
                        if (pepperTweakerConfig.autoUpdate.askBeforeLoad) {
                            openConfirmDialog(
                                'Nowe oferty',
                                'Czy załadować nowe oferty?\n(anulowanie przerwie obserwację)',
                                () => {
                                    blinkingTitle.stop();
                                    insertNewDeals(observer);
                                },
                                () => {
                                    blinkingTitle.stop();
                                    observer.disconnect();
                                    autoUpdateCheckbox.querySelector('input').checked = false;
                                }
                            );
                        } else {
                            insertNewDeals(observer);
                        }
                    }),
                    errorCallback: observer => {
                        if (observer.responseStatus !== 200) {
                            if (confirm(`Wystąpił błąd podczas pobierania strony (status: ${observer.responseStatus}).\nCzy przerwać obserwowanie?`)) {
                                observer.disconnect();
                                autoUpdateCheckbox.querySelector('input').checked = false;
                            }
                        }
                    },
                });

                const autoUpdateCheckbox = createLabeledCheckbox({ label: 'Obserwuj', callback: event => {
                    if (event.target.checked) {
                        newDealsObserver.observe();
                    } else {
                        newDealsObserver.disconnect();
                    }
                }});
                autoUpdateCheckbox.classList.add('space--r-3', 'tGrid-cell', 'vAlign--all-m');
                autoUpdateCheckbox.title = 'Aktualizuj stronę z ofertami';
                if (pepperTweakerConfig.autoUpdate.dealsDefaultEnabled) {
                    autoUpdateCheckbox.querySelector('input').checked = true;
                    newDealsObserver.observe();
                }
                const subNavMenu = document.querySelector('.subNavMenu--menu');
                subNavMenu.parentNode.insertBefore(autoUpdateCheckbox, subNavMenu);
            }

        }
        /*** END: Deals List ***/
    }
    /*** END: startPepperTweaker() ***/

    document.addEventListener("DOMContentLoaded", startPepperTweaker);

    /***** END: RUN AFTER DOCUMENT HAS BEEN LOADED *****/

})();
