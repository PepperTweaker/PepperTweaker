// ==UserScript==
// @name         PepperTweaker
// @namespace    bearbyt3z
// @version      0.9
// @description  Pepper na resorach...
// @author       bearbyt3z
// @match        https://www.pepper.pl/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /*** START Default configuration ***/

    const backupConfigOnFailureLoad = true;

    /* Plugin Enabled */
    const defaultConfigPluginEnabled = true;

    /* Dark Theme Enabled */
    const defaultConfigDarkThemeEnabled = true;

    /* Repair Links Enabled */
    const defaultConfigRepairLinksEnabled = true;

    /* Deals Filters */
    const defaultConfigDealsFilters = [
        { name: 'Alkohol słowa kluczowe', keyword: /\bpiw[oa]\b|\bbeer|alkohol|whiske?y|likier|w[óo]d(ecz)?k[aąieę]|\bwark[aąieę]|\bbols|\bsoplica\b|johnni?(e|y) walker|jim ?beam|gentleman ?jack|beefeater|tequilla|\bmacallan|hennessy|armagnac ducastaing|\bbaczewski|\baperol|\bvodka|carlsberg|kasztelan|okocim|smuggler|martini|\blager[ay]?\b|żywiec|pilsner|\brum[uy]?\b|książęce|\btrunek|amundsen|\bbrandy\b|żubrówk[aąięe]|\bradler\b|\btyskie\b|bourbon|glen moray|\bbrowar|\bgran[td]'?s\b|jagermeister|jack daniel'?s|\blech\b|heineken|\bcalsberg|\bbacardi\b|\bbushmills|\bballantine'?s/i, style: { opacity: '0.3' } },  // don't use: \bwin(a|o)\b <-- to many false positive e.g. Wiedźmin 3 Krew i Wino
        { name: 'Disco Polo', keyword: /disco polo/i, style: { display: 'none' } },
        { name: 'Niezdrowe jedzenie', merchant: /mcdonalds|kfc|burger king/i, style: { opacity: '0.3' } },
        { name: 'Aliexpress/Banggood', merchant: /aliexpress|banggood/i, style: { border: '4px dashed #e00034' } },
        { name: 'Nieuczciwi sprzedawcy', merchant: /empik|komputronik|super-pharm/i, style: { border: '4px dashed #1f7ecb' } },
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

    /*** END Deafult Configuration ***/

    const messageWrongJSONStyle = 'Niewłaściwa składnia w polu stylu. Należy użyć składni JSON.';

    //RegExp.prototype.toJSON = RegExp.prototype.toString;  // to stringify & parse RegExp
    //const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    const newRegExp = (pattern, flags = 'i') => (pattern instanceof RegExp || pattern.constructor.name === 'RegExp') ? pattern : pattern && new RegExp(pattern, flags) || null;
    //const isEmptyObject = obj => Object.entries(obj).length === 0 && obj.constructor === Object;
    const isBoolean = value => value === true || value === false;  // faster than typeof

    const JSONRegExpReplacer = (key, value) => (value instanceof RegExp) ? { __type__: 'RegExp', source: value.source, flags: value.flags } : value;
    const JSONRegExpReviver = (key, value) => (value && value.__type__ === 'RegExp') ? new RegExp(value.source, value.flags) : value;

    const getCSSBorderColor = borderStyle => borderStyle && borderStyle.match(/#[a-fA-F0-9]+/) || null;

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

    /*** START Load Configuration from Local Storage ***/
    const pepperTweakerConfig = {};

    try {
        pepperTweakerConfig.pluginEnabled = JSON.parse(localStorage.getItem('PepperTweaker.config.pluginEnabled'));
        pepperTweakerConfig.darkThemeEnabled = JSON.parse(localStorage.getItem('PepperTweaker.config.darkThemeEnabled'));
        pepperTweakerConfig.repairLinksEnabled = JSON.parse(localStorage.getItem('PepperTweaker.config.repairLinksEnabled'));
        pepperTweakerConfig.dealsFilters = JSON.parse(localStorage.getItem('PepperTweaker.config.dealsFilters'), JSONRegExpReviver);
        pepperTweakerConfig.commentsFilters = JSON.parse(localStorage.getItem('PepperTweaker.config.commentsFilters'), JSONRegExpReviver);
    } catch (error) {
        console.error(`${error.message}: Cannot parse some configuration variables (wrong JSON). Using defaults instead...`);
        console.error(`pluginEnabled: ${localStorage.getItem('PepperTweaker.config.pluginEnabled')}`);
        console.error(`darkThemeEnabled: ${localStorage.getItem('PepperTweaker.config.darkThemeEnabled')}`);
        console.error(`repairLinksEnabled: ${localStorage.getItem('PepperTweaker.config.repairLinksEnabled')}`);
        console.error(`dealsFilters: ${localStorage.getItem('PepperTweaker.config.dealsFilters')}`);
        console.error(`commentsFilters: ${localStorage.getItem('PepperTweaker.config.commentsFilters')}`);
        /* Backup Current Values */
        if (backupConfigOnFailureLoad) {
            console.error('Saving old configuration variables to local storage...');
            localStorage.setItem('PepperTweaker.config.dealsFilters-backup', localStorage.getItem('PepperTweaker.config.dealsFilters'));
            localStorage.setItem('PepperTweaker.config.commentsFilters-backup', localStorage.getItem('PepperTweaker.config.commentsFilters'));
            console.error('Varaibles saved, loading defaults...');
        }
        resetConfig();
    }
    /*** END Load configuration ***/

    /*** START Configuration Functions ***/
    const setConfig = (configuration = { pluginEnabled, darkThemeEnabled, repairLinksEnabled, dealsFilters, commentsFilters }, reload = false) => {
        if ((configuration.pluginEnabled !== undefined) && isBoolean(configuration.pluginEnabled)) {
            localStorage.setItem('PepperTweaker.config.pluginEnabled', JSON.stringify(configuration.pluginEnabled));
            pepperTweakerConfig.pluginEnabled = configuration.pluginEnabled;
        }
        if ((configuration.darkThemeEnabled !== undefined) && isBoolean(configuration.darkThemeEnabled)) {
            localStorage.setItem('PepperTweaker.config.darkThemeEnabled', JSON.stringify(configuration.darkThemeEnabled));
            pepperTweakerConfig.darkThemeEnabled = configuration.darkThemeEnabled;
        }
        if ((configuration.repairLinksEnabled !== undefined) && isBoolean(configuration.repairLinksEnabled)) {
            localStorage.setItem('PepperTweaker.config.repairLinksEnabled', JSON.stringify(configuration.repairLinksEnabled));
            pepperTweakerConfig.repairLinksEnabled = configuration.repairLinksEnabled;
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

    const resetConfig = (resetConfiguration = { resetPluginEnabled : true, resetDarkThemeEnabled : true, resetRepairLinksEnabled: true, resetDealsFilters : true, resetCommentsFilters : true }) => {
        const setConfigObject = {};
        if (resetConfiguration.resetPluginEnabled === true) {
            setConfigObject.pluginEnabled = defaultConfigPluginEnabled;
        }
        if (resetConfiguration.resetDarkThemeEnabled === true) {
            setConfigObject.darkThemeEnabled = defaultConfigDarkThemeEnabled;
        }
        if (resetConfiguration.resetRepairLinksEnabled === true) {
            setConfigObject.repairLinksEnabled = defaultConfigRepairLinksEnabled;
        }
        if (resetConfiguration.resetDealsFilters === true) {
            setConfigObject.dealsFilters = defaultConfigDealsFilters;
        }
        if (resetConfiguration.resetCommentsFilters === true) {
            setConfigObject.commentsFilters = defaultConfigCommentsFilters;
        }
        setConfig(setConfigObject, true);
    };
    // resetConfig();

    const saveConfigFile = () => {
        const link = document.createElement('A');
        const file = new Blob([JSON.stringify(pepperTweakerConfig, JSONRegExpReplacer)], {type: 'text/plain'});
        link.href = URL.createObjectURL(file);
        link.download = `PepperTweaker-config-[${getCurrentDateTimeString()}].json`;
        link.click();
    };

    const importConfigFromFile = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'application/json';
        fileInput.onchange = event => {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                let inputFileConfig;
                try {
                    inputFileConfig = JSON.parse(reader.result, JSONRegExpReviver);
                    if (inputFileConfig.pluginEnabled === undefined
                        || inputFileConfig.darkThemeEnabled === undefined
                        || inputFileConfig.repairLinksEnabled === undefined
                        || inputFileConfig.dealsFilters === undefined
                        || inputFileConfig.commentsFilters === undefined) {
                        throw new TypeError('Wrong input file parameter');
                    }
                    setConfig({
                        pluginEnabled : inputFileConfig.pluginEnabled,
                        darkThemeEnabled : inputFileConfig.darkThemeEnabled,
                        repairLinksEnabled : inputFileConfig.repairLinksEnabled,
                        dealsFilters : inputFileConfig.dealsFilters,
                        commentsFilters : inputFileConfig.commentsFilters
                    }, true);
                } catch (err) {
                    alert('Ten plik nie wygląda jak konfiguracja PepperTweakera :/');
                }
            };
            reader.readAsText(file);
        };
        fileInput.click();
    };
    /*** END Configuration Functions ***/

    if (pepperTweakerConfig.pluginEnabled) {

        /*** START Dark Theme Style ***/
        if (pepperTweakerConfig.darkThemeEnabled) {

            // const invertColor = color => '#' + (Number(`0x1${ color.replace('#', '') }`) ^ 0xFFFFFF).toString(16).substr(1);
            const darkBorderColor = '#121212';
            const lightBorderColor = '#5c5c5c';
            const darkBackgroundColor = '#242424';
            const veryDarkBackgroundColor = '#1d1f20';
            const lightBackgroundColor = '#35373b';
            const textColor = '#bfbfbf';
            // const greyButtonColor = '#8f949b';
            // const orangeColor = '#d1d5db';

            const style = document.createElement('STYLE');
            const css = `
                .linkGrey, .thread-userOptionLink, /*dotad nowe! sprawdzic! - szare napisy pod okazją */ .cept-nav-subheadline, .user:not(.thread-user), .tabbedInterface-tab, .subNavMenu, .subNavMenu-btn, .tag, .page-label, .page-subTitle, .userProfile-title--sub, .bg--color-inverted .text--color-white, .comments-pagination--header .pagination-next, .comments-pagination--header .pagination-page, .comments-pagination--header .pagination-previous, .conversationList-msgPreview, .thread-title, .mute--text, .text--color-charcoal, .text--color-charcoalTint, .cept-tt, .cept-description-container, /*.cept-tp,*/ .thread-username, .voucher input, .hide--bigCards1, .hide--toBigCards1 {
                    /* filter: invert(100%); */
                    color: ${textColor};
                }
                .speechBubble {
                    background-color: ${darkBackgroundColor};
                    color: ${textColor};
                }
                /*.overflow--fade {
                    display: none;
                }*/
                .thread--type-card, .thread--type-list, /*.comments-list,*/ .conversationList-msg--read:not(.conversationList-msg--active), .card, .threadCardLayout--card article, .threadCardLayout--card article span .threadCardLayout--card article span, .vote-box, .cept-comments-link, .subNavMenu-btn {
                    background-color: ${darkBackgroundColor} !important;
                    border-color: ${darkBorderColor};
                    /* border: 1px solid ${darkBorderColor}; */
                    /* color: inherit; */
                }
                /*.comments--top-header {
                    background-color: #ff7900 !important;
                    z-index: 1000 !important;
                }*/
                .thread--deal, .thread--discussion {
                    background-color: ${darkBackgroundColor};
                    border-color: ${darkBorderColor};
                    /* border: 1px solid ${darkBorderColor}; */
                    border-top: none; /* jest jakis problem z border topem - caly article przesuwa sie do gory... */
                    border-radius: 5px;
                }
                .input, .inputBox, .secretCode-codeBox, .toolbar, .voucher-code {
                    background-color: ${darkBackgroundColor};
                    border-color: ${lightBorderColor};
                }
                /*** START Arrows ***/
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
                /*** END Arrows ***/
                .btn--border, .bg--off, .boxSec--fromW3:not(.thread-infos), .boxSec, .voucher-codeCopyButton, .search input, .img, .userHtml-placeholder, .userHtml img, .popover--subNavMenu .popover-content {
                    /* border-color: ${darkBorderColor} !important; */
                    border: 1px solid ${darkBorderColor} !important;  /* Need full border definition for .bg--off */
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
                .bg--off, .js-pagi-bottom, .js-sticky-pagi--on, .bg--color-grey, .notification-item--read, #main /*, .bg--main */ /*boxSec-div js-pagi-bottom*/, .subNavMenu--menu .subNavMenu-list {
                    background-color: ${lightBackgroundColor} !important;
                    color: ${textColor};
                }
                .tabbedInterface-tab--transparent {
                    background-color: ${lightBackgroundColor};
                    /*border: 1px solid ${darkBorderColor} !important;*/
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
                    /* border-top: 1px solid ${darkBorderColor}; */
                    /* border-bottom-left-radius: 5px; */
                }
                .bg--color-greyTint, .thread-divider, .btn--mode-filter {
                    background-color: ${textColor};
                }
                img.avatar[src*="placeholder"] {
                    filter: brightness(75%);
                }
                /*.navDropDown-link:focus, .navDropDown-link:hover {
                    background-color: ${darkBorderColor};
                }*/
                .btn--mode-dark-transparent, .btn--mode-dark-transparent:active, .btn--mode-dark-transparent:focus, button:active .btn--mode-dark-transparent, button:focus .btn--mode-dark-transparent {
                    background-color: inherit;
                }
                .boxSec-div, .boxSec-div--toW2 {
                    border-top: 1px solid ${darkBorderColor};
                }
                .profileHeader, .nav /*, .bg--main */, .navDropDown-item, .navDropDown-link, .navDropDown-pItem, .subNavMenu--menu .subNavMenu-item--separator {
                    border-bottom: 1px solid ${darkBorderColor};
                }
                .footer, .subNav, .voteBar, .comment-item /*.comments-list--top .comments-item:target .comments-item-inner, .comments-list .comments-item, .comments-list .comments-list-item:target .comments-item-inner */ {
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
                /*.thread-image,*/ img, .badge {
                    filter: invert(5%) brightness(90%);
                }
                .thread--expired > * {
                    filter: opacity(40%) brightness(90%);
                    /* filter: brightness(45%); */
                }
                /* .thread--expired *:after, .thread--expired *:before {
                    display: none;
                } */
                .icon--overflow {
                    color: ${textColor};
                }
                /* faders */
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
            `;
            style.appendChild(document.createTextNode(css));
            document.head.appendChild(style);
        }

        /* Theme Change Button */
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
        /*** END Dark Theme Style ***/

        /*** START Menu Links Addition ***/
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
        /*** END Menu Links Addition ***/
    }

    /*** START Settings Page ***/
    if (location.pathname.indexOf('/settings') >= 0) {

        let settingsPageConfig = {};  // will be set after function definitions (we need create-function names)

        const filterType = Object.freeze({
            deals: 'deals',
            comments: 'comments',
        });

        const removeAllChildren = node => {
            while (node.hasChildNodes()) {
                node.removeChild(node.lastChild);
            }
        };

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

        const createSelectInput = (params = { options: [ createNewFilterName ], id, callback }) => {
            const filterSelect = document.querySelector('#defaultLandingPage .select').cloneNode(true);
            const selectCtrl = filterSelect.querySelector('.select-ctrl');
            selectCtrl.name = 'filter_selection';
            if (params.id) {
                selectCtrl.id = params.id;
            }
            if (params.callback) {
                filterSelect.querySelector('select').onchange = params.callback;
            }
            removeAllChildren(selectCtrl);
            for (const optionValue of params.options) {
                addSelectOptionElement(selectCtrl, optionValue);
            }
            filterSelect.querySelector('.js-select-val').textContent = params.options[0];
            return filterSelect;
        };

        const createTextInput = (params = { id, placeholder, required }) => {
            const wrapperDiv = document.createElement('DIV');
            wrapperDiv.classList.add('space--v-2');
            const textInput = document.createElement('INPUT');
            textInput.classList.add('input', 'width--all-12', 'size--all-l');
            if (params.id) {
                textInput.id = params.id;
            }
            if (params.placeholder) {
                textInput.placeholder = params.placeholder;
            }
            if (params.required) {
                textInput.required = true;
            }
            wrapperDiv.appendChild(textInput);
            return wrapperDiv;
        };

        const createLabeledInput = (params = { id, beforeLabel: '', afterLabel: '', min, max, step }) => {
            const wrapperDiv = document.createElement('DIV');
            wrapperDiv.classList.add('space--v-2');

            const spanElement = document.createElement('SPAN');
            spanElement.classList.add('formList-label-content', 'lbox--v-1');
            const spanText = document.createTextNode(params.beforeLabel);
            spanElement.appendChild(spanText);

            const divElement = document.createElement('DIV');
            divElement.classList.add('tGrid', 'tGrid--auto', 'width--all-12');
            const inputElement = document.createElement('INPUT');
            inputElement.classList.add('input', 'width--all-12', 'bRad--r-r');
            inputElement.type = 'number';
            if (params.id) {
                inputElement.id = params.id;
            }
            if ((params.min !== undefined) && (params.min !== null)) {
                inputElement.min = params.min;
            }
            if ((params.max !== undefined) && (params.max !== null)) {
                inputElement.max = params.max;
            }
            if ((params.step != undefined) && (params.step !== null)) {
                inputElement.step = params.step;
            }
            const labelElement = document.createElement('LABEL');
            labelElement.classList.add('tGrid-cell', 'tGrid-cell--shrink', 'btn', 'bRad--l-r', 'vAlign--all-m');
            const labelText = document.createTextNode(params.afterLabel);
            labelElement.appendChild(labelText);
            divElement.appendChild(inputElement);
            divElement.appendChild(labelElement);

            wrapperDiv.appendChild(spanElement);
            wrapperDiv.appendChild(divElement);
            return wrapperDiv;
        };

        const createLabeledButton = (params = { label: '', id, class: 'default', callback}) => {
            const wrapperDiv = document.createElement('DIV');
            wrapperDiv.classList.add('space--v-2');

            const buttonElement = document.createElement('BUTTON');
            buttonElement.classList.add('btn', 'width--all-12', 'hAlign--all-c', `btn--mode-${params.class}`);
            if (params.id) {
                buttonElement.id = params.id;
            }
            if (params.callback) {
                buttonElement.onclick = params.callback;
            }
            const buttonText = document.createTextNode(params.label);
            buttonElement.appendChild(buttonText);

            wrapperDiv.appendChild(buttonElement);
            return wrapperDiv;
        };

        const createLabeledCheckbox = (params = { label: '', id, checked, callback }) => {
            const wrapperDiv = document.createElement('DIV');
            wrapperDiv.classList.add('space--v-1');

            const labelElement = document.createElement('LABEL');
            labelElement.classList.add('checkbox', 'size--all-m');

            const inputElement = document.createElement('INPUT');
            inputElement.classList.add('input', 'checkbox-input');
            inputElement.type = 'checkbox';
            if (params.id) {
                inputElement.id = params.id;
            }
            if (params.checked === true) {
                inputElement.checked = true;
            }
            if (params.callback) {
                inputElement.onchange = params.callback;
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
            spanCheckboxText.textContent = params.label;

            labelElement.appendChild(inputElement);
            labelElement.appendChild(spanGridCell);
            labelElement.appendChild(spanCheckboxText);

            wrapperDiv.appendChild(labelElement);
            return wrapperDiv;
        };

        const createColorInput = (params = { color: '#000000', id, callback, wrapper: false }) => {
            const colorInput = document.createElement('INPUT');
            colorInput.classList.add('space--l-2');
            colorInput.type = 'color';
            colorInput.value = params.color;
            colorInput.style.width = '42px';
            colorInput.style.height = '30px';
            if (params.id) {
                colorInput.id = params.id;
            }
            if (params.callback) {
                colorInput.onchange = params.callback;
            }
            if (params.wrapper) {
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

        const createStylingBlock = (params = { display, opacity, border, borderColor, styleText, callback }) => {
            const wrapperDiv = document.createElement('DIV');
            if (params.display) {
                wrapperDiv.appendChild(createLabeledCheckbox({ label: params.display.label, id: params.display.id, checked: params.display.checked, callback: params.callback }));
            }
            if (params.opacity) {
                wrapperDiv.appendChild(createLabeledCheckbox({ label: params.opacity.label, id: params.opacity.id, checked: params.opacity.checked, callback: params.callback }));
            }
            if (params.border) {
                const borderBlock = createLabeledCheckbox({ label: params.border.label, id: params.border.id, checked: params.border.checked, callback: params.callback });
                if (params.borderColor) {
                    borderBlock.appendChild(createColorInput({ color: params.borderColor.color, id: params.borderColor.id, callback: params.callback }));
                }
                wrapperDiv.appendChild(borderBlock);
            }
            if (params.styleText) {
                wrapperDiv.appendChild(createTextInput({ id: params.styleText.id }));
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
                if (styleBlock.params.borderColor) {
                    borderColor = document.getElementById(styleBlock.params.borderColor.id).value;
                    if (event.target.id === styleBlock.params.borderColor.id) {
                        document.getElementById(styleBlock.params.border.id).checked = true;
                    }
                }
                styleValue.border = document.getElementById(styleBlock.params.border.id).checked ? `${defaultFilterStyleValues[filterType].borderWidth} ${defaultFilterStyleValues[filterType].borderStyle} ${borderColor}` : undefined;
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
                    repairLinksEnabled: {
                        label: 'Popraw linki',
                        entries: {
                            darkThemeCheckbox: {
                                create: createLabeledCheckbox,
                                params: {
                                    label: 'Poprawianie linków włączone',
                                    id: 'repair-links-enabled',
                                    checked: pepperTweakerConfig.repairLinksEnabled,
                                    callback: event => setConfig({ repairLinksEnabled: event.target.checked }, false),
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
                                    class: 'default',
                                    callback: importConfigFromFile
                                },
                            },
                            exportButton: {
                                create: createLabeledButton,
                                params: {
                                    label: 'Export do pliku',
                                    class: 'default',
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
                                    class: 'error',
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
                                    class: 'success',
                                    callback: applyFilterChanges
                                },
                            },
                            removeButton: {
                                create: createLabeledButton,
                                params: {
                                    label: 'Usuń filtr',
                                    id: 'deals-filter-remove',
                                    class: 'error',
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
                                    class: 'success',
                                    callback: applyFilterChanges
                                },
                            },
                            removeButton: {
                                create: createLabeledButton,
                                params: {
                                    label: 'Usuń filtr',
                                    id: 'comments-filter-remove',
                                    class: 'error',
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
    }
    /*** END Settings Page ***/

    /*** START Deal Details Page ***/
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
        const profileLinks = document.querySelectorAll('article a[href*="/profile/"]');
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
                            wrapper.append(clonedNode);
                        }
                        wrapper.classList.add('space--ml-3', 'text--color-greyShade');
                        profileLink.classList.remove('space--mr-1');
                        const spaceBox = profileLinkParent.querySelector('.lbox.space--mr-2');
                        if (spaceBox) {
                            spaceBox.remove();
                        }
                        profileLinkParent.append(wrapper);
                    })
                    .catch(error => console.error(error));
            }
        }

        /* Repair Links */
        if (pepperTweakerConfig.repairLinksEnabled) {
            const links = document.querySelectorAll('a[title^="http"]');
            for (const link of links) {
                link.href = link.title;
            }
        }
    }
    /*** END Deal Details Page ***/

    /*** START Deals Filtering ***/
    if (pepperTweakerConfig.pluginEnabled && ((location.pathname.length < 2) || location.pathname.match(/\?page=|search\?|gor%C4%85ce|nowe|grupa|om%C3%B3wione|profile/))) {

        const checkFilters = (filters, deal) => {
            for (const filter of filters) {
                //if (Object.keys(filter).length === 0) { continue; }  // if the filter is empty => continue (otherwise empty filter will remove all elements!)
                if ((filter.active === false) || !filter.keyword && !filter.merchant && !filter.user && !filter.groups && !(filter.local === true) && !filter.priceBelow && !filter.priceAbove && !filter.discountBelow && !filter.discountAbove) {
                    continue;
                }

                if ((!filter.keyword || (deal.title && deal.title.search(newRegExp(filter.keyword, 'i')) >= 0) || (deal.description && deal.description.search(newRegExp(filter.keyword, 'i')) >= 0) || (deal.merchant && deal.merchant.search(newRegExp(filter.keyword, 'i')) >= 0))
                    && (!filter.merchant || (deal.merchant && deal.merchant.search(newRegExp(filter.merchant, 'i')) >= 0))
                    && (!filter.user || (deal.user && deal.user.search(newRegExp(filter.user, 'i')) >= 0))
                    && (!filter.groups || (deal.groups && deal.groups.findIndex(group => newRegExp(filter.groups, 'i').test(group)) >= 0))
                    && (!filter.local || deal.local)
                    && (!filter.priceBelow || (deal.price && deal.price < filter.priceBelow))
                    && (!filter.priceAbove || (deal.price && deal.price > filter.priceAbove))
                    && (!filter.discountBelow || (deal.discount && deal.discount < filter.discountBelow))
                    && (!filter.discountAbove || (deal.discount && deal.discount > filter.discountAbove))) {
                    return (filter.style ? filter.style : true);  // matching filter was found => stop checking next filters
                }
            }
            return false;  // no matching filters
        };

        const checkFiltersAndApplyStyle = (element, deal) => {
            let styleToApply;
            if (styleToApply = checkFilters(pepperTweakerConfig.dealsFilters, deal)) {
                if (styleToApply.display === 'none') {
                    element.style.display = 'none';
                } else {
                    Object.assign(element.querySelector('article').style, styleToApply);
                }
            }
        };

        const processElement = (element, deepSearch = false) => {
            if ((element.nodeName == 'DIV') && (element.classList.contains('threadCardLayout--card'))) {

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

                if (deepSearch) {
                    const link = element.querySelector('a.cept-tt');
                    if (link && link.href && link.href.length > 0) {
                        fetch(link.href)
                            .then(response => response.text())
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
                            .catch(error => console.error(error));
                    } else {
                        console.error('W ofercie brakuje linku!');
                    }
                } else {
                    checkFiltersAndApplyStyle(element, { title, description, merchant, user, price, discount });
                }
            }
        }

        const gridLayoutSection = document.querySelector('section.gridLayout') || document.querySelector('div.gridLayout');  // cannot combine as one selector => div.gridLayout appears before section.gridLayout on the main page

        if (gridLayoutSection) {

            const deepSearch = pepperTweakerConfig.dealsFilters.findIndex(filter => filter.groups || filter.local) >= 0;

            /* Process already visible elements */
            for (let childNode of gridLayoutSection.childNodes) {
                processElement(childNode, deepSearch);
            }

            /* Set the observer to process elements on addition */
            const gridLayoutObserver = new MutationObserver(function(allMutations, observer){
                allMutations.every(function(mutation){
                    for (const addedNode of mutation.addedNodes) {
                        processElement(addedNode, deepSearch);
                    }
                    return false;
                });
            });
            gridLayoutObserver.observe(gridLayoutSection, { childList: true });
        }
    }
    /*** END Deals Filtering ***/

})();
