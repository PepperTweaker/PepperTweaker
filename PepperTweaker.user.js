// ==UserScript==
// @name         PepperTweaker
// @namespace    bearbyt3z
// @version      0.9.42
// @description  Pepper na resorach...
// @author       bearbyt3z
// @match        https://www.pepper.pl/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  /***********************************************/
  /***** RUN AT DOCUMENT START (BEFORE LOAD) *****/
  /***********************************************/

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
    listToGrid: true,
    gridColumnCount: 0,
    transparentPaginationFooter: true,
    hideTopDealsWidget: false,
    hideGroupsBar: false,
    repairDealDetailsLinks: true,
    repairDealImageLink: true,
    addLikeButtonsToBestComments: true,
    addSearchInterface: true,
    addCommentPreviewOnProfilePage: true,
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
    { name: 'Alkohol słowa kluczowe', active: false, keyword: /\bpiw[oa]\b|\bbeer|alkohol|whiske?y|likier|w[óo]d(ecz)?k[aąieę]|\bwark[aąieę]|\bbols|\bsoplica\b|johnni?(e|y) walker|jim ?beam|gentleman ?jack|beefeater|tequilla|\bmacallan|hennessy|armagnac ducastaing|\bbaczewski|\baperol|\bvodka|carlsberg|kasztelan|okocim|smuggler|martini|\blager[ay]?\b|żywiec|pilsner|\brum[uy]?\b|książęce|\btrunek|amundsen|\bbrandy\b|żubrówk[aąięe]|\bradler\b|\btyskie\b|bourbon|glen moray|\bbrowar|\bgran[td]'?s\b|jagermeister|jack daniel'?s|\blech\b|heineken|\bcalsberg|\bbacardi\b|\bbushmills|\bballantine'?s|somersby|gentelman jack/i, style: { opacity: '0.3' } },  // don't use: \bwin(a|o)\b <-- to many false positive e.g. Wiedźmin 3 Krew i Wino
    { name: 'Disco Polo', active: false, keyword: /disco polo/i, style: { display: 'none' } },
    { name: 'Niezdrowe jedzenie', active: false, merchant: /mcdonalds|kfc|burger king/i, style: { opacity: '0.3' } },
    { name: 'Aliexpress/Banggood', active: false, merchant: /aliexpress|banggood/i, style: { border: '4px dashed #e00034' } },
    { name: 'Nieuczciwi sprzedawcy', active: false, merchant: /empik|komputronik|proline|super-pharm/i, style: { border: '4px dashed #1f7ecb' } },
    { name: 'Największe przeceny', active: false, discountAbove: 80, style: { border: '4px dashed #51a704' } },
    { name: 'Spożywcze', active: false, groups: /spożywcze/i, style: { opacity: '0.3' } },
    { name: 'Lokalne', active: false, local: true, style: { border: '4px dashed #880088' } },
  ];

  /* Comments filters */
  const defaultConfigCommentsFilters = [
    { name: 'SirNiedźwiedź', active: true, user: /SirNiedźwiedź/i, style: { border: '2px dotted #51a704' } },
    { name: 'G... burze by urtedbo', user: /urtedbo/i, keyword: /poo.*burz[eęaą]/i, style: { display: 'none' } },  // can match emoticons (also in brackets) => <i class="emoji emoji--type-poo" title="(poo)"></i>
    { name: 'Brzydkie słowa', keyword: /gówno|gowno|dópa|dupa/i, style: { opacity: '0.3' } },
  ];

  const createNewFilterName = 'Utwórz nowy...';

  const defaultFilterStyleValues = {
    deals: {
      display: 'none',
      opacity: '0.3',
      borderWidth: '4px',
      borderStyle: 'dashed',
      borderColor: '#880088',  // '#ff7900'
    },
    comments: {
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

  const removeAllChildren = parent => { while (parent.hasChildNodes()) parent.removeChild(parent.lastChild); };
  const moveAllChildren = (oldParent, newParent) => { while (oldParent.hasChildNodes()) newParent.appendChild(oldParent.firstChild); };
  const cloneAttributes = (source, target) => [...source.attributes].forEach(attr => target.setAttribute(attr.nodeName, attr.nodeValue));

  const getWindowSize = () => ({
    width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
  });

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
        listToGrid: isBoolean(configuration.improvements.listToGrid) ? configuration.improvements.listToGrid : pepperTweakerConfig.improvements.listToGrid,
        gridColumnCount: isInteger(configuration.improvements.gridColumnCount) ? parseInt(configuration.improvements.gridColumnCount) : parseInt(pepperTweakerConfig.improvements.gridColumnCount),
        transparentPaginationFooter: isBoolean(configuration.improvements.transparentPaginationFooter) ? configuration.improvements.transparentPaginationFooter : pepperTweakerConfig.improvements.transparentPaginationFooter,
        hideTopDealsWidget: isBoolean(configuration.improvements.hideTopDealsWidget) ? configuration.improvements.hideTopDealsWidget : pepperTweakerConfig.improvements.hideTopDealsWidget,
        hideGroupsBar: isBoolean(configuration.improvements.hideGroupsBar) ? configuration.improvements.hideGroupsBar : pepperTweakerConfig.improvements.hideGroupsBar,
        repairDealDetailsLinks: isBoolean(configuration.improvements.repairDealDetailsLinks) ? configuration.improvements.repairDealDetailsLinks : pepperTweakerConfig.improvements.repairDealDetailsLinks,
        repairDealImageLink: isBoolean(configuration.improvements.repairDealImageLink) ? configuration.improvements.repairDealImageLink : pepperTweakerConfig.improvements.repairDealImageLink,
        addLikeButtonsToBestComments: isBoolean(configuration.improvements.addLikeButtonsToBestComments) ? configuration.improvements.addLikeButtonsToBestComments : pepperTweakerConfig.improvements.addLikeButtonsToBestComments,
        addSearchInterface: isBoolean(configuration.improvements.addSearchInterface) ? configuration.improvements.addSearchInterface : pepperTweakerConfig.improvements.addSearchInterface,
        addCommentPreviewOnProfilePage: isBoolean(configuration.improvements.addCommentPreviewOnProfilePage) ? configuration.improvements.addCommentPreviewOnProfilePage : pepperTweakerConfig.improvements.addCommentPreviewOnProfilePage,
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
        setConfig(outputConfig, false);  // reload == false --> missing config entries have to be reset first (below)
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
      || !isBoolean(outputConfig.improvements.listToGrid)
      || !isInteger(outputConfig.improvements.gridColumnCount)
      || !isBoolean(outputConfig.improvements.transparentPaginationFooter)
      || !isBoolean(outputConfig.improvements.hideTopDealsWidget)
      || !isBoolean(outputConfig.improvements.hideGroupsBar)
      || !isBoolean(outputConfig.improvements.repairDealDetailsLinks)
      || !isBoolean(outputConfig.improvements.repairDealImageLink)
      || !isBoolean(outputConfig.improvements.addLikeButtonsToBestComments)
      || !isBoolean(outputConfig.improvements.addSearchInterface)
      || !isBoolean(outputConfig.improvements.addCommentPreviewOnProfilePage)) {
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
        if (!loadConfig({}, reader.result, true)) {
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

  /*** Setting CSS ***/
  let css = '';

  if (pepperTweakerConfig.pluginEnabled) {

    /* Hide Groups Bar */
    if (pepperTweakerConfig.improvements.hideTopDealsWidget) {
      css += `
        .listLayout .vue-portal-target, .listLayout-side .vue-portal-target,
        .js-vue2[data-vue2*="HottestWidget"] {
          display: none !important;
        }
      `;
    }

    /* Hide Top Deals Widget */
    if (pepperTweakerConfig.improvements.hideGroupsBar) {
      css += `
        .subNav .groupPromo--bg {
          display: none !important;
        }
      `;
    }

    /* Dark Theme Style */
    if (pepperTweakerConfig.darkThemeEnabled) {
    
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

      css += `
        .comments-pagi--header .comments-pagi-pages:not(:disabled),
        .page2-center .mute--text2, .page2-subTitle2.mute--text2, .conversation-content.mute--text2, .linkGrey, .thread-userOptionLink, .cept-nav-subheadline, .user:not(.thread-user), .tabbedInterface-tab, .subNavMenu, .subNavMenu-btn, .tag, .page-label, .page-subTitle, .page2-secTitle, .userProfile-title--sub, .bg--color-inverted .text--color-white, .comments-pagination--header .pagination-next, .comments-pagination--header .pagination-page, .comments-pagination--header .pagination-previous, .conversationList-msgPreview, .thread-title, .mute--text, .text--color-charcoal, .text--color-charcoalTint, .cept-tt, .cept-description-container, /*.cept-tp,*/ .thread-username, .voucher input, .hide--bigCards1, .hide--toBigCards1 {
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
        .tabbedInterface-tab--selected, .bg--main, .tabbedInterface-tab--horizontal, .tabbedInterface-tab--selected, .comment--selected, .comments-item--in-moderation, .comments-item-inner--active, .comments-item-inner--edit, /*.thread.cept-sale-event-thread.thread--deal,*/ .vote-btn, .notification-item:not(.notification-item--read), .search div, .search input, .text--overlay, .popover--brandAccent .popover-content, .popover--brandPrimary .popover-content, .popover--default .popover-content, .popover--menu .popover-content, .popover--red .popover-content {
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
        .softMessages-item, .popover--modal .popover-content, .bg--color-white, .bg--fromW3-color-white, .listingProfile-header, .profileHeader, .bg--em, nav.comments-pagination {
          background-color: ${veryDarkBackgroundColor};
          color: ${textColor} !important;
        }
        .bg--color-greyPanel {
          background-color: ${veryDarkBackgroundColor};
        }
        .bg--color-greyTint, .thread-divider, .btn--mode-filter {
          background-color: ${textColor};
        }
        img.avatar[src*="placeholder"] {
          filter: brightness(75%);
        }
        .btn--mode-primary, .btn--mode-highlight, .bg--color-brandPrimary {  /* Orange Buttons/Backgrounds */
          filter: brightness(90%);
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
        .commentList-item:not(:last-child),  /* New comment list class */
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
        img, .badge, .btn--mode-primary-inverted, .btn--mode-primary-inverted--no-state, .btn--mode-primary-inverted--no-state:active, .btn--mode-primary-inverted--no-state:focus, .btn--mode-primary-inverted--no-state:hover, .btn--mode-primary-inverted:active, .btn--mode-primary-inverted:focus, button:active .btn--mode-primary-inverted, button:active .btn--mode-primary-inverted--no-state, button:focus .btn--mode-primary-inverted, button:focus .btn--mode-primary-inverted--no-state, button:hover .btn--mode-primary-inverted--no-state {
          filter: invert(5%) brightness(90%);
        }
        .thread--expired > * {
          filter: opacity(50%) brightness(95%);
        }
        .icon--overflow {
          color: ${textColor};
        }
        .input {
          line-height: 1.1rem;
        }
        /* White Covers/Seals etc. */
        .progress--cover, .seal--cover:after {
          opacity: 0.8;
          background-color: ${veryDarkBackgroundColor} !important;
        }
        @-webkit-keyframes pulseBgColor {
          0%  { background-color: transparent; filter: contrast(100%); }
          15% { background-color: ${veryDarkBackgroundColor}; filter: contrast(105%); }
          85% { background-color: ${veryDarkBackgroundColor}; filter: contrast(105%); }
          to  { background-color: transparent; filter: contrast(100%); }
        }
        @keyframes pulseBgColor {
          0%  { background-color: transparent; filter: contrast(100%); }
          15% { background-color: ${veryDarkBackgroundColor}; filter: contrast(105%); }
          85% { background-color: ${veryDarkBackgroundColor}; filter: contrast(105%); }
          to  { background-color: transparent; filter: contrast(100%); }
        }
        /* END */
      `;

      /* Transparent Footer */
      if (pepperTweakerConfig.improvements.transparentPaginationFooter) {  // must be after dark theme
        css += `
          .js-sticky-pagi--on {
            background-color: transparent !important;
            border-top: none !important;
          }
          .js-sticky-pagi--on .tGrid-cell:not(:first-child):not(:last-child) {
            background-color: ${lightBackgroundColor} !important;
            border-top: 1px solid ${darkBorderColor};
            border-bottom: 1px solid ${darkBorderColor};
            padding-top: 0.7em;
            padding-bottom: 0.6em;
          }
          .js-sticky-pagi--on .tGrid-cell:first-child .hide--toW3, .js-sticky-pagi--on .tGrid-cell:last-child .hide--toW3 {
            visibility: hidden;
          }
          .js-sticky-pagi--on .tGrid-cell:first-child .hide--toW3, .js-sticky-pagi--on .tGrid-cell:last-child .hide--toW3 {
            display: none !important;
          }
          .js-sticky-pagi--on .tGrid-cell:first-child .hide--fromW3, .js-sticky-pagi--on .tGrid-cell:last-child .hide--fromW3 {
            display: inline-flex !important;
            background-color: ${lightBackgroundColor} !important;
            border: 1px solid ${darkBorderColor};
            border-radius: 5px;
            width: 42px;
            height: 42px;
          }
          .js-sticky-pagi--on .tGrid-cell:first-child .hide--fromW3 svg, .js-sticky-pagi--on .tGrid-cell:last-child .hide--fromW3 svg {
            color: #ff7900;
          }
          .js-sticky-pagi--on .tGrid-cell:nth-child(2) {
            padding-left: 1em !important;
            border-left: 1px solid ${darkBorderColor};
            border-radius: 5px 0 0 5px;
          }
          .js-sticky-pagi--on .tGrid-cell:nth-last-child(2) {
            padding-right: 1em !important;
            border-right: 1px solid ${darkBorderColor};
            border-radius: 0 5px 5px 0;
          }
        `;
      }
      /* END: Transparent Footer */
    }
    /* END: Dark Theme Style */
  }

  /* Check What Browser */
  const isFirefoxBrowser = typeof InstallTrigger !== 'undefined';
  const isOperaBrowser = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

  // Apply CSS
  if (css.length > 0) {
    if (isFirefoxBrowser && (document.hidden || !document.hasFocus())) {
      const appendStyle = () => {
        const style = document.createElement('style');
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
      };
      document.addEventListener('DOMContentLoaded', appendStyle);
    } else {
      (document.head || document.documentElement).insertAdjacentHTML('afterend', `<style id="pepper-tweaker-style">${css}</style>`);  // cannot be 'beforeend' => <link> elements with CSS can be loaded after the style and override it!
    }
  }

  /*** END: Setting CSS ***/

  /***** END: RUN AT DOCUMENT START (BEFORE LOAD) *****/


  /**********************************************/
  /***** RUN AFTER DOCUMENT HAS BEEN LOADED *****/
  /**********************************************/

  const startPepperTweaker = () => {

    const pepperTweakerStyleNode = document.getElementById('pepper-tweaker-style');
    if (pepperTweakerStyleNode) {
      document.head.appendChild(pepperTweakerStyleNode);  // move <style> to the proper position (the end of <head>) - only if <style> exists
    }

    if (pepperTweakerConfig.pluginEnabled) {

      /*** Change Theme Button ***/
      // const messagesButton = document.querySelector('.cept-navDropDown--messages');
      // if (messagesButton) {
      const searchForm = document.querySelector('form.search');
      if (searchForm) {
        const themeButtonDiv = document.createElement('DIV');
        themeButtonDiv.classList.add('navDropDown', 'hAlign--all-l', 'vAlign--all-m', 'space--r-3', 'hide--toW2');  // space--r-3 => right space
        const themeButtonLink = document.createElement('A');
        themeButtonLink.classList.add('btn', 'btn--square', 'navDropDown-btn', 'navDropDown-trigger', 'cept-trigger-user-activities-dropdown', 'navDropDown-trigger--highlight');
        const themeButtonImg = document.createElement('IMG');
        themeButtonImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAArlBMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADDOkjZAAAAOXRSTlMA3fOZiRSwMxFVoU/YkfKdOwP8Q0hu63cnC4Fw9vtaclSktufqy7H+9dvljTK1JhfKEsWlD3a37i9GF/eYAAAAnklEQVQY04XQ1xLCIBBA0QU0YmKiacbee++6//9jignMMj54n5gzQ1lgyNE0G0EeMVzOC0TaWqMvTfuaxhKYHIJbIY4vIe4WNhFbHn8+4Hqy8ZZUdXGoMM2y84W8wSkukuhXdG4EkasWB4oIi++O1JoBwlgdvrMxr4y4YWyFAWNTio3PRFgH8P5iIuUEx1IOKP5e1O4T4/rXOj1jQfcNdIApApX/xhoAAAAASUVORK5CYII=';
        themeButtonImg.style.filter = 'invert(60%)';
        themeButtonLink.appendChild(themeButtonImg);
        themeButtonDiv.appendChild(themeButtonLink);
        themeButtonDiv.onclick = () => setConfig({ darkThemeEnabled: !pepperTweakerConfig.darkThemeEnabled }, true);
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
        // nie ma już takich linków na stronie...
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

    const createLabeledButton = ({ label = '', id, className = 'default', callback } = {}) => {
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
      const createSelectInput = ({ options = [createNewFilterName], value, id, callback } = {}) => {
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

      const createLabeledInput = ({ id, callback, beforeLabel = '', afterLabel = '', min, max, step, value } = {}) => {
        const wrapperDiv = document.createElement('DIV');
        wrapperDiv.classList.add('space--v-2');

        const divElement = document.createElement('DIV');
        divElement.classList.add('tGrid', 'tGrid--auto', 'width--all-12');
        const inputElement = document.createElement('INPUT');
        inputElement.classList.add('input', 'width--all-12', 'bRad--r-r');
        inputElement.type = 'number';
        if (id) {
          inputElement.id = id;
        }
        if (callback) {
          inputElement.onchange = callback;
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
        if (isNumeric(value) && (!isNumeric(min) || value >= min) && (!isNumeric(max) || value <= max)) {
          inputElement.value = value;
        }
        divElement.appendChild(inputElement);

        if (afterLabel && afterLabel.length > 0) {
          const labelElement = document.createElement('LABEL');
          labelElement.classList.add('tGrid-cell', 'tGrid-cell--shrink', 'btn', 'bRad--l-r', 'vAlign--all-m');
          const labelText = document.createTextNode(afterLabel);
          labelElement.appendChild(labelText);
          divElement.appendChild(labelElement);
        }

        if (beforeLabel && beforeLabel.length > 0) {
          const spanElement = document.createElement('SPAN');
          spanElement.classList.add('formList-label-content', 'lbox--v-1');
          const spanText = document.createTextNode(beforeLabel);
          spanElement.appendChild(spanText);
          wrapperDiv.appendChild(spanElement);
        }
        
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
                listToGrid: {
                  create: createLabeledCheckbox,
                  params: {
                    label: 'Zamień listę na siatkę',
                    id: 'list-to-grid',
                    checked: pepperTweakerConfig.improvements.listToGrid,
                    callback: event => setConfig({ improvements: { listToGrid: event.target.checked } }, false),
                  },
                },
                gridColumnCount: {
                  create: createLabeledInput,
                  params: {
                    id: 'grid-column-count',
                    afterLabel: 'Liczba kolumn',
                    min: 0,
                    step: 1,
                    value: pepperTweakerConfig.improvements.gridColumnCount,
                    callback: event => setConfig({ improvements: { gridColumnCount: event.target.value } }, false),
                  },
                },
                transparentPaginationFooter: {
                  create: createLabeledCheckbox,
                  params: {
                    label: 'Przezroczysta stopka z paginacją',
                    id: 'transparent-pagination-footer',
                    checked: pepperTweakerConfig.improvements.transparentPaginationFooter,
                    callback: event => setConfig({ improvements: { transparentPaginationFooter: event.target.checked } }, false),
                  },
                },
                hideTopDealsWidget: {
                  create: createLabeledCheckbox,
                  params: {
                    label: 'Ukryj wigdet najgorętszych okazji',
                    id: 'hide-top-deals',
                    checked: pepperTweakerConfig.improvements.hideTopDealsWidget,
                    callback: event => setConfig({ improvements: { hideTopDealsWidget: event.target.checked } }, false),
                  },
                },
                hideGroupsBar: {
                  create: createLabeledCheckbox,
                  params: {
                    label: 'Ukryj pasek grup',
                    id: 'hide-groups-bar',
                    checked: pepperTweakerConfig.improvements.hideGroupsBar,
                    callback: event => setConfig({ improvements: { hideGroupsBar: event.target.checked } }, false),
                  },
                },
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
                    label: 'Dodaj przyciski "Lubię to" do najlepszych komentarzy',
                    id: 'add-like-buttons-to-best-comments',
                    checked: pepperTweakerConfig.improvements.addLikeButtonsToBestComments,
                    callback: event => setConfig({ improvements: { addLikeButtonsToBestComments: event.target.checked } }, false),
                  },
                },
                addSearchInterfaceCheckbox: {
                  create: createLabeledCheckbox,
                  params: {
                    label: 'Dodaj interfejs wyszukiwania',
                    id: 'add-search-interface',
                    checked: pepperTweakerConfig.improvements.addSearchInterface,
                    callback: event => setConfig({ improvements: { addSearchInterface: event.target.checked } }, false),
                  },
                },
                addCommentPreviewOnProfilePage: {
                  create: createLabeledCheckbox,
                  params: {
                    label: 'Dodaj podgląd komentarzy na stronie profilu użytkownika',
                    id: 'add-comment-preview-on-profile-page',
                    checked: pepperTweakerConfig.improvements.addCommentPreviewOnProfilePage,
                    callback: event => setConfig({ improvements: { addCommentPreviewOnProfilePage: event.target.checked } }, false),
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
    /*** END: Settings Page Configuration ***/

    /*** Search Engines ***/
    const searchEngine = Object.freeze({
      google: { name: 'Google', url: 'https://www.google.pl/search?q=', icon: 'data:image/png;base64,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' },
      ceneo: { name: 'Ceneo', url: 'https://www.ceneo.pl/;szukaj-', icon: 'data:image/x-icon;base64,AAABAAMAMDAAAAEACACoDgAANgAAACAgAAABAAgAqAgAAN4OAAAQEAAAAQAIAGgFAACGFwAAKAAAADAAAABgAAAAAQAIAAAAAAAACQAAAAAAAAAAAAAAAQAAAAAAAGu5+gBtufoAz+j9ANDo/QDx+P8Acrz6ANTr/QDV6/0A9vv/APf7/wB5v/oAG5P3AByT9wD8/v8AHZP3AP3+/wD+/v8AfsL6AKDS/AAilvcAI5b3AKbV/ACn1fwAKJn3ACmZ9wCu2PwAUKz5AFGs+QDV6/4AVq/5ANvu/gBdsvkAXrL5AOHx/gDi8f4AZLX5AOj0/gCLyPsAjMj7AC6c+ADu9/4AL5z4AO/3/gCRy/sANJ/4ADWf+AA2n/gAmM77ALne/QA7ovgAPKL4AMDh/QBBpfgAQqX4AGS1+gDH5P0AR6j4AGq4+gDM5/0Azef9AHG7+gDS6v0A9Pr/APX6/wAakvcA+v3/ABuS9wD7/f8A/P3/AH3B+gAflfcAIJX3ACGV9wCl1PwAJ5j3AEio+QCr1/wALJv3AE6r+QBPq/kAsdr8ALLa/ADU6v4AVK75AFWu+QC43fwA2e3+ANrt/gDf8P4AhMT7AOXz/gCJx/sA7Pb+AC2b+ACPyvsAM574AJbN+wC43f0AOaH4ADqh+ABFp/gAZ7f6AMrm/QDR6f0A0un9APL5/wBzvfoA8/n/AHS9+gB1vfoA+fz/APr8/wB6wPoAHZT3AB6U9wD+//8A////AKPT/AAkl/cAJZf3AKnW/AAqmvcAS6r5AE2q+QCu2fwAr9n8ALDZ/ABSrfkAU635ALTc/AC13PwAWrD5AN3v/gBes/kA3u/+AF+z+QBgs/kAgMP7AOPy/gDk8v4Ah8b7AIjG+wDp9f4A6vX+AOv1/gDw+P4A8fj+ADKd+ACTzPsAN6D4ADig+ACZz/sAPaP4AMLi/QBEpvgAZrb6AMfl/QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnIODEJAQEBCDHFycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnIMQkcpNYAgI4WANF1GQgxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJyDA5jbBkckD9uQ28/jj1MBWNyDHJycnJycnJycnJycnJycnJycnJycnJycnJycnIMLCaEDXR0dHR0dHR0dHR0DViUYgxycnJycnJycnJycnJycnJycnJycnJycnJycgxTOxB0dHR0dHR0dHR0dHR0dHR0A0sMcnJycnJycnJycnJycnJycnJycnJycnJyDIiLdHR0dHR0dHR0dHR0dHR0dHR0dI0LcnJycnJycnJycnJycnJycnJycnJycnILTiF0dHR0dHR0dHR0dHR0dHR0dHR0JHsMcnJycnJycnJycnJycnJycnJycnJycg4nmXR0dHR0dHR0dA+Si1ppEHR0dHR0XnJycnJycnJycnJycnJycnJycnJycnJycgwRDXR0dHR0dHRzPUV6MTJPRTM+dHRnLQxycnJycnJycnJycnJycnJycnJycnJyDl9SdHR0dHR0dHSClkALDAwLQkoffQY2DHJycnJycnJycnJycnJycnJycnJycnJyQgFDdHR0dHR0dBxjC3JycnJycnELEydGcnJycnJycnJycnJycnJycnJycnJycnJySBl0dHR0dHR0D3BCcnJycnJycnJycnFycnJycnJycnJycnJycnJycnJycnJycnIMLoR0dHR0dHR0ITEMcnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJCHT90dHR0dHR0ghNycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJACnR0dHR0dHR0JQtycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnIML3R0dHR0dHQPAEBycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJGfnR0dHR0dHQIVEJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJ3M3R0dHR0dHQoOAtycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnEXOnR0dHR0dHQkmAxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnFNPXR0dHR0dHQilQxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnEnHHR0dHR0dHRYLQxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnEnB3R0dHR0dHRXkw5ycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnF5A3R0dHR0dHRXkw5ycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnFKN3R0dHR0dHSGLQ5ycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnITMHR0dHR0dHSKYgxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJySXR0dHR0dHSPNAxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnILW3R0dHR0dHRrTwtycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJAZUN0dHR0dHRDm0BycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnIMZFx0dHR0dHR0WwtycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJxeWZ0dHR0dHR0YRRycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJyDCt0dHR0dHR0JJoLcnJycnJycnJyDAxycnJycnJycnJycnJycnJycnJycnJycnJyCxuRdHR0dHR0dGBycnJycnJycnEMLS1xcnJycnJycnJycnJycnJycnJycnJycnJycXdhdHR0dHR0dChlDAxycnJxQndqVgI1DHJycnJycnJycnJycnJycnJycnJycnJycguHa3R0dHR0dHSOWZYTcXIXVFEJdHSBGA5ycnJycnJycnJycnJycnJycnJycnJycnIUFXR0dHR0dHR0DYZVdRacBHR0dHRDjHJycnJycnJycnJycnJycnJycnJycnJycnIMMmd0dHR0dHR0dHR0dHR0dHR0dHR0XB0LcnJycnJycnJycnJycnJycnJycnJycnJyDBoedHR0dHR0dHR0dHR0dHR0dHR0dIlCcnJycnJycnJycnJycnJycnJycnJycnJycgwaAnR0dHR0dHR0dHR0dHR0dHRBUC0OcnJycnJycnJycnJycnJycnJycnJycnJycnIMYhIqdHR0dHR0dHR0dHR0Q2htGAxycnJycnJycnJycnJycnJycnJycnJycnJycnJyDEh/Eh4JdHR0dHR0RCQwPJMLcXJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnILci2DEZd4fBZeOTR2Qg5ycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycg5CQAxyRnILQAxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAIAAAAEAAAAABAAgAAAAAAAAEAAAAAAAAAAAAAAABAAAAAAAAWK/5AECk+ACk0/wAKJn3ACmZ9wBesvkAqdb8AEWn+AD0+v8ARqf4APX6/wB6wPoA3u/+AHvA+gBjtfkAsNn8APr9/wD7/f8Amc77AOTy/gDN5/0Attz8AOn1/gAunPgAL5z4AEuq+QDw+P4ANZ/4AB2U9wAelPcAH5T3AJ7R/AA7ovgAPKL4ACSX9wBvu/oAcLv6AL3f/QCl1PwAQqX4APH4/wAqmvcAK5r3ANnt/gDB4v0Aw+L9AF+z+QCr1/wA9/v/AODw/gDJ5f0Asdr8ALLa/AD9/v8A/v7/AJvP+wDl8/4A5vP+AOfz/gDO6P0ASKj5AOz2/gAxnfgAGpL3AGW2+gAbkvcAZrb6ADag+AA3oPgAOKD4AB+V9wAglfcAbLn6AFWu+QCg0vwAPaP4AKHS/ACIx/sAJZj3AIrH+wDU6/4A1ev+AHO8+gC+4P0AW7H5AL/g/QCm1fwAp9X8AEOm+ADx+f8AkMr7AHi/+gB5v/oAYLT5AMTj/QDF4/0A+fz/APr8/wCXzfsA4fH+AH/C+gDL5v0A/v//ALTb/AD///8A5/T+ANDp/QAtm/gA0un9AEqp+QDt9/4A7vf+ADOe+AAbk/cAHJP3AB2T9wBQrPkAnND8ADqh+AAilvcAhsX7ACOW9wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHRwcHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR1yQR0iBAQiHT9yHR0dHR0dHR0dHR0dHR0dHR0dHR1yHicLVywUFCwmWydHch0dHR0dHR0dHR0dHR0dHR0dckQSOjZoaGhoaGg2aR9Fcx0dHR0dHR0dHR0dHR0dHXJYMmhoaGhoaGhoaGhoaDccHR0dHR0dHR0dHR0dHR1zcF9oaGhoaGhoZmhoaGgwSHIdHR0dHR0dHR0dHR0dHR1aaGhoaGgINAsjTy0KaDROHB0dHR0dHR0dHR0dHR1yS2NoaGhoCg13Pz9BAwViB3IdHR0dHR0dHR0dHR0dHUFcZmhoaGgPdxwdHR0ccXJzHR0dHR0dHR0dHR0dHR0dRzNoaGhoEEA/HR0dHR0dHR0dHR0dHR0dHR0dHR0dHXMYUWhoaGg5S3IdHR0dHR0dHR0dHR0dHR0dHR0dHR0dcgEWaGhoaGoqHB0dHR0dHR0dHR0dHR0dHR0dHR0dHR1xdAhoaGhoU3kdHR0dHR0dHR0dHR0dHR0dHR0dHR0dHUFUYGhoaGg0Rx0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dP10QaGhoaC8dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0/LhBoaGhoVh0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHUEAMGhoaGgGHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dcRkoaGhoaDNGHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR1ydhNoaGhoVSIdHR0dHR0dHR0dHR0dHR0dHR0dHR0dHRwEZWhoaGhQFxwdHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR1KaGhoaG88cR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dQUJhaGhoaHhBHR0dHRxyHhwdHR0dHR0dHR0dHR0dHR1zPmxoaGhoDG0/cXI/TlJMG3IdHR0dHR0dHR0dHR0dHR1yCxFoaGhoKwttWA5nMGhMeRwdHR0dHR0dHR0dHR0dHRwpFWhoaGhoNRo9YGhoaDAkch0dHR0dHR0dHR0dHR0dHXIhXmhoaGhoaGhoaGhoZlpzHR0dHR0dHR0dHR0dHR0dHXJEAlloaGhoaGhoNmNNaxwdHR0dHR0dHR0dHR0dHR0dHXJ3SXU7OG9uMSVkSxxzHR0dHR0dHR0dHR0dHR0dHR0dHR1xHCkgCQdDInFyHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHHJxcnIdHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAQAAAAIAAAAAEACAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAAAACc0PwAG5P3AJbN+wAck/cAKpr3AB2T9wAsmvcAz+j9AFWu+QBquPoAeb/6ACKW9wAjlvcANqD4AG+7+gBwu/oA6/X+AP7//wD///8Af8L6AJXM+wAakvcAG5L3ACiZ9wAvnPgAveD9APD4/gCMyPsAoNL8AJrP+wCh0vwAIJX3ACGV9wBtuvoA/f7/AH3B+gD+/v8Aksv7AKbV/ACTy/sALZv4AMnm/QDL5v0A3/D+AFGs+QDu9/4A9fr/AIrH+wCe0fwAHZT3AJnO+wAelPcAH5T3AEGl+ABIqPkAVq/5AEmo+QDl8/4Ae8D6AI/K+wCQyvsAI5f3AKXU/AC02/wASKj4AN7v/gByvPoA8/n/AIbG+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMzMzMzMzARUVFQEzMzMzMzMzMzMFCzgPIw42DDMzMzMzMzMFGBwtERISGiUgMzMzMzMzIAASEis/KS48MzMzMzMzA0AQEkE4NAQsGAUzMzMzMxUKEhIwAzMxATEzMzMzMzMDMhISOhUzMzMzMzMzMzMzMSYSJCEVMzMzMzMzMzMzMzE+EiIJFTMzMzMzMzMzMzMDFBISQhUzMzMzMzMzMzMzFUIkEjsVMzEBMTMzMzMzMwM1ORIHDRYXNwYxMzMzMzMzNCcRJCodGS4bMzMzMzMzMwUoHkMSEhItLx8zMzMzMzMzBT0IRAITOCAzMzMzMzMzMzMxFhUBFQEzMzMzMwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' },  // ?nocatnarrow=1
      skapiec: { name: 'Skąpiec', url: 'https://www.skapiec.pl/szukaj/w_calym_serwisie/', icon: 'data:image/x-icon;base64,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////////i772/xV35f8Vd+X/FXfl/yhtvP9zSjP/c0oz/21CKv9jNRz/YzUc/2M1HP9jNRz/Ty0V/08tFf9JNy7/GYn5/xmJ+f8Vd+X/FXfl/xZ97P8XgO//F4Dv/xeA7/8XgO//F4Dv/zCN8f+Rw/f/6PL9//////////////////////96tvb/Fn3s/xV35f8Vd+X/FXfl/z5hj/9zSjP/c0oz/2g8JP9jNRz/YzUc/2M1HP9PLRX/Ty0V/0U+P/8Zifn/GYj4/xV35f8Vd+X/FXfl/xZ97P8XgO//F4Dv/xeA7/9apfT/9fr+////////////////////////////7fX9/yyL8P8XgO//Fn3s/xV35f8Vd+X/Fnjl/2BRUv9zSjP/ckgx/2Q3Hv9jNRz/YzUc/08tFf9PLRX/Rjw6/xmJ+f8Zifn/FXfl/xV35f8Vd+X/FXfl/xZ97P8XgO//JIfw//H4/v///////////////////////////9Ll+v88jen/Fnvp/xeA7/8XgO//Fn3s/xV35f8Vd+X/IHTP/3NKM/9zSjP/bUIq/2M1HP9jNRz/Ty0V/08tFf9LNCb/GYn5/xmJ+f8Veef/FXfl/xV35f8Vd+X/FXfl/xZ97P9Xo/P//////////////////f7//7HU+v9VovP/F3vo/xV35f8Vd+X/Fnvp/xeA7/8XgO//Fn3s/xV35f8XgO//S1py/3NKM/9zSjP/Zjkg/2M1HP9PLRX/Ty0V/08tFf8egeX/GYn5/xZ96/8Vd+X/FXfl/xV35f8Vd+X/FXfl/1uk8v////////////////9usPX/F4Dv/xeA7/8XgO//FXro/xV35f8Vd+X/Fnvp/xeA7/8XgO//Fnrp/xiE8/8egeX/b0s3/3NKM/9vRC3/YzUc/08tFf9PLRX/Ty0V/ytqrP8Zifn/GIPy/xV35f8Vd+X/FXfl/xV35f8Vd+X/Po/q/////////////////26w9f8XgO//GoHv/0qc8/+cyfj/qc73/xV35f8Vd+X/Fnvp/xeA7/8Veuj/GYj4/xmJ+f9YRkH/c0oz/3NKM/9nOiH/Ty0V/08tFf9PLRX/Pkte/xmJ+f8ZiPj/FXnn/xV35f8Vd+X/FXfl/xV35f8XeOX/6PL8/////////////f7//+Du/f/2+v7/////////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' },
      aliexpress: { name: 'Aliexpress', url: 'https://www.aliexpress.com/wholesale?SearchText=', icon: 'data:image/x-icon;base64,AAABAAEAICAAAAEAIACoEAAAFgAAACgAAAAgAAAAQAAAAAEAIAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQu5kAELua3BC7m8QQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELubxBC7mtwQu5kAAAAAAAAAAAAAAAAAELuZ0BC7m/QQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/QQu5nQAAAAABC7mQAQu5v0ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/QQu5kAELua3BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7mtwQu5vEELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELubxBC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BS/m/yVJ6f89Xuv/PV7r/yVJ6f8FL+b/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/MFPq/5ys9f/p7fz//v7+/////////////v7+/+nt/P+crPX/MFPq/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/DTbm/5eo9P/8/P7////////////////////////////////////////////8/P7/l6j0/w025v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/xY95//K0/n////////////6+/7/sL33/2uE8P9JaOz/SWjs/2uE8P+wvff/+vv+////////////ytP5/xY95/8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8JMub/w835////////////v8r4/yhM6f8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8oTOn/v8r4////////////w835/wky5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/4CV8v///////////6a19v8IMeb/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8IMeb/prX2////////////gJXy/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8YP+j/9PX9///////P1/r/CjPm/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8KM+b/z9f6///////09f3/GD/o/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/3SL8f///////v7+/0Ni7P8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v9DYuz//v7+//////90i/H/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/vMf4///////a4Pv/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v/a4Pv//////7zH+P8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v/p7Pz//////56u9f8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/56u9f//////6ez8/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BjDm//r7/v//////hZny/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/hZny///////6+/7/BjDm/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/qrj2/+vu/f88XOv/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v88XOv/6+/9/6m49v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/Bi/m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8GL+b/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wMv5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8DL+b/Az7p/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wM+6f8CYPH/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/AmDx/wCR/f8DOej/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wM56P8Akf3/AJn//wCF+v8DOej/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8DOej/AIX6/wCZ//8Amf/xAJn//wCR/f8BYvL/A0Dq/wMy5/8DMeb/AzHm/wMx5v8DMeb/AzHm/wMx5v8DMeb/AzHm/wMx5v8DMeb/AzHm/wMx5v8DMeb/AzHm/wMx5v8DMeb/AzHm/wMx5v8DMeb/AzHm/wMy5/8DQOr/AWLy/wCR/f8Amf//AJn/8QCZ/rcAmf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf+3AJn/QACZ//0Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//QCZ/0AAAAAAAJn/dACZ//0Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//0Amf90AAAAAAAAAAAAAAAAAJn/QACZ/7cAmf7xAJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ/vEAmf+3AJn/QAAAAAAAAAAA4AAAB8AAAAOAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAABwAAAA+AAAAc=' },
      banggood: { name: 'Banggood', url: 'https://www.banggood.com/search/$$.html', icon: 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAASduzaEnbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8SduzaEnbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/hJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xZ47P8Xeez/F3ns/xV47P8Qdez/EXbs/xJ27P8PdOz/FHfs/xZ47P8Qdez/EXXs/xJ27P8Sduz/EXbs/xx87f+ZxPf/vNj6/7rX+v+31fn/eLH0/xt77f8Xeez/Zqfz/7LS+f+51/n/hrn1/yqE7v8Rdez/Enbs/xF17P8hfu3/0+X7/7zY+v9wrPP/m8X3/+/2/v9ipPL/aKjz/+71/v+v0fn/mcT3/+Lu/f+w0fn/HXzt/xF27P8Rdez/IX7t/9Tm/P+IuvX/Bm/r/yeC7v/d6/z/jb32/8Hb+v+v0fn/GHrt/xl67f9wrPT/7PT9/0WT8P8PdOz/EXXs/yF+7f/S5fv/yN/7/4u89v+x0vn/yeD7/1mf8v/e7Pz/drD0/xF27P+Pvvb/zuL7/+jy/f9RmvH/DnTs/xF17P8hfu3/0uX7/8jf+/+MvPb/xN36/7PT+f87ju//3uz8/3ew9P8OdOz/NIrv/0aU8P9OmfH/I4Dt/xF17P8Rdez/IX7t/9Tm/P+Ju/b/CHDr/1Wd8f/t9f7/Vp3x/7rX+f+61/n/J4Lu/xl67f94sfT/v9r6/zOJ7/8Qdez/EXXs/yF+7f/S5fv/1ef8/6XL+P/S5fv/2On8/zGI7/9TnPH/4e79/9Xm/P/K4Pv/7fX+/5XC9/8Yeu3/EXbs/xF27P8Zeu3/ca30/4y99v+Nvfb/gbb1/0CQ8P8Sduz/Enbs/z+Q8P9+tPX/hrn1/1ad8f8ae+3/EXXs/xJ27P8Sduz/Enbs/w907P8PdOz/D3Ts/w507P8Qdez/Enbs/xJ27P8Qdez/DnTs/w507P8PdOz/EXbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8SduzaEnbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8SduzaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==' },
      joybuy: { name: 'Joybuy', url: 'https://www.joybuy.com/search?keywords=', icon: 'data:image/x-icon;base64,AAABAAkAMDAQAAEABABoBgAAlgAAACAgEAABAAQA6AIAAP4GAAAQEBAAAQAEACgBAADmCQAAMDAAAAEACACoDgAADgsAACAgAAABAAgAqAgAALYZAAAQEAAAAQAIAGgFAABeIgAAMDAAAAEAIACoJQAAxicAACAgAAABACAAqBAAAG5NAAAQEAAAAQAgAGgEAAAWXgAAKAAAADAAAABgAAAAAQAEAAAAAACABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIAAAACAgACAAAAAgACAAICAAACAgIAAwMDAAAAA/wAA/wAAAP//AP8AAAD/AP8A//8AAP///wCRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGVl5WXlZeVl5WXlZeVl5WXlZeVl5WXlZkZkZl5mVmZeZlZmXmZWZl5mVmZeZlZmXmXlZeRWTlZkVk5WZFZOVmRWTlZkVk5WRmRk5kZl5k5WTmVk1mTlZNZk5WTWZOVk5UZWVlZeRlZOVlZOZeVmTmXlZk5l5WZOVmXmTmXmVmVmZeZWRmRlZWZGXlZGZl5WZORl5eXl5d5eVkZeYeYeYl3l5eXlZWRlZWXlXiIiId5eTl5eHiIiIiIiJiZeTkZeZmVl5iIiIiIl5WZeIiIiIiIiIiJeVl5kXkZeYiPj4iIiXl5iP///4//j4iImJlZWZGXl5iIiIiIiJeZePj4iIiIiIiIh3l5k1mZWXmJiI/4iIl5iPiIiYmIiIiIiHl5WZEZeZeY2IiPiI2VeP+IiXeYmIj/+IeXmXmVl5WXmYiIiIiZiPiImJl5iYiIiIiZeRmTmZeZeZiI+IiXmPiIl5WVl52I+IiJWVmVlZlZl5eIj4iZiPiI2XmXmXmIj4iJl5kZGXkXmVmIiIh5iPiJiZWZWZeYiPiHmVmXmRmZWXmIj4iVePiIl5OVl5l4eI+JeXmRl5U5GXmHiPiZiPiIeVlZOVmXePiIlZmVkZlZeZd4j4h5iPiHeXmZWZeYmPiNl5cZeVk5lZiYiPiZePiIl5l5GTl5iI+Hl5mVmTlZWTmIj4iViPiIl5WRl5WXmPiIl5GTlZWZOViYj4iXmPiIl5lZeZl5iI+JiZeVmRl5WZeIiPiViPiInZOZkVl5iI+Il5mRl5kZl5mHj4iZiPiIl5WXmXl5iI+JeVkZeVl5GXmIiPh5iPiIl5kZWRl4mPiIl5WVmRmVlZiYiP2ZiPiIl5eVk5eYiP+JWZmTlZeRk5eIj4h5ePiNeZWTlZmIiPiJl5WVk5GXmVmJ+PiZiPiImJkZWXeIiPjXmVkZWVmZWXmIj4h5iPiHeVOXmJiIiIh5eRmXmZcZeZiYj4iZePiIl5l5h4iI+IiXmXmZF5lZlZeIiPiXePiIiYmHeIiPiImJlZEVmRmXkZeYj4iZiP+IiIiIiIiIjZeVkZmZeVORl5iIiPhZiI//+PiI+PiIiXmXmXkZGZlZWZWYiIiVmPiI+Pj4+IiJiZeZWRmXlZeZOXl5jYl5iYiIiIiIjYmJeXlZOVmRk5GVmVl5eXmVmJiYl52Xl5eVlZkZWTmVlZWTlZl5eYl5l5eVeXmJeZl5l5WTmVkZeZOVk5eZeZeZeXl5l5eZeXmVmRmVlZOZlZWZWZlZl5lZlZlZeZWXmVl5F5eZOZVTkZl5lxl5WVk5WXmXlZl5lZkZmZGVlZmZWXkZGVmRmTlZOZWZmXmRk5eVNZWTk5UZeZGXmTlZeVmVlZOVGRlZWVmZmXmVlZmVkZeZWVmTkZWZOZWTlZeTmRlxWZGXmXmRl5lZGTWVlZOVlZGVmXmVl5WZl5WZGRmXmVkZeZkZk5WTkZeZeZGRmRk5WRk1l5UZWRl5lZeXlZkZWZlZGVl5WXlZGXmZWZEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAIAAAAEAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////AAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEF/w0KAgH/////CwUBAQEBAgYK/woB/woFCAz/BgEBAQEBAQsNAf8IAQECDAwBAQEBAQEI/wH/CAEBAQf/BAEBAQEBCP8B/wgBAQEF/wUBAQEBAQj/Af8IAQEBBv8FAQEBAQEI/wH/CAEBAQv/AQEBAQEBCP8B/wgBBAv/CQEBAQEBAQj/Af////8NCAEBAQEBAQEDBQEFBQUFAgEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAADAAAABgAAAAAQAgAAAAAACAJQAAAAAAAAAAAAAAAAAAAAAAACIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8mGcn/Kh7K/y4iy/86Ls7/RzzR/1NJ1P9WTNX/VUvU/1RJ1P9QRtP/S0DS/0U60P8+M87/NCjM/yseyv8kGMj/IxfI/yIVyP8mGcn/NyvN/0g90f9XTdX/V03V/1dN1f9XTdX/V03V/1dN1f9XTdX/V03V/1dN1f9XTdX/U0jU/01D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yP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP88Mc7/Z17Z/5KL5P+0sOz/zcrz/+fl+f/d2/b/mZPl/1VL1P8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IxfI/yYZyP8oHMn/RTrQ/3Bo2/+cl+b/vLju/8/N8//j4fj/2Nb1/5yX5v9gV9f/MibM/ywgyv8nGsn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP86Ls7/YFfX/4eA4f+qper/ycXx/+jm+f/h3/f/m5bm/1ZM1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yMXyP8kGMj/Oi/O/1xT1v9+d9//oJrn/8G+7//j4fj/4uD3/6ei6f9tZNr/PjPO/zQpzP8qHsr/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/MibM/0tB0v9lXNn/iYLh/7ax7f/i4fj/6ej5/7Cr6/93b93/SD7R/zswzv8tIcr/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/MCTL/0c80f9eVdf/gXrg/7Gt6//h3/f/6uj5/7Ku6/96c97/TEPS/z0yzv8vIsv/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/LiLL/0I3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yP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/LCDK/zgtzf9EOtD/YFfX/4B53/+hnOf/vLnu/9XS9P/t7Pr/7Ov6/9HO8/+2su3/lZDk/2tj2v9BNs//IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//7+/7/4N73/8bC8f+rpur/kInj/3Vt3P9aUNb/X1bX/2lh2f9za9z/iYPh/6Oe6P+9ue7/zcry/9bU9f/f3ff/1NL0/7Sw7P+UjuT/dG3c/1ZN1f84Lc3/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//9/P7/7ez6/97b9v/Oy/P/vrvv/6+q6/+fmuf/op3o/6ij6f+uqer/ubXt/8bD8f/T0fT/1NH0/8zJ8v/FwfD/sKvr/4+I4/9tZdr/UkjU/0A1z/8vIsv/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//+/v7/+vn9//b1/P/x8Pv/7ez6/+nn+f/l4/j/5eT4/+fm+f/p5/n/6ej5/+no+v/q6Pr/29j2/8K+8P+qpOr/jIXi/2lg2v9GO9H/LyLL/yodyv8lGMj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP80KMz/U0jU/3Fo2/+PiOP/rajq/8vI8v/HxPH/i4Ti/09E0/8xJMv/bWTa/6mk6f/d2/b/3dv2/93b9v/d2/b/3dv2/93b9v/d2/b/3dv2/93b9v/d2/b/2df1/9LQ9P/MyfL/urbu/6Gb5/+HgOH/bGPa/1BF0/8zJ8z/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8vI8v/RTrQ/1pQ1v9wZ9v/hX7h/5uV5v+YkuX/bWXa/0I30P8sIMr/V07V/4J74P+opOn/qKTp/6ik6f+opOn/qKTp/6ik6f+opOn/qKTp/6ik6f+opOn/oZzn/5iT5f+QieP/gXrf/3Bo2/9fVtf/TkTT/z0yzv8sIMr/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8qHcr/NyvN/0Q50P9RR9P/XlXX/2tj2v9pYdr/T0XT/zUpzP8oG8n/QjfQ/1xT1v9zbNz/c2zc/3Ns3P9zbNz/c2zc/3Ns3P9zbNz/c2zc/3Ns3P9zbNz/amLa/19V1/9TSdT/ST7R/0A1z/84LM3/MCTL/yseyv8lGMj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8mGcn/LiHL/zUpzP89Mc7/RDnQ/0tB0v9KQNL/OzDO/y0gyv8lGMj/NCjM/0M40P9QRtP/UEbT/1BG0/9QRtP/UEbT/1BG0/9QRtP/UEbT/1BG0/9QRtP/Rz3R/zwxzv8xJsv/Kx/K/ycbyf8jF8j/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8kGMj/KRzJ/y4hy/8yJsz/NyvN/zswzv87L87/MibM/ygcyf8kF8j/LSHK/zYrzf8+M8//PjPP/z4zz/8+M8//PjPP/z4zz/8+M8//PjPP/z4zz/8+M8//OS7N/zImzP8rH8r/JxvJ/yUYyP8jFsj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8jFsj/JBjI/yYZyf8oG8n/Kh3K/ysfyv8rH8r/KBvJ/yQXyP8iFcj/JhnJ/ykdyv8sIMr/LCDK/ywgyv8sIMr/LCDK/ywgyv8sIMr/LCDK/ywgyv8sIMr/Kx7K/ygbyf8lGcj/JBfI/yMWyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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z/8iFcj/IhXI/yIVyP8iFcj/LSHK/1FH1P9+dt//xcLw/+/u+/+ZlOX/TELS/zYrzf8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/01D0/+De+D/uLTt/+7t+v+1sOz/Sj/S/2Rb2P/QzfP/4N/3/6um6v92bd3/QDTP/yIVyP8iFcj/IhXI/yIVyP8rHsr/SD7R/3Jq3P+/vO//7+77/52Y5v9SSdT/OS7N/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/TUPT/4N74P+4tO3/7u36/7Ww7P9KP9L/ZFvY/9DN8//g3/f/q6bq/3Zt3f9ANM//IhXI/yIVyP8iFcj/IhXI/yoeyv9HPNH/cGjb/7+77//v7/v/n5rn/1VM1f86L87/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP9NQ9P/g3vg/7i07f/u7fr/tbDs/0o/0v9kW9j/0M3z/+Df9/+rpur/dm3d/0A0z/8iFcj/IhXI/yIVyP8iFcj/Kx/K/0tB0v92btz/wb7v/+/v+/+fmuf/VUzV/zovzv8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/01D0/+De+D/uLTt/+7t+v+1sOz/Sj/S/2Rb2P/QzfP/4N/3/6um6v92bd3/QDTP/yIVyP8iFcj/IhXI/yIVyP8vI8v/WlHW/4uE4v/Lx/L/7u36/5eS5f9JPtH/NCnM/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/TUPT/4N74P+4tO3/7u36/7Ww7P9KP9L/ZFvY/9DN8//g3/f/q6bq/3Zt3f9ANM//IhXI/yIVyP8iFcj/IhXI/zUpzP90bNz/rqnr/9rY9v/s6/r/iIHh/zAky/8oHMn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP9NQ9P/g3vg/7i07f/u7fr/tbDs/0o/0v9kW9j/0M3z/+Df9/+rpur/dm3d/0A0z/8jFsj/KBvJ/y4iy/86Ls7/VkzV/5eR5f/MyfL/3dv2/9jW9f93b93/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/01D0/+De+D/uLTt/+7t+v+1sOz/Sj/S/2Rb2P/QzfP/4N/3/6um6v92bd3/QDTP/ygbyf81Ksz/TELS/3Jq2/+alOb/x8Tx/+Ti+P/Ny/L/ranq/2Na2P8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/TUPT/4N74P+4tO3/7u36/7Ww7P9KP9L/ZFvY/9DN8//m5Pj/urbu/46I4/9iWdj/UUfT/2FY1/97dN7/pqHp/8nG8f/c2vb/3t33/66q6/9+d9//TULS/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP9NQ9P/g3vg/7i07f/u7fr/tbDs/0o/0v9kW9j/0M3z//X0/P/j4fj/0c7z/7+77/+4tO3/vrvu/8jE8f/V0/T/2Nb1/8TA8P+oo+n/dW3c/0c80f8zJ8z/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/0g90f94cN3/p6Lp/9fU9f+kn+j/RTrQ/11T1v+8uO7/5eT4/+Xk+P/l5Pj/5eT4/+Xk+P/l5Pj/4uD4/9nX9f/Hw/H/npjn/3Rs3P9HPNH/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/OC3N/1VK1P9waNv/jIbi/25m2/82K83/RDrQ/3x13v+Vj+T/lY/k/5WP5P+Vj+T/lY/k/5WP5P+PieP/gHnf/29n2/9aUNb/RTrQ/zElzP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8rH8r/NyvN/0M40P9ORNP/QjfQ/yoeyv8wJMv/SD3R/1JI1P9SSNT/UkjU/1JI1P9SSNT/UkjU/0tB0v86L83/LCDK/yYZyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yYZyf8rH8r/MCTL/zYqzf8wJMv/JRnJ/ygcyf8zJ8z/NyzN/zcszf83LM3/NyzN/zcszf83LM3/NCnM/ywgyv8mGsn/JBfI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAEAAAACAAAAABACAAAAAAAEAEAAAAAAAAAAAAAAAAAAAAAAAAIhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/1lQ1v//////8fD8/6yn6v8wJMv/IhXI//////////////////////+6tu7/WVDW/yIVyP8iFcj/IhXI/yIVyP8wJMv/Z17Z/6yn6v//////rKfq/yIVyP//////rKfq/1lQ1v+RiuT/4+L4//////9nXtn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/urbu//Hw/P8iFcj//////5GK5P8iFcj/IhXI/zAky//j4vj/4+L4/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/5GK5P//////IhXI//////+RiuT/IhXI/yIVyP8iFcj/dW3d//////9LQdL/IhXI/yIVyP8iFcj/IhXI/yIVyP+RiuT//////yIVyP//////kYrk/yIVyP8iFcj/IhXI/1lQ1v//////WVDW/yIVyP8iFcj/IhXI/yIVyP8iFcj/kYrk//////8iFcj//////5GK5P8iFcj/IhXI/yIVyP9nXtn//////1lQ1v8iFcj/IhXI/yIVyP8iFcj/IhXI/5GK5P//////IhXI//////+RiuT/IhXI/yIVyP8iFcj/urbu//////8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP+RiuT//////yIVyP//////kYrk/yIVyP9LQdL/urbu//////+emef/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/kYrk//////8iFcj///////////////////////Hw/P+RiuT/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/z4yz/9ZUNb/IhXI/1lQ1v9ZUNb/WVDW/1lQ1v8wJMv/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' },
      amazonDe: { name: 'Amazon.de', url: 'https://www.amazon.de/s?k=', icon: 'data:image/x-icon;base64,AAABAAQAMDAAAAEAIACoJQAARgAAACAgAAABACAAqBAAAO4lAAAYGAAAAQAgAIgJAACWNgAAEBAAAAEAIABoBAAAHkAAACgAAAAwAAAAYAAAAAEAIAAAAAAAgCUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///0X///+Z////zP////P////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////w////zP///5P///8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8k////wP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////t////x4AAAAAAAAAAAAAAAAAAAAAAAAAAP///0L////z///////////////////////////////////////////////////////////////////////////X7///u+T//5DV//+R1f//csr//1C+//+Cz///kdX//5/Z///L6v//8vr//////////////////////////////////////////////////////////////////////////////////////+3///85AAAAAAAAAAAAAAAA////Lf////D///////////////////////////////////////////////////////////////+85f//csr//xOt//8AqP//AKj//wCn//8Ap///AKf+/wCn//8AqP//AKf//wCn//8Ap///AKj//z64//+Q1f//2PD////////////////////////////////////////////////////////////////////////////q////JAAAAAAAAAAA////zP/////////////////////////////////////////////////////y+v//kNX//xOs//8Ap///AKf//wCo//8Ap///AKf//wCo//8AqP//AKf//wCn/v8Ap///AKj//wCn//8AqP//AKf//wCn//8Ap///AKf//z64//+u4P//////////////////////////////////////////////////////////////////////vQAAAAD///9R////////////////////////////////////////////////8vr//5HV//8TrP//AKj//wCo//8AqP//AKj//wCo//8Ap///AKf//wCn//8AqP//AKf//wCo//8AqP//AKj//wCn//8Ap/7/AKf//wCo//8AqP//AKf//wCo//8Ap///KbL//67g////////////////////////5fT//////////////////////////////////////0L///+l//////////////////////////////////////////+75P//E63//wCn//8Ap///AKf//wCn/v8AqP//AKf//wCo//8psv//UL///4LQ//+R1f//kNX//5DV//+Q1f//kNX//5HV//9hw///UL7//wCo//8Ap/7/AKj//wCn//8Ap///AKj//wCn//9Qvv//5vX/////////////Ub///5DV/////////////////////////////////5b////q////////////////////////////////8vr//3LK//8AqP//AKf//wCn//8AqP//AKj//1C///+R1f//y+r////////////////////////////////////////////////////////////////////////Y7///rd///3LJ//8Trf//AKf+/wCn//8AqP//E63//7zl////////n9r//wCo///l9P///////////////////////////9v////////////////////////////////Y7///Prj//wCn//8Ap///AKf+/1C+//+t3///8vr/////////////////////////////////////////////////////////////////////////////////////////////////////////////vOX//3LK//8Ap///AKf//wCo//+t3///2O///wCn//9zyv////////////////////////////n//////////////////////////9jw//8Trf//AKf//wCn//9yyf//5fT////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////y+v//kNX//xOt//9hw////////xOt//8Trf//////////////////////////////////////////////////u+T//xOt//8AqP//csn//+X0/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////1G///8Ap///5vX////////////////////////////////////////Y7///AKj//1C+///l9f///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9jv//8Ap///Ub///2HD//+Q1f//csr//wCn//8Ap///y+r////////////////////////////////////////Y8P//ruD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////L6v//YsP//wCn//8Ap///AKj//wCo//8Ap///2PD///////////////////////////////////////////////////////////////////////////////////////////////////Pz8/+ioqL/VlZU/x0dG/8FBQT/BQUD/x0dHP9WVlX/hoaE/9jY2P////////////////////////////////++vr7/VlZV/6Kiov/////////////////////////////////K6f//yun//8rq///l9P//////////////////////////////////////////////////////////////////////////////////////////////////oqKi/x0dHP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/BQUE/wUFBP9WVlT/5ubm/////////////////7Cwr/8FBQT/BQUE/wUFBP92dnb///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+GhoX/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/BQUE/wQEA/8FBQT/BQUD/wUFA/8FBQT/HR0c/7Cwr///////2dnZ/wUFBP8FBQT/BQUE/wUFBP8FBQT/Z2dm//Ly8v///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////729vf8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/BQUE/wUFBP8FBQP/BQUD/wUFBP8FBQT/BQUE/wUFBP+ioqL/MjIw/wUFBP8FBQT/BQUD/wUFA/8FBQT/BQUE/0REQ//y8vL//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////zExMP8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP8dHRv/////////////////////////////////////////////////////////////////////////////////////////////////////////////////2dnZ/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8dHRz/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQP/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP8yMjD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////lJST/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/HR0c/8zMzP///////////8zMzP8xMTD/BQUE/wUFBP8FBQT/BQUD/wUFA/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP/MzMz/////////////////////////////////////////////////////////////////////////////////////////////////////////////////hoaF/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/zMzM///////////////////////y8vL/HR0c/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/BQUE/4aGhP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VlZV/wUFBP8EBAP/BQUD/wUFA/8FBQT/BQUE/wUFBP9FRUT/////////////////////////////////sLCv/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/+Xl5f//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ZmZl/wUFA/8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP9VVVT//////////////////////////////////////zExMP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VlZV////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////lJST/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP9WVlX//////////////////////////////////////3Z2dv8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VlZV////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////sbGw/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8dHRz//////////////////////////////////////5SUk/8FBQP/BQUE/wUFA/8FBQT/BQUE/wUFBP8FBQT/VlZU////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8vLy/wUFA/8FBQP/BQUD/wUFBP8FBQT/BQUE/wUFBP8FBQT/oqKi/////////////////////////////////5SUk/8FBQP/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQP/VlZV/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////3Z2dv8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/HR0c/729vf///////////////////////////83Nzf8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VlZV/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+bm5v8dHRz/BQUD/wUFA/8FBQT/BQUE/wUFBP8EBAP/BQUE/wUFBP9WVlX/vb29//Pz8////////////83Nzf8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/VlZV//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////++vr7/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VlZU/0REQ/8FBQT/BQUE/wUFBP8FBQP/BQUE/wUFBP8FBQT/VVVU////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////zMzM/x0dG/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQP/VVVU//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Ly8v92dnb/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VlZV////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////5ubm/6Kiov9VVVT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/VlZV/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9nZ2f/MzMz/lJST/5SUk/9WVlT/VlZV/zExMP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VlZV/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8zMzP8FBQP/BQUE/wUFA/8FBQT/BAQD/wUFBP8FBQT/VlZV////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8/Pz/8zMzP/MzMz/lJST/5SUk//Z2dn//////////////////////////////////////76+vv8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/VlZV/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////5WVk/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP9nZ2b//////////////////////////////////////5SUk/8FBQT/BQUE/wUFA/8FBQT/BQUE/wUFBP8FBQT/dnZ2/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////1ZWVP8FBQT/BQUE/wUFBP8FBQT/BQUD/wUFA/8dHRz/8/Pz/////////////////////////////////3Z2dv8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/lJST/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////6Ghof8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/dnZ2////////////////////////////2dnZ/x0dHP8FBQT/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/lJST/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+bm5v8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/BAQD/zExMP+xsbD/zMzM/8zMzP+UlJP/HR0c/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/zMzM//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////92dnb/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8dHRv///////////////////////////////////////////////////////////////////////////n////t///////////////////////////////////////////////////////////m5ub/Hh4c/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wQEA/8FBQP/BQUD/wUFBP+UlJP//////////////////////////////////////////////////////////////////////////97///+o////////////////////////////////////////////////////////////////2dnZ/x0dG/8FBQT/BQUE/wUFA/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/BQUE/0VFRP/z8/P//////////////////////////////////////////////////////////////////////////5b///9U/////////////////////////////////////////////////////////////////////9nZ2f8xMTD/BQUE/wUFBP8FBQP/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VVVU//Ly8v///////////////////////////////////////////////////////////////////////////////0L///8D////z///////////////////////////////////////////////////////////////////////////lZWU/zExMP8FBQT/BQUD/wUFA/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/BQUD/zExMP+xsbD/////////////////////////////////////////////////////////////////////////////////////wwAAAAAAAAAA////MP////b////////////////////////////////////////////////////////////////////////////////Z2dn/lJST/1ZWVf9WVlX/BAQD/wUFBP8FBQT/RUVD/1ZWVf+UlJP/zMzM///////////////////////////////////////////////////////////////////////////////////////////w////JwAAAAAAAAAAAAAAAP///0v////z//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////D///8/AAAAAAAAAAAAAAAAAAAAAAAAAAD///8t////yf//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////w////yQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///0v///+f////z///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////zP///5n///9FAAAAAAAAAAAAAAAAAAAAAAAAAAD4AAAAAB8AAOAAAAAABwAAwAAAAAADAACAAAAAAAEAAIAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAgAAAAAABAADAAAAAAAMAAOAAAAAABwAA+AAAAAAfAAAoAAAAIAAAAEAAAAABACAAAAAAAIAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////Uf///5/////S///////////////////////////////////////////////////////////////////////////////////////////////////////////////P////nP///0gAAAAAAAAAAAAAAAAAAAAA////GP///7H//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////6X///8SAAAAAP///wb////P////////////////////////////////////////////////5fX//67g//+R1f//UL7//1C+//9Rv///YsT//5DU//+85f//8vr//////////////////////////////////////////////////////8P///8D////df//////////////////////////////////////////ruD//z24//8AqP//AKf//wCo//8Ap///AKj//wCo//8Ap/7/AKf//wCn//8AqP//csr//8vq/////////////////////////////////////////////////2b////S////////////////////////////////y+r//ymy//8Ap///AKj//wCo//8Ap///AKf//wCn//8Ap///AKj//wCn//8Ap///AKj//wCo//8AqP//AKj//1C////Y8P///////8rq///Y7///////////////////////w/////z/////////////////////8vr//3LJ//8AqP//AKf//wCn/v9ixP//kNT//8vq///y+v////////////////////////L6///L6v//n9r//2LE//8Trf//AKf//wCo//+u4P//vOX//z65///////////////////////w//////////////////////L6//8+uP//AKf//1C+//+t3///8/r///////////////////////////////////////////////////////////////////////+85f//UL7//wCo///Y7///AKf//8rp///////////////////////////////////Y7///E63//1C+///L6v////////////////////////////////////////////////////////////////////////////////////////P7///L6v//5fT///L6//8ps///kNT//////////////////////////////////5DU//+t3///////////////////////////////////////////////////////////////////////////////////////////////////5fX//1C+//8AqP//AKf//wCn//+Q1f//////////////////////////////////////////////////////////////////8vLy/5SUk/9FRUT/BQUE/wQEA/8yMjD/Z2dm/8zMzP////////////////+GhoX/Z2dm//Lz8////////////+X0///L6v//yun///L6//////////////////////////////////////////////////////////////Ly8v9FRUT/BQUE/wUFBP8FBQT/BQUE/wQEA/8FBQT/BQUD/3Z2dv/z8/P/dnZ2/wUFBP8FBQP/MTEw/9nZ2f//////////////////////////////////////////////////////////////////////////////////////VlZV/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/zIyMP8FBQT/BQUE/wUFBP8FBQT/HR0c/9nZ2f///////////////////////////////////////////////////////////////////////////+bm5v8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8xMTD/HR0c/wUFA/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/lJST////////////////////////////////////////////////////////////////////////////vb29/wUFBP8EBAP/BQUE/wUFBP8FBQT/dnZ2////////////oqKi/wUFBP8EBAP/BQUE/wUFBP8FBQP/BQUE/zIyMf/y8vL///////////////////////////////////////////////////////////////////////////+UlJP/BQUE/wUFBP8FBQT/BQUE/wUFBP/y8vL/////////////////Z2dm/wUFBP8FBQT/BQUE/wUFBP8FBQT/sbGw/////////////////////////////////////////////////////////////////////////////////7GxsP8FBQT/BQUD/wUFBP8FBQT/BQUD//////////////////////+9vb3/BQUE/wUFBP8FBQT/BQUE/wUFBP/m5ub/////////////////////////////////////////////////////////////////////////////////2dnZ/wUFBP8FBQT/BQUE/wUFBP8FBQT/zMzM/////////////////+bm5v8FBQT/BQUE/wUFA/8FBQT/BQUD////////////////////////////////////////////////////////////////////////////////////////////MTEw/wUFBP8FBQT/BQUE/wUFBP9FRUT/5eXl/////////////////wUFBP8FBQT/BQUE/wUFBP8FBQT////////////////////////////////////////////////////////////////////////////////////////////MzMz/BQUE/wUFA/8FBQT/BQUD/wUFBP8FBQT/dnZ2/5SUk/+9vb3/BQUE/wUFBP8FBQT/BQUE/wUFA/////////////////////////////////////////////////////////////////////////////////////////////////+wsK//HR0c/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE///////////////////////////////////////////////////////////////////////////////////////////////////////m5ub/hoaF/zIyMP8FBQT/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP8FBQP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+bm5v/MzMz/lJST/5SUk/9WVlX/BQUE/wQEA/8FBQT/BQUE/wUFA//////////////////////////////////////////////////////////////////////////////////////////////////y8vL/zMzM/8zMzP/Nzc3///////////////////////////8FBQT/BQUE/wUFBP8FBQT/BQUD////////////////////////////////////////////////////////////////////////////////////////////Z2dm/wUFBP8FBQT/BQUE/wUFBP/y8vL/////////////////2dnZ/wUFA/8FBQP/BQUD/wUFBP8FBQT///////////////////////////////////////////////////////////////////////////////////////////9mZmX/BQUE/wUFBP8FBQT/BQUE/3Z2dv////////////////92dnb/BQUE/wUFBP8FBQT/BQUE/wUFBP///////////////////////////////////////////////////////////////////////////////////////////7CwsP8FBQT/BQUE/wUFBP8FBQT/BQUE/zIyMP9WVlX/RUVE/wUFBP8FBQT/BQUE/wUFBP8FBQT/RUVD/////////////////////////////////////////////////////////////////////////////////////////////////1ZWVf8FBQT/BQUE/wUFBP8EBAP/BQUD/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP+wsK/////////////////////////////////////////////////2////2///////////////////////////////////////////8vLy/0VFRP8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/dnZ2/////////////////////////////////////////////////////8z///9+/////////////////////////////////////////////////////7Cwr/9FRUT/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/RUVE/7Cwr///////////////////////////////////////////////////////////b////wz////b///////////////////////////////////////////////////////////y8vL/zMzM/8zMzP/MzMz/zc3N/+bm5v///////////////////////////////////////////////////////////////9L///8GAAAAAP///yf////b///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////S////HgAAAAAAAAAAAAAAAP///wz///94////2P/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////S////cv///wkAAAAAAAAAAOAAAAeAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAHAAAADKAAAABgAAAAwAAAAAQAgAAAAAABgCQAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8G////hP///9v/////////////////////////////////////////////////////////////////////////////////////////2////4T///8GAAAAAP///wz////P///////////////////////////y+v//vOX//5DV//+C0P//YsT//5DU//+u4P//5fT////////////////////////////////////////////G////Cf///4T/////////////////////8vr//3LK//8Trf//AKj//wCn//8Ap///AKf+/wCo//8AqP//AKf//1C+///K6v//////////////////////////////////////e////9v///////////////+u4P//E6z//wCn//8AqP//AKf//wCo//8Ap///AKf//wCo//8AqP//AKf//wCo//8Ap///kNX/////////////kdX//9jw////////////z/////D//////////4LP//8Ap///AKf//wCo//8qs///csr//5DV///K6f//y+r//8rq///L6v//n9n//3LK//8TrP//AKf//5/a////////kNX//1C+////////////7f////D/////kdX//wCo//8AqP//csn//9jw///////////////////////////////////////////////////y+v//n9r//4LQ////////yun//wCn///l9P//////8P////DK6v//AKf//1C+///l9P//////////////////////////////////////////////////////////////////////////////////yun//wCn//+85f//////8P////Aps///kNX///////////////////////////////////////////////////////////////////////+g2v//KrP//2LE//+Q1P//csr//wCn//+R1f//////8P////C75P////////////////////////////+xsbD/VlZV/1VVVP9WVlX/oaGh//Ly8v/y8vL/dnZ2/7Cwr///////vOT//2HD//8Ap///AKj//wCn/v+85f//////8P////D//////////////////////////4aGhf8EBAP/BQUD/wUFBP8EBAP/BQUD/0VFRP9nZ2b/BQUE/wUFBP92dnb/////////////////2O///+b1////////////8P////D/////////////////////8vLy/wUFBP8FBQT/BQUE/wUFA/9EREP/HR0b/wUFBP8FBQT/BQUD/wUFBP8FBQT/////////////////////////////////////8P////D/////////////////////zMzM/wUFBP8FBQT/BQUE/3Z2dv//////8vLy/x0dHP8FBQT/BQUE/wUFBP+UlJP/////////////////////////////////////8P////D/////////////////////zc3N/wUFBP8FBQT/BQUE/5SUk////////////4aGhf8FBQT/BQUE/wUFBP/MzMz/////////////////////////////////////8P////D//////////////////////////x0dG/8FBQT/BQUE/0VFQ//z8/P//////76+vv8FBQT/BQUE/wUFBP/Nzc3/////////////////////////////////////8P////D//////////////////////////7CwsP8FBQP/BQUE/wUFBP8dHRv/dnZ2/3Z2dv8FBQP/BQUE/wUFBP/MzMz/////////////////////////////////////8P////D///////////////////////////////++vr7/MTEw/wUFBP8FBQP/BQUD/wUFBP8FBQT/BQUE/wUFBP/MzMz/////////////////////////////////////8P////D//////////////////////////////////////////+Xl5f/MzMz/lJST/3Z2dv8FBQT/BQUE/wUFBP/MzMz/////////////////////////////////////8P////D//////////////////////////4aGhf9WVlX/HR0b/729vf///////////7Cwr/8FBQP/BQUE/wUFBP/MzMz/////////////////////////////////////8P////D//////////////////////////2ZmZf8FBQT/BQUE/x0dHP++vr7/zMzM/0VFRP8FBQT/BQUE/wUFBP/y8vL/////////////////////////////////////8P////D//////////////////////////8zMzP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUD/1ZWVP/29vb/////////////////////////////////////7f///9X///////////////////////////////+wsK//HR0c/wUFBP8FBQT/BQUE/wUFBP8FBQT/MTEw/9vb2//6+vr/////////////////////////////////////z////3v/////////////////////////////////////8vLy/76+vv+UlJP/lJST/5SUk/++vr7/////////////////////////////////////////////////////df///wn////D//////////////////////////////////////////////////////////////////////////////////////////////////////////////+9////BgAAAAD///8D////df///9L/////////////////////////////////////////////////////////////////////////////////////////z////3X///8DAAAAAIAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAABACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAAAAAAAAAAAAAAAAAAAAAAAD///8G////lv////b/////////////////////////////////////////////////////////9v///5b///8G////iv/////////////////////Y7///n9r//5DV//+Q1P//vOT/////////////////////////////////iv///+f//////////8vq//9Qvv//AKj//wCn//8Ap///AKf+/wCn//8ps///u+T////////y+v//8vr//////+f////w/////67g//8AqP//AKj//z24//+C0P//kNX//5DU//+R1f//UL7//wCn//+u4P//vOX//4LQ///////w////8Lzl//8AqP//csn//+bz///////////////////////////////////l9P//rd///9jv//8Trf//////8P////Aqs///2O//////////////////////////////////////////////Ur7//3LK//+C0P//AKf///////D////w5vX/////////////zMzM/x0dG/8FBQT/HR0b/5SUk/9WVlT/RUVD/+fu8/+i2P7/csr//3LK///////w////8P///////////////zExMP8FBQT/BQUE/0VFRP8FBQP/BQUE/wUFBP+UlJP/////////////////////8P////D///////////////8FBQT/BQUE/4aGhP//////ZmZl/wUFBP8FBQT/8vLy//////////////////////D////w////////////////VlZV/wUFBP8yMjD/5ubm/5SUk/8FBQT/BQUE///////////////////////////w////8P///////////////9nZ2f8yMjD/BQUE/wUFBP8FBQT/BQUE/wUFBP//////////////////////////8P////D////////////////m5ub/zMzM/729vf+wsK//VlZV/wUFBP8FBQT///////////////////////////D////w////////////////Z2dm/wUFBP9FRUT/2NjY/2dnZv8FBQT/HR0c///////////////////////////w////5////////////////8zMzP8FBQP/BQUE/wUFBP8FBQT/BQUE/3Z2dv//////////////////////////5////4f/////////////////////2dnZ/3Z2dv9VVVT/VlZV/6Kiov///////////////////////////////4r///8G////jf///+T/////////////////////////////////////////////////////////5P///43///8GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==' },
      ebay: { name: 'eBay', url: 'https://www.ebay.com/sch/i.html?_nkw=', icon: 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP84MuX/ODLl/zgy5f84MuX/0mQA/9JkAP/SZAD/0mQA/wKv9f8Cr/X/Aq/1/wKv9f8XuIb/F7iG/xe4hv8XuIb/ODLl/zgy5f84MuX/ODLl/9JkAP/SZAD/0mQA/9JkAP8Cr/X/Aq/1/wKv9f8Cr/X/F7iG/xe4hv8XuIb/F7iG/zgy5f84MuX/ODLl/zgy5f/SZAD/0mQA/9JkAP/SZAD/Aq/1/wKv9f8Cr/X/Aq/1/xe4hv8XuIb/F7iG/xe4hv84MuX/ODLl/zgy5f84MuX/0mQA/9JkAP/SZAD/0mQA/wKv9f8Cr/X/Aq/1/wKv9f8XuIb/F7iG/xe4hv8XuIb/ODLl/zgy5f84MuX/ODLl/9JkAP/SZAD/0mQA/9JkAP8Cr/X/Aq/1/wKv9f8Cr/X/F7iG/xe4hv8XuIb/F7iG/zgy5f84MuX/ODLl/zgy5f/SZAD/0mQA/9JkAP/SZAD/Aq/1/wKv9f8Cr/X/Aq/1/xe4hv8XuIb/F7iG/xe4hv84MuX/ODLl/zgy5f84MuX/0mQA/9JkAP/SZAD/0mQA/wKv9f8Cr/X/Aq/1/wKv9f8XuIb/F7iG/xe4hv8XuIb/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAAAAAAAAAAAAAAAAAAAAAAA8wAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAPMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAK4AAABsAAAAAAAAAAAAAAAAAAAAAAAAAG8AAACuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkAAAA6gAAAGkAAAAMAAAADAAAAGkAAADqAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcAAAC3AAAA8wAAAPMAAAC3AAAAJwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAFAAAAAAAAD4QQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA888AUPPPAFDwD///+B8AAA==' },
      allegro: { name: 'Allegro', url: 'https://allegro.pl/listing?string=', icon: 'data:image/x-icon;base64,AAABAAEAMDAAAAEAIACoJQAAFgAAACgAAAAwAAAAYAAAAAEAIAAAAAAAACQAABMLAAATCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWP8aAFv/cABb/6YAWv/ZAFr/7gBa//AAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//kAWv9jAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFv/NQBa/7UAWv/8AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABd/wsAWv+cAFr//QBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFX/BgBa/7YAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFr/pwBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWf9CAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWv/LAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr/2wBa/40AWv9pAFr/ZgBa/2YAWv9mAFr/ZgBa/2YAWv9mAFr/ZgBa/2YAWv9mAFn/ZwBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABY/yAAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//UAWv9jAID/AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABZ/2oAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//QBa/0EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABZ/4YAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr/qgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABb/5UAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFv/awAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABa/5cAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFv/aAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABa/4UAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr/ngAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABb/18AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr/9QBY/xoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABX/yMAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa/8MAYv8NAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWv/GAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv/VAFr/SgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW/9MAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa/+MAWv+hAFv/gQBa/24AWv9mAFr/ZgBa/2YAWv9mAFr/ZgBa/2YAWv9mAFn/ZwBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFr/pwBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF3/CwBa/8YAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABd/wsAW/+pAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFv/VwBa/94AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABV/wMAXP9OAFv/tABa//sAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABV/wwAW/9GAFr/gABb/6YAWv/GAFr/2gBa/90AWv/dAFr/3QBa/90AWv/dAFr/3QBa/90AWv/dAFr/3QBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAED/BABa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AW/+BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFz/GQBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv9xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFz/TgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWP9LAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFr/XgBa/6cAXf8sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8BAFr/uwBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AXf8WAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFv/yABa//8AWv/8AFr/ngBd/ywAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWf91AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa/94AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFr/1wBa//8AWv//AFr//wBa//8AWf/CAFr/bgBX/yMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFr/HwBa/5sAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa/4UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFv/5wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv/rAFr/uwBZ/6AAWv+NAFr/lABa/6QAWf/QAFr//QBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//ABe/x4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFr/9wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFn/oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYP8IAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv/jAFX/FQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZv8FAFr/2QBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa/+kAWv8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGb/BQBa/2MAWv/dAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr/wABd/yEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZv8FAFr/UgBa/6gAWv/0AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//QBa/7sAW/9MAAD/AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZv8KAFr/RwBa/3oAWv+sAFn/0wBa/+IAWv/yAFr/+wBa/+kAWv/XAFr/wQBZ/4wAW/9RAFn/FwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////8AAP///////wAA////////AAD///////8AAP///////wAA////////AAD//gAAAP8AAP/4AAAA/wAA/+AAAAD/AAD/wAAAAP8AAP/AAAAA/wAA/4AAAAD/AAD/gAAAAP8AAP8AD/4A/wAA/wA//gD/AAD/AH/+AP8AAP8Af/4A/wAA/wB//gD/AAD/AH/+AP8AAP8AP/4A/wAA/wAf/gD/AAD/gA/+AP8AAP+AAAAA/wAA/8AAAAD/AAD/wAAAAP8AAP/gAAAA/wAA//gAAAD/AAD//AAAAP8AAP//gAAA/wAA/////gD/AAD////+AP8AAP////4A/wAA//j//AD/AAD/+D/8Af8AAP/4B/AB/wAA//gAAAH/AAD/+AAAA/8AAP/wAAAD/wAA//AAAAf/AAD/+AAAD/8AAP/+AAAf/wAA///AAP//AAD///////8AAP///////wAA////////AAD///////8AAP///////wAA////////AAA=' },
      olx: { name: 'OLX', url: 'https://www.olx.pl/oferty/q-', icon: 'data:image/x-icon;base64,AAABAAIAEBAAAAEAIABoBAAAJgAAACAgAAABACAAqBAAAI4EAAAoAAAAEAAAACAAAAABACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////AP///wD///8A////AP///zD///+W////1v////L////y////1v///5r///8y////AP///wD///8A////AP///wD///8A////CP///5T//////////////////////////////////////////////5j///8K////AP///wD///8A////Bv///8D/////////////////////////////////////////////////////////yP///wj///8A////AP///5T///////////////////////////////////////////////////////////////////+c////AP///yz///////////Xt8f////////////////////////////X4/v/x9v7//////+vx/f+uyfr/6/L9/////zT///+U8+ru/5dDaP+OL1r/lkFn//Lo7f////////////////92pPb/WZL0//////9imPX/EWLv/52/+P////+c////1KZbff+pYoL//////6tmhf+kWHr/5/bz/8Tp4P/F6eH/fq/s/xdn8f+ZvPj/JG/x/06L9P//////////3Pz6+/KGIU//2LjH///////au8n/lSRV/23LtP8lr47/IK2M/4zXu/96pfj/JXDx/ytz8f/i7P3///////////T9/PzyhyRR/9Wywv//////17bF/5YnWP930Lr/U8Cm//T7+f/7/f3/0uH8/x5r8P9Uj/T////////////////0////1LR1kv+aSGz/8ebr/5xLb/+7dpX/e9TC/1XBp////////////1aQ9P9WkPT/Pn3y/6TD+f//////////3P///5T79/n/sHKM/4wtWf+vcIr/+vb4/2/JtP9Sv6b//////+fv/f8lbPD/4uz9/+Tt/f8tbfD/7PP9/////5z///8q//////////////////////////+j3c//itPB////////////////////////////9vn+//39//////8y////AP///5L///////////////////////////////////////////////////////////////////+a////AP///wD///8E////vv/////////////////////////////////////////////////////////E////CP///wD///8A////AP///wb///+S//////////////////////////////////////////////+W////CP///wD///8A////AP///wD///8A////AP///y7///+U////1P////L////0////1v///5j///8w////AP///wD///8A////APgfAADgBwAAwAMAAIABAACAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAEAAIABAADAAwAA4AcAAPgfAAAoAAAAIAAAAEAAAAABACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///xD///9Y////lP///8L////c////6v///+r////c////xP///5j///9c////Fv///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///yb///+W////8P/////////////////////////////////////////////////////////0////nP///yz///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///+E/////////////////////////////////////////////////////////////////////////////////////////4z///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8a////yP///////////////////////////////////////////////////////////////////////////////////////////////////9L///8i////AP///wD///8A////AP///wD///8A////AP///wD///8A////JP///+r///////////////////////////////////////////////////////////////////////////////////////////////////////////////T///8w////AP///wD///8A////AP///wD///8A////AP///xL////u//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////j///8e////AP///wD///8A////AP///wD///8A////0P///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////97///8A////AP///wD///8A////AP///37//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////5D///8A////AP///wD///8W/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////yL///8A////AP///5b/////////////////////7N3k/+zc4////////////////////////////////////////////////////////////9nm/P/I2/z//////////////////////6/K+v9AgfP/eqf3/7fQ+v/5+///////qP///wD///8I////9v//////////27zK/5xKb/98D0H/fA5A/5tIbv/YuMf////////////////////////////////////////////7/P//OX3y/wZb7//w9f7////////////u9P7/G2rw/wZc7/8AVe7/DF/w/+jw/f//////////Ev///1D//////////9Grvf94Bzv/cAAv/59QdP+hUnb/cQAx/3cFOf/Oprj//////////////////////////////////////6LB+f8CWe//C1/v/2OZ9f///////////3yp9/8GXO//OX3y/wZb7/+Er/f//v////////////9g////kv/////t3uX/ghlJ/3UBNv+ua4n///////////+xcI3/dQI2/4AWRv/m197/////////////////////////////////y9P//wVZ8v8pdPD/Blzv/8rc+//7/P//GGfw/y528v8TZPD/QoPz/////////////////////6L////A/////7Z4lf9zADT/jCxX//jz9f////////////v4+f+OMFv/cgAz/7p2lP/+////o97Q/4TSwP+P1sX/kNbF/4bTwf+06sz/dqjz/w5e9f8ibvH/RoXz/1uT9f8fbPH/LHXy/xBi8P/W5P3/////////////////////zv///97+/v7/m0Zt/3UCN/+rZYX//////////////////////69ti/91ATb/uU56/8nq4/8NsIn/EqiF/xWphv8MpoL/AqJ8/xCte//y/+j/hKX//wpe7/8ncfH/HWvx/zp+8v8EWu//jrX4///////////////////////////k////7Pbv8/+SN2H/dwU5/7p/mv//////////////////////vISe/3gHOv+vPGz/s8/K/yzDnf86t5n/NbWX/z64nP81tZf/NrSZ//r/8f//////XJT1/x9s8f8yePL/HWrx/1KN9P////////////////////////////////D////s+fT2/5M6Y/92BDj/tnqV//////////////////////+6gJv/dwU5/7A/bv+61dD/L8Kd/xqrif+B0b7/6/j1/+n39P/z+vn//f7////////X5fz/EWPw/y118v8MX/D/zd78////////////////////////////////8P///97/////oVN2/3QANf+hU3f//////////////////////6Zbff90ADT/v1uF/8v06v8otpT/EKiE/6Pdz////////////////////////////3Oj9v8XZ/D/I27x/w9i8P9qnfb////////////////////////////////k////wP/////JnLD/dAA1/4IZSf/iy9X////////////m0dv/gxtL/3MANP/oo77/2f///yOtjv8UqYb/l9nJ///////////////////////X5Pz/GGfw/x5r8f8/gfP/NHny/wBQ7v+hwvn//////////////////////////87///+Q//////z5+v+YQWn/bgAs/5Y/Z//jzNf/5M7Y/5lDav9uACz/lTxl///8///N9+7/I62O/xSphv+X2cn//////////////////////2md9f8BWO//GGfw/+bv/f/H2vv/AFLu/xBh7//i7P3/////////////////////oP///1D//////////+/i6P+VPGX/bQAq/3UCN/92Azj/bAAp/5M5Yv/t3uX//////8Hn3f8jro7/FKmG/5XYyP/////////////////J3Pv/AFbu/wBN7f+NtPj///////////+TuPj/AEDs/zt/8v/x9v7///////////////9g////CP////b///////////z6+//Ekqn/pFh7/6RXev/CkKf/+/f5////////////vebd/x6si/8SqIX/j9bF/////////////////9Xk/P8wd/L/ZJn1//////////////////////95p/b/AFDu/8TY+////////////////xD///8A////lP/////////////////////////////////////////////////////K6+P/DKaC/wCcdP+V2Mj////////////////////////////////////////////////////////////e6f3/9/r///////////+m////AP///wD///8U//////////////////////////////////////////////////////3+/v+65tv/p9/S/+759v///////////////////////////////////////////////////////////////////////////////yD///8A////AP///wD///98//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+O////AP///wD///8A////AP///wD////O////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////2v///wD///8A////AP///wD///8A////AP///xD////s//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////T///8a////AP///wD///8A////AP///wD///8A////AP///yD////o///////////////////////////////////////////////////////////////////////////////////////////////////////////////y////LP///wD///8A////AP///wD///8A////AP///wD///8A////AP///xb////E////////////////////////////////////////////////////////////////////////////////////////////////////zv///yD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///+A/////P///////////////////////////////////////////////////////////////////////////////////4j///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8i////kv///+z/////////////////////////////////////////////////////////8P///5j///8o////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////Dv///1T///+Q////wP///97////u////7v///+D////C////lP///1r///8S////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP/wD///gAH//gAAf/wAAD/4AAAf8AAAD+AAAAfgAAADwAAAA4AAAAGAAAABgAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAYAAAAGAAAABwAAAA+AAAAPgAAAH8AAAD/gAAB/8AAA//gAAf/+AAf//8A//' },
      ggdeals: { name: 'GG.deals', url: 'https://gg.deals/games/?title=', icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAABZ1JREFUaAXtVwlQlVUU/niAiFkqto3pWCKL2kIZqUVDZuqk0+RkadaUiqThmDRirsQiioiiiGSGChoSboyZWpajBlrgOigoijo6LrilLA95PB68073P+V/v397K2Djz7sw//71n+c4959zlXA9Pvy6Eh7hpHuK5m6buduD/zqA7A+4MuBgB9xJyMYAuq7sz4HIIXQRwZ8DFALqs7nAGggN7YteWPGzPX48A/x4uT6BPcBB2F+SjIDcbPZ7t7jCeh73VaMcOHRA/MwZRE8bCy8vLZMhgMCBzdTaSUpehTqt1yLhfp05InD0dE8d9Bk9PT5NuU1MTlq9agwVp6aivv2cXnk0HNBqNyQg31tnPTxH09j93MHteMtblbVTkWxL5ZHkQeDA6dexoyTL3b966jRnxScjbXGCmqXXuh1KFOyj8TaQtSMDzvYJVJO6TS8tO4dDRY1ZlOHPIwHCGl4heQQFWZY+fLMOR46VWZcxMvoSkX8ArA+jnXbvJVqs8f4HeHzNWpi/FCw4No52/77EFRxVnz9Hwjz61iWeJL8vAwvi5iP4yEm3atDE7Ke3U1Wkxf0k6VmStBd8H1tripDhM+SIC3t7eqmI1tbWYl7oUK9esQ3Nzs6qcEkO2B5rvXFOSM9GMRiNy2DqPnZ8Cvu5tNT5p3Y1LqmItLS1Y82Me4pJTcedutaqcNYYsA2rCRX+XYNqceJSWlauJOETfV3TQhFdeccYhPamwXQ58HDEJW7fvlOqKxt27dUVLixFXq6pEdOmAR330+Ilge0zKEo35ndCo16Pq+g0RXTqweZGxnWd18u3a+SJp7kycKilExeEixM2YBl/ftlI75jHfM9Ym3779I0iOm4Py4j9RcegA5sREw8fHx6wv61juaN6XNrbuVU+FsVFT6VrVdakKXbl6jT6JjKK2T3WX8XQ6nSKeV+dnaMJX0+jGzVsynUuXrxDLmqIenHUgMytbZkhKKNm2g4zVNSJyY2Oj4kSy1uWK5JQGe/YXynRtLiEPDw9Z1jghelYsxk2OVlyjxouXURcRDf+v43E3dCgakpfDeE+niCMQJ8fMQuTUGPBbWK31f7WvjCVzgHkuE1IjbNi0FcGvhWHh0gywyIJY/cInWz1kFJr2HTSpaY0+iP/VDyFTvZG/Xw0J4HZ5KRIU+gYWZ6wEr4vsaZ4a30cTLAX5JpRG/fTZSvBPqRkMzdh/4C+0sDtiwJGTaMjKBVjfCA02PfEBpvRMQ/Fj/aDVa1BUBvTtpkd93XmcqTyvBMcmbsDewgPQsJrprbDXRTKcl5K+QkST7QG+aZUauweob/gQ2RoMHTiUDpYcNqsYjp2gotELqf+wc9R5JJm+xz8kisogun7XLEbsHqCQsEEyvAGDh1Px4aP/CVr0tNp6mbzdDnAcdoYTuznp6cAXqEvwS5SzIZ+UHOYx2LCXKGi8kd6ZSXTkrMUsLLqsbKBV2evpyZ59qGvvlyl34xZFPEHFLgcWpWeSXq8XdBT/tbV1xOohRZ5A5KdNSuoySsv8nth6FsiK/+qaGmL1vyJPIDY0NFBCyhLbGeDHKq9Gt+38TdB1+F/wyy7yD+lnNsar0R27/3AYR1DYvG07PfdiqBnP8uiXLSFL5uARo6jsdIWAY/N/ovwUvf3eSEVDHPfdkWPo9JlKmziCwLHSkxQ+bIQqHseUVaPiLQ7Y+yLjFeXa3J/YAWSUQojG9r7IYheksGN1k+l4FQFIBjYdEOT5m5gfsZMjx4nexN+tzjHV8s68iRNmxWDS+M9Fb+KMH/ibeDnYhhVMW/3b7YCAEhTgb3oW8khPj00Ee5UJLKf+vYMCsTQ5EQ06Hb75dh4uXLzkEI7DDjiE/gCEZaXEA7DZqibcDrRqOJ0Ac2fAiaC1qoo7A60aTifA3BlwImitquLOQKuG0wmwfwEkUJfqvaDeoAAAAABJRU5ErkJggg==' },
      iszop: { name: 'I-Szop', url: 'https://i-szop.pl/szukaj2/1/', icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAAXNSR0IArs4c6QAAAqNQTFRFDgkEFQ4AFxcMEhkSHBgPKRsTICAdIiIgKiUiKigXJyocLCoaLiwnLzAiNi4sNTktOjorPTkyQzwjREAzQ0U4TEpJV01ET09NYVZEX1dJZFlJZlpGYVxIaVpFZltFZ1xPa1xFYmBcbWFIaWRMbGVTbWdVcGdScWlcdWpMdmpbcmtedGxPe2pUc25ddm5ZeG9ZeG9bgG9jfHFjfnBodXNmfXNRf3RXe3VigHRlfnVhhHRmh3RnendxhXdkhHljhHhwhnhth3huiXpshnxlhXxtjHtoj3xojn1jiX5ogn91iH57gYB+jH9tjIFuiIJyh4J4joFui4NtkoFtkoNskoR1joV4i4eDiYmHkoh4l4d1kIl2mIdzlYh0mIh4lol0kop5mIpxmoptkIuHm4t0kI+LmJCMoZB3oZF9opJ6opN3pJN1mJWJopV7qZR6m5aSoJd6pph5p5h6oJqRqJuAqZuDpp2Eop6RnZ+frJ6Erp6Drp+BtJ+As6CBsqCHsKGDp6KWtKCHr6KGs6GJtaKDtqKBsaOGtqGMtqKEtaOHtaSEtKSHraaMtKSMs6WGuaOLraaatKaIuaWGuKeGuKeJuaeKuaeNu6eLrqyiwKuHsa6kv6ySva2aubCOwa2WtrKpv7OUxLGev7KpxLyvycGxxMK/z8/S2dDC4NfH3tfQ39vW4tvO49/S4d/c4eDY4+DW4+DZ5uLb5uTf6Obm6ujj6ejm6ujn7Orq6+vp8O7n8O7t8O/t8vLv8/Pu8vPx9fPw9fP39vTz/Pn3+/r2/Pv4+fz9//zz/fz5/Pz9/fz8/fz9+v3++/38/P36+/3+/P39/f38/f39/v37/f3+/v3+/v3///3+//3//v79///x/v7+/v7///79//7//v/+///9///+////q9zVfwAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfbCAIIEg/IDPn8AAABG0lEQVQY0wEQAe/+ANna0tLZ0NfPydDVrLzc09sA0eDg3eDg4ODg4G5YNODS1wC4f56t4KRkPElrGHFRxtTaAK6jqo8TKUaCgIiWYRK+3MsAsKKmGjhokoOHe45eXxXgzADAYhk9aXp0c3x+RN7g4EvWALMlPjpZp8WrfWbYFwYUDL8AmSM5SsFWBxFFm1onDghX4AClveB3AwoPEIEiAUwFFuDQAMchBAACCQ0LU00tGyyfTsgArzdDQkFAPzM7MVSGk5wksgCXLmBsZ2OFkHCNiZVbNkioAHJclISRRyAeJhyLeB2NbaEAqTKMaoqanaBdH3mYUjBPuQDO33ZVKi81KCt1b1BlseDEAMrN3sK6t7S0tba7y+Dew8+WuHySTaTv0gAAAABJRU5ErkJggg==' },
      getUrlWithQuery: (engine, query) => engine.url && ((engine.url.indexOf('$$') >= 0) ? engine.url.replace('$$', encodeURIComponent(query)) : engine.url + encodeURIComponent(query)),
      // getUrlWithQuery: (engine, query) => engine.url && query && (query = query.replace(/[:]+/g, '')) && ((engine.url.indexOf('$$') >= 0) ? engine.url.replace('$$', encodeURIComponent(query)) : engine.url + encodeURIComponent(query)),
    });
    const createSearchButton = (engine, query, { label, marginRight = 2, marginLeft = 0 } = {}) => {
      const searchLink = document.createElement('A');
      if (query instanceof Function) {
        searchLink.onclick = () => {
          const queryResult = query();
          if (queryResult) {
            searchLink.href = searchEngine.getUrlWithQuery(engine, queryResult);
            return true;
          }
          else {
            return false;
          }
        };
      } else {
        searchLink.href = searchEngine.getUrlWithQuery(engine, query);
      }
      searchLink.target = '_blank';
      searchLink.classList.add('subNavMenu-btn', `space--mr-${marginRight}`, `space--ml-${marginLeft}`);
      const wrapper = document.createElement('DIV');
      wrapper.classList.add('subNavMenu', 'subNavMenu--menu', 'tGrid-cell', 'vAlign--all-m', 'subNav-item');
      let nodeToAppend;
      if (isString(label) && (label = label.trim()).length > 0) {
        nodeToAppend = document.createTextNode(label);
      } else if (engine.icon) {
        nodeToAppend = document.createElement('IMG');
        nodeToAppend.src = engine.icon;
        nodeToAppend.alt = engine.name;
        // nodeToAppend.style.height = '24px';
        // wrapper.style.height = '42px';
        // searchLink.style.padding = '5px';
        nodeToAppend.style.height = '22px';
        wrapper.style.height = '40px';
        searchLink.style.height = '34px';
        searchLink.style.padding = '5px';
        searchLink.title = engine.name;
      } else {
        nodeToAppend = document.createTextNode(engine.name);
      }
      searchLink.appendChild(nodeToAppend);
      wrapper.appendChild(searchLink);
      return wrapper;
    };
    /*** END: Search Engines ***/

    /*** Search Page ***/
    if (pepperTweakerConfig.improvements.addSearchInterface && (location.pathname.indexOf('/search') >= 0) && (location.search.indexOf('q=') >= 0)) {
      const searchSubheadline = document.querySelector('h1.cept-nav-subheadline');
      if (searchSubheadline) {
        const searchQuery = `site:${location.host.replace('www.', '')} ${searchSubheadline.textContent.replace(/Szukaj |"/gi, '')}`;
        const subNavMenu = document.querySelector('.subNavMenu--menu');
        subNavMenu.parentNode.insertBefore(createSearchButton(searchEngine.google, searchQuery, { label: 'Szukaj przez Google' }), subNavMenu);
      }
    }
    /*** END: Search Page ***/

    const DEFAULT_NOTIFICATION_SOUND = new Audio('data:audio/mp3;base64,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bIckFua2x/PXG9Wzjds03FjQZJc4zjOM4///x///q1bSyQoMkskskOAJTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7ksTsA5lODPADGTICysFTCDM+uVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=');

    class BlinkingPageTitle {
      // #running = false;  // not implemented in FF yet (only experimental, set to false as default :/)
      constructor({ playSound = false, stopOnFocus = true, delay = 1100, soundSource = DEFAULT_NOTIFICATION_SOUND } = {}) {
        if (BlinkingPageTitle._instance) {
          throw new Error(`${this.constructor.name}: Only one instance of the class is allowed`);
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
                this.errorCallback(this, error);
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
      const confirmButton = createLabeledButton({
        label: 'Potwierdź', className: 'success', callback: () => {
          if (confirmCallback instanceof Function) {
            confirmCallback();
          }
          modalSection.remove();
        }
      });
      confirmButton.classList.add('space--h-2');
      const cancelButton = createLabeledButton({
        label: 'Anuluj', className: 'error', callback: () => {
          if (cancelCallback instanceof Function) {
            cancelCallback();
          }
          modalSection.remove();
        }
      });
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

    /* Prevent Cropping Image Height in Lightbox */
    const lightboxPopoverObserver = new MutationObserver((allMutations, observer) => {
      allMutations.every((mutation) => {
        for (const addedNode of mutation.addedNodes) {
          if (addedNode.classList && addedNode.classList.contains('popover--lightbox')) {
            const heightPopoverObserver = new MutationObserver((allMutations, observer) => {
              allMutations.every((mutation) => {
                const imgHeight = mutation.target.querySelector('img').height;
                mutation.target.style.height = `${imgHeight}px`;
              });
            });
            heightPopoverObserver.observe(addedNode, { attributes: true });
            return false;  // break every()
          }
        }
      });
    });
    lightboxPopoverObserver.observe(document.body, { childList: true });

    /*** Profile Page ***/
    if (pepperTweakerConfig.improvements.addCommentPreviewOnProfilePage
      && pepperTweakerConfig.pluginEnabled && location.pathname.match(/\/profile\//)) {
      
      /* Remove 'Escape' Key Binding at Message Page */
      if (location.pathname.match(/\/messages\//)) {
        document.addEventListener('keyup', (event) => {
          if (event.key.match(/Esc|Escape/i)) {  // IE/Edge use 'Esc'
            event.stopPropagation();
          }
        }, true);
      }

      /* Add Comment Preview on Profile Page */
      const commentPermalinks = document.querySelectorAll('a[href*="/comments/permalink/"]');
      for (const commentPermalink of commentPermalinks) {
        fetch(commentPermalink.href)
          .then(response => {
            if (response.ok) {
              return response.text();
            }
            throw new Error(`fetch() resulted with status ${response.status} for url: ${commentPermalink.href}`);
          })
          .then(text => {
            const splitedPermalink = commentPermalink.href.split('/');
            const commentID = splitedPermalink[splitedPermalink.length - 1];
            let htmlDoc = (new DOMParser()).parseFromString(text, 'text/html');
            const remoteCommentBody = htmlDoc.documentElement.querySelector(`article[id="comment-${commentID}"] .comment-body`);
            if (remoteCommentBody) {
              const newCommentBody = document.createElement('DIV');
              newCommentBody.classList.add('width--all-12');
              newCommentBody.style.padding = '15px 5px 0 5px';
              moveAllChildren(remoteCommentBody, newCommentBody);
              commentPermalink.parentNode.appendChild(newCommentBody);
            }
          })
          .catch(error => console.error(error));
      }
    }

    /*** Deal Details Page ***/
    if (pepperTweakerConfig.pluginEnabled && location.pathname.match(/promocje|kupony|dyskusji|feedback/) && location.pathname.match(/-\d+\/?$/)) {  // ends with ID

      /* Comment Filtering */
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
        setTimeout(function () { event.target.style.borderBottomWidth = '1px'; }, animationDuration);
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

      const filterComments = (node) => {
        const comments = node.querySelectorAll('.commentList-comment');
        for (const comment of comments) {
          for (const filter of pepperTweakerConfig.commentsFilters) {
            //if (Object.keys(filter).length === 0) continue;  // if the filter is empty => continue (otherwise empty filter will remove all elements!)
            if ((filter.active === false) || !filter.keyword && !filter.user) {
              continue;
            }
  
            let commentAuthor = comment.querySelector('.comment-header a.user');
            commentAuthor = commentAuthor && commentAuthor.textContent;
  
            if ((!filter.user || commentAuthor && commentAuthor.match(newRegExp(filter.user, 'i')))
              && (!filter.keyword || comment.innerHTML.match(newRegExp(filter.keyword, 'i')))) {  // innerHTML here for emoticon match too (e.g. <i class="emoji emoji--type-poo" title="(poo)"></i>)
  
              if (filter.style.display === 'none') {
                comment.insertBefore(createHiddenCommentBar(hideCommentMessage, showCommentOnClick), comment.firstChild);
              }
              Object.assign(comment.style, filter.style);
              break;  // comment style has been applied => stop checking next filters
            }
          }
        }
      }

      /* Add Profile Info */
      const toggleUnderline = event => event.target.style.textDecoration = (event.target.style.textDecoration !== 'underline') ? 'underline' : 'none';

      const addProfileInfo = element => {  // this function is used in comments addition too
        // const profileLinks = element.querySelectorAll('.cept-thread-main a[href*="/profile/"], .comment-header a[href*="/profile/"]');
        const profileLinks = element.querySelectorAll('.cept-thread-main a[href*="/profile/"], .comment-header a.user');
        for (const profileLink of profileLinks) {
          const profileLinkHref = profileLink.href || `${location.protocol}//${location.hostname}/profile/${profileLink.textContent}`;
          if (profileLinkHref) {
            fetch(profileLinkHref)
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

                /* Add Permalink to Comment Date */
                const commentDateParent = profileLinkParent.nextSibling;
                if (!commentDateParent) return;
                const commentDateElement = commentDateParent.querySelector('time');
                const articleElement = profileLinkParent.closest('article[id^="comment-"]');
                if (articleElement && articleElement.id) {
                  const commentID = articleElement.id.split('-')[1];
                  const commentDateLink = document.createElement('A');
                  const permalinkAddress = `https://www.pepper.pl/comments/permalink/${commentID}`;
                  commentDateLink.href = permalinkAddress;
                  commentDateLink.target = '_blank';
                  commentDateLink.addEventListener('mouseenter', toggleUnderline);
                  commentDateLink.addEventListener('mouseleave', toggleUnderline);
                  commentDateLink.appendChild(commentDateElement);
                  commentDateParent.insertBefore(commentDateLink, commentDateParent.firstChild);

                  /* Change Premalink Button to an Anchor */
                  const permalinkButton = articleElement.querySelector('button[data-popover*="permalink"]');
                  if (permalinkButton) {
                    const permalinkAnchor = document.createElement('A');
                    moveAllChildren(permalinkButton, permalinkAnchor);
                    cloneAttributes(permalinkButton, permalinkAnchor);
                    permalinkAnchor.removeAttribute('data-handler');
                    permalinkAnchor.href = permalinkAddress;
                    permalinkAnchor.target = '_blank';
                    permalinkButton.parentNode.replaceChild(permalinkAnchor, permalinkButton);
                  }
                }
              })
              .catch(error => console.error(error));
          }
        }
      };
      addProfileInfo(document);

      /* Add calendar option */
      if (location.pathname.match(/(promocje|kupony)\//)) {
        const dateToGoogleCalendarFormat = date => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const extractDealDateFromString = (str, time) => {
          if (!str) {
            return new Date();
          }
          let dateResult;
          const dateString = str.match(/\d+\/\d+\/\d+/);  // date in the format: 15/12/2019
          if (dateString) {
            const parts = dateString[0].split('/');
            dateResult = new Date(parts[2], parts[1] - 1, parts[0]);
          } else if (str.match(/jutro/i)) {
            dateResult = new Date();
            dateResult.setDate(dateResult.getDate() + 1);
            // } else if (str.match(/dzisiaj/i)) {
          } else {
            dateResult = new Date();
          }
          if (time) {
            time = time.split(':');
            dateResult.setHours(time[0], time[1], 0);
          }
          return dateResult;
        };
        const extractDealDates = () => {
          // const dateSpans = document.querySelectorAll('.cept-thread-content .border--color-borderGrey.bRad--a span');
          let start = document.querySelector('.cept-thread-content .border--color-borderGrey .icon--clock.text--color-green');
          start = extractDealDateFromString(start && start.parentNode.parentNode.textContent, '00:01');
          let end = document.querySelector('.cept-thread-content .border--color-borderGrey .icon--hourglass');
          end = extractDealDateFromString(end && end.parentNode.parentNode.textContent, '23:59');
          if (start >= end) {
            end.setTime(start.getTime());
            end.setDate(start.getDate() + 1);
          }
          return { start, end };
        };
        let dealTitle = document.querySelector('.thread-title--item');
        dealTitle = dealTitle && encodeURIComponent(dealTitle.textContent.trim());
        let dealDescription = document.querySelector('.cept-description-container');
        dealDescription = dealDescription && encodeURIComponent(`${location.href}<br><br>${dealDescription.innerHTML.trim()}`);
        let dealMerchant = document.querySelector('.cept-merchant-name');
        dealMerchant = dealMerchant && encodeURIComponent(dealMerchant.textContent.trim());
        const dealDates = extractDealDates();

        const timeFrameBox = document.querySelector('.cept-thread-content div div.border');
        const calendarOptionLink = document.createElement('A');
        // calendarOptionLink.classList.add('btn', 'space--h-3', 'btn--mode-secondary');
        calendarOptionLink.classList.add('thread-userOptionLink');
        calendarOptionLink.style.cssFloat = 'right';
        calendarOptionLink.style.fontWeight = '900';
        calendarOptionLink.style.setProperty('margin-right', '7px', 'important');
        calendarOptionLink.target = '_blank';
        calendarOptionLink.href = `https://www.google.com/calendar/render?action=TEMPLATE&text=${dealTitle}&details=${dealDescription}&location=${dealMerchant}&dates=${dateToGoogleCalendarFormat(dealDates.start)}%2F${dateToGoogleCalendarFormat(dealDates.end)}`;
        const calendarOptionImg = document.createElement('IMG');
        calendarOptionImg.style.width = '18px';
        calendarOptionImg.style.height = '20px';
        calendarOptionImg.style.filter = `invert(${pepperTweakerConfig.darkThemeEnabled ? 77 : 28}%)`;
        calendarOptionImg.style.verticalAlign = 'middle';
        calendarOptionImg.classList.add('icon', 'space--mr-2');
        calendarOptionImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAABmJLR0QA/wD/AP+gvaeTAAABAklEQVRIid2WPQ6CMBSAPwx6CokH8Aj+DCYeQTdu4ClcrBdxdtLFGI16FPECJi4mOFDJi4FSlDL4koYC3+vXEtI+yI8LcDK8/5VPI9atEr4BtIAlEBnguKDl8VdAaQcqJzGrbxKZeOUDYcaM2sBZQ0HWpyjJh3mz3ejkANharKiQ98RynUajDkmtIl/0PUeOGP7x09mKTL/2o0qRKe42kF+MADD9uB8CM91f2c6o7C4NyXHwzuvajl9WNBY5ewv+a9FR5ExciUaCvwFNV6KD4OeWOaVFPcE+gY4r0U6wa0tJOr48j5xvqpF+0HcgGehrBNnFSdVtAUkppEhKo6oFabn1Ajsht5QbUQgDAAAAAElFTkSuQmCC';
        calendarOptionLink.appendChild(calendarOptionImg);
        const calendarOptionSpan = document.createElement('SPAN');
        calendarOptionSpan.classList.add('space--t-1');
        calendarOptionSpan.appendChild(document.createTextNode('Kalendarz'))
        calendarOptionLink.appendChild(calendarOptionSpan);
        timeFrameBox.appendChild(calendarOptionLink);
      }

      /* Repair Deal Details Links */  // and comment links
      const repairDealDetailsLinks = (node) => {
        if (pepperTweakerConfig.improvements.repairDealDetailsLinks) {
          const links = node.querySelectorAll('a[title^="http"]');
          const mobileLinkRegExp = /:\/\/(www\.)?m\./i;
          for (const link of links) {
            link.href = link.title.replace(mobileLinkRegExp, '://');  // remove also the part of a mobile link e.g.: m.
          }
        }
      }

      /* Repair Thread Image Link */  // -> to open an image in the box, not a deal in new tab
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

        const dealImageLink = document.querySelector('*[id^="thread"] .cept-thread-image-clickout');
        replaceClickoutLinkWithPopupImage(dealImageLink);
      }

      /* Add Like Buttons to Best Comments */
      const addLikeButtonsToBestComments = () => {
        return;
        if (pepperTweakerConfig.improvements.addLikeButtonsToBestComments) {
          let firstLikeButtonNotBlue = document.querySelector('.comment-footer .icon--thumb-up');
          firstLikeButtonNotBlue = firstLikeButtonNotBlue && firstLikeButtonNotBlue.closest('button');
          if (firstLikeButtonNotBlue) {  // only if any like button exists
            const bestComments = document.querySelectorAll('#comments .commentList:not(.commentList--anchored) .commentList-item article.comment');
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
      }

      const layoutChangeObserver = new MutationObserver((allMutations, observer) => {
        allMutations.every((mutation) => {
          for (const addedNode of mutation.addedNodes) {
            if (addedNode.id?.match(/comment-\d+/)) {
              // if (addedNode.id === 'comments') {
              //   addLikeButtonsToBestComments();
              // }
              repairDealDetailsLinks(addedNode);
              addProfileInfo(addedNode);
              filterComments(addedNode);
            }
          }
          return true;
        });
      });
      layoutChangeObserver.observe(document.querySelector('.listLayout-main'), { childList: true, subtree: true });

      /* Add Search Interface */
      if (pepperTweakerConfig.improvements.addSearchInterface && location.pathname.match(/promocje|kupony|dyskusji\//)) {

        const getSelectionHTML = () => {
          let html = '';
          if (typeof window.getSelection !== 'undefined') {
            const selection = window.getSelection();
            if (selection.rangeCount) {
              const container = document.createElement('div');
              for (let i = 0, selectionRangeCount = selection.rangeCount; i < selectionRangeCount; i++) {
                container.appendChild(selection.getRangeAt(i).cloneContents());
              }
              html = container.innerHTML;
            }
          } else if (typeof document.selection !== 'undefined') {  // only for IE < 9
            if (document.selection.type === 'Text') {
              html = document.selection.createRange().htmlText;
            }
          }
          return html;
        };

        const getSelectionText = () => {
          let text = '';
          if (typeof window.getSelection !== 'undefined') {
            const selection = window.getSelection();
            if (selection.rangeCount) {
              for (let i = 0, selectionRangeCount = selection.rangeCount; i < selectionRangeCount; i++) {
                text += selection.getRangeAt(i).toString();
              }
            }
          } else if (typeof document.selection !== 'undefined') {  // only for IE < 9
            if (document.selection.type === 'Text') {
              text = document.selection.createRange().text;
            }
          }
          return text;
        };

        // const dealTitleSpan = document.querySelector('article .thread-title--item');
        // const dealTitleInput = createTextInput({ value: dealTitleSpan.textContent.trim() });
        // dealTitleSpan.replaceWith(dealTitleInput);
        const getActualSelectionValue = () => {
          // return dealTitleInput.querySelector('input').value.trim();
          const input = document.activeElement;
          let value = getSelectionText().trim() || (input && input.value && input.value.trim());
          if (value && value.length > 0) {
            return value;
          }
          alert('Najpierw zaznacz fragment tekstu na stronie do wyszukiwania');
          return null;
          // return (input.selectionStart < input.selectionEnd) ? value.substring(input.selectionStart, input.selectionEnd) : value;
        };

        const searchButtonsWrapper = document.createElement('DIV');
        searchButtonsWrapper.style.display = 'flex';
        searchButtonsWrapper.style.flexDirection = 'column';
        searchButtonsWrapper.style.position = 'fixed';
        searchButtonsWrapper.style.width = '42px';  // for setSearchInterfacePosition()
        searchButtonsWrapper.style.top = '50%';
        // searchButtonsWrapper.style.left = `55px`;
        searchButtonsWrapper.style.zIndex = 2002;
        searchButtonsWrapper.style.transform = 'translate(0, -50%)';
        searchButtonsWrapper.append(
          createSearchButton(searchEngine.google, getActualSelectionValue),
          createSearchButton(searchEngine.ceneo, getActualSelectionValue),
          createSearchButton(searchEngine.skapiec, getActualSelectionValue),
          createSearchButton(searchEngine.allegro, getActualSelectionValue),
          createSearchButton(searchEngine.olx, getActualSelectionValue),
          createSearchButton(searchEngine.amazonDe, getActualSelectionValue),
          createSearchButton(searchEngine.aliexpress, getActualSelectionValue),
          createSearchButton(searchEngine.banggood, getActualSelectionValue),
          createSearchButton(searchEngine.joybuy, getActualSelectionValue),
          createSearchButton(searchEngine.ebay, getActualSelectionValue),
          createSearchButton(searchEngine.ggdeals, getActualSelectionValue),
          createSearchButton(searchEngine.iszop, getActualSelectionValue)
          // createSearchButton(searchEngine.ggdeals, getActualSelectionValue, { marginRight: 0 })
        );

        const setSearchInterfacePosition = () => {
          // const searchButtonsWrapperWidth = parseInt(window.getComputedStyle(searchButtonsWrapper).width);
          const searchButtonsWrapperWidth = parseInt(searchButtonsWrapper.style.width);
          const threadArticle = document.querySelector('*[id^="thread"]');
          const threadArticleBoundingClientRect = threadArticle.getBoundingClientRect();
          if (threadArticleBoundingClientRect.left > searchButtonsWrapperWidth) {
            searchButtonsWrapper.style.left = `${threadArticleBoundingClientRect.left - searchButtonsWrapperWidth}px`;
            searchButtonsWrapper.style.opacity = '1';
            return;
          }
          if (threadArticleBoundingClientRect.right + searchButtonsWrapperWidth < getWindowSize().width - 5) {
            searchButtonsWrapper.style.left = `${threadArticleBoundingClientRect.right + 5}px`;
            searchButtonsWrapper.style.opacity = '1';
            return;
          }
          searchButtonsWrapper.style.left = `${threadArticleBoundingClientRect.right - searchButtonsWrapperWidth}px`;
          searchButtonsWrapper.style.opacity = '0.5';
        };
        setSearchInterfacePosition();
        document.body.appendChild(searchButtonsWrapper);  // must add before computing position to get computed width: https://stackoverflow.com/questions/2921428/dom-element-width-before-appended-to-dom
        window.addEventListener('resize', setSearchInterfacePosition);
        // const voteBox = document.querySelector('.cept-vote-box');
        // voteBox.parentNode.style.justifyContent = 'space-between';
        // voteBox.parentNode.style.width = '100%';
        // voteBox.parentNode.appendChild(searchButtonsWrapper);
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
        // errorCallback: observer => {
        //     if (confirm(`Wystąpił błąd podczas pobierania strony (status: ${observer.responseStatus}).\nCzy przerwać obserwowanie?`)) {
        //         observer.disconnect();
        //         autoUpdateCheckbox.querySelector('input').checked = false;
        //     }
        // },
      });

      const autoUpdateCheckbox = createLabeledCheckbox({
        label: 'Obserwuj', callback: event => {
          if (event.target.checked) {
            commentsObserver.observe();
          } else {
            commentsObserver.disconnect();
          }
        }
      });
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
    if (pepperTweakerConfig.pluginEnabled && ((location.pathname.length < 2) || location.pathname.match(/search|gor%C4%85ce|nowe|grupa|om%C3%B3wione|promocje|kupony[^\/]|dyskusji|profile/))) {

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
            && (!filter.priceBelow || (deal.price !== null && deal.price < filter.priceBelow))
            && (!filter.priceAbove || (deal.price !== null && deal.price > filter.priceAbove))
            && (!filter.discountBelow || (deal.discount !== null && deal.discount < filter.discountBelow))
            && (!filter.discountAbove || (deal.discount !== null && deal.discount > filter.discountAbove))) {
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
            delete Object.assign(styleToApply, { ['outline']: styleToApply['border'] })['border'];  // outline instead of border, TODO: it's to heaevy here
            Object.assign(element.style, styleToApply);
          }
        }
      };

      /* List to grid voucher button update */
      const updateGridDeal = (dealNode) => {
        // Voucher button update
        const buttonToMove = dealNode.querySelector('.threadGrid-body div div.width--fromW2-6:last-child');
        const threadGridFooterMeta = dealNode.querySelector('.footerMeta .iGrid-item');
        if (buttonToMove && threadGridFooterMeta) {
          const viewDealButton = threadGridFooterMeta.querySelector('.iGrid-item .btn');
          if (viewDealButton) {
            viewDealButton.remove();
          }
          threadGridFooterMeta.appendChild(buttonToMove);
          buttonToMove.style.width = '100%';
          buttonToMove.style.paddingRight = '0 !important';
          buttonToMove.parentNode.style.display = 'block';
        }
        // Deal refresh ribbon text
        const refreshRibbon = dealNode.querySelector('.cept-meta-ribbon .icon--refresh ~ span.hide--toW3');
        if (refreshRibbon) {
          refreshRibbon.textContent = refreshRibbon.textContent.replace(/Zaktualizowano|temu/ig, '');
        }
        // Number of comments in discussion
        const headerMetaIconComment = dealNode.querySelector('.threadGrid-headerMeta .icon--comment');
        if (headerMetaIconComment) {
          headerMetaIconComment.parentNode.lastChild.textContent = headerMetaIconComment.parentNode.lastChild.textContent.replace(/ Komentarz(y|e)?/, '');
        }
      }
      /* END */

      let dealCount = 0;
      const startPage = Number((new URLSearchParams(location.search)).get('page') || 1);
      const getVerticalScrollPercentage = (node) => (node.scrollTop || node.parentNode.scrollTop) / (node.parentNode.scrollHeight - node.parentNode.clientHeight ) * 100;
      const rescale = (v, rMin, rMax, tMin, tMax) => ((v - rMin) / (rMax - rMin)) * (tMax - tMin) + tMin;
      const updatePagination = () => {
        if (dealCount % 20 === 0) {
          const position = getVerticalScrollPercentage(document.body);
          const currentPage = startPage - 1 + Math.round(rescale((dealCount / 20) * (position / 100), 0, 10, 1, 10));

          const searchParams = new URLSearchParams(location.search);
          if (searchParams.get('page') != currentPage) {
            searchParams.set('page', currentPage);
            const newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
            history.replaceState(null, '', newRelativePathQuery);

            const pagination = document.getElementById('pagination');
            const paginationPageText = pagination.querySelector('.pagination-page .hide--toW2');
            if (paginationPageText) {
              paginationPageText.textContent = paginationPageText.textContent.replace(/\d+/, currentPage);
            }
            const nextButton = pagination.querySelector('.cept-next-page button');
            if (nextButton) {
              nextButton.dataset.pagination = nextButton.dataset.pagination.replace(/\d+/, currentPage + 1);
            }
          }
        }
      };
      document.addEventListener('scroll', updatePagination);

      const processElement = (element, deepSearch = false, isGridLayout = false) => {
        if ((element.nodeName === 'DIV') && element.classList.contains('threadCardLayout--card')) {
          element = element.querySelector('article[id^="thread"]');
        }
        if (element && (element.nodeName === 'ARTICLE') && element.id && (element.id.indexOf('thread') === 0)) {

          /* Thread Image to Lightbox */
          const threadImage = element.querySelector('.cept-thread-img');
          if (threadImage) {
            threadImage.dataset.handler = 'lightbox';
            threadImage.dataset.lightbox = `{"images":[{"width":640,"height":474,"unattached":"","uid":"","url":"${threadImage.src.replace('thread_large', 'thread_full_screen')}"}]}`;
          }
          /* END */

          /* List to grid update */
          if (pepperTweakerConfig.improvements.listToGrid && !isGridLayout) {
            updateGridDeal(element);
          }
          // Pagination
          dealCount++;
          /* END */

          // No deals filtering at search and profile pages (profile => alerts/saved etc.)
          if (location.pathname.match(/search|profile/)) return;

          let title = element.querySelector('.cept-tt');
          title = title && title.textContent;

          let description = element.querySelector('.cept-description-container');
          description = description && description.textContent;

          let merchant = element.querySelector('.cept-merchant-name');
          merchant = merchant && merchant.textContent;

          let user = element.querySelector('.thread-username');
          user = user && user.textContent;

          let priceOrDiscount = element.querySelector('.cept-tp');
          let price, discount;
          if (priceOrDiscount) {
            let priceOrDiscountText = priceOrDiscount.textContent;

            if (priceOrDiscountText === 'ZA DARMO') {
              price = 0;
            } else if(priceOrDiscountText.includes('%')) {
              discount = parseInt(priceOrDiscountText.replace(/[-%]/, ''));
            } else {
              price = parseFloat(priceOrDiscountText.replace('.', '').replace(',', '.'));
            }

            if (!discount) {
              let nextBestPrice = element.querySelector('.cept-next-best-price');
              nextBestPrice = nextBestPrice && parseFloat(nextBestPrice.textContent.replace('.', '').replace(',', '.'));

              if (nextBestPrice) {
                discount = (nextBestPrice - price) / nextBestPrice * 100;
              }
            }
          }

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
                const groupLinks = htmlDoc.documentElement.querySelectorAll('.overflow--ellipsis a[href*="/grupa/"]');
                const groups = [];
                for (const groupLink of groupLinks) {
                  groups.push(groupLink.textContent);
                }

                const locationIcon = htmlDoc.documentElement.querySelector('*[id^="thread"] .cept-thread-content svg.icon--location');
                const local = locationIcon !== null && locationIcon.parentNode.parentNode.textContent.search(/Ogólnopolska/i) < 0;

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
      const dealsSection = document.querySelector(dealsSectionSelector = '#toc-target-deals .js-threadList') || document.querySelector(dealsSectionSelector = '#toc-target-deals') || document.querySelector(dealsSectionSelector = '.listLayout');
      // const dealsSection = document.querySelector(dealsSectionSelector = 'section.gridLayout') || document.querySelector(dealsSectionSelector = 'div.gridLayout') || document.querySelector(dealsSectionSelector = 'section.listLayout .js-threadList') || document.querySelector(dealsSectionSelector = 'div.listLayout');
      // cannot combine as one selector => div.gridLayout appears before section.gridLayout on the main page
      const isGridLayout = dealsSectionSelector.indexOf('gridLayout') >= 0;

      const deepSearch = pepperTweakerConfig.dealsFilters.findIndex(filter => (filter.active !== false) && (filter.groups || (filter.local === true))) >= 0;

      if (dealsSection) {

        /* Process already visible elements */
        for (let childNode of dealsSection.childNodes) {
          processElement(childNode, deepSearch, isGridLayout);
        }

        /* Set the observer to process elements on addition */
        const dealsSectionObserver = new MutationObserver(function (allMutations, observer) {
          allMutations.every(function (mutation) {
            for (const addedNode of mutation.addedNodes) {
              processElement(addedNode, deepSearch, isGridLayout);
            }
            return false;
          });
        });
        dealsSectionObserver.observe(dealsSection, { childList: true });
        /* END: Deals Filtering */

        /* List to Grid */
        if (pepperTweakerConfig.improvements.listToGrid && !isGridLayout) {
          const sideWidgets = document.querySelectorAll('.listLayout-side .listLayout-box');
          const sideWidgetsWidth = Array.from(sideWidgets).map((widget) => parseFloat(window.getComputedStyle(widget).width));
          const sideContainerWidth = sideWidgetsWidth.reduce((acc, cur) => acc || (isNumeric(cur) && cur > 0), false) ? 234 : 0;
          const sideContainerPadding = 8;
          const columnWidth = 227;
          const gridGapWidth = 10;
          const gridPadding = 10;
          dealsSection.style.display = 'grid';
          dealsSection.style.gridGap = `${gridGapWidth}px`;
          dealsSection.style.gridAutoRows = 'min-content';
          const updateGridView = () => {
            const windowSize = getWindowSize();
            const gridMaxWidth = windowSize.width - sideContainerWidth - 2 * sideContainerPadding - 2 * gridPadding;
            const gridColumnCount = Math.min(pepperTweakerConfig.improvements.gridColumnCount || Infinity, Math.floor(gridMaxWidth / (columnWidth + gridGapWidth)));
            const gridMarginLeft = Math.floor((gridMaxWidth - gridColumnCount * (columnWidth + gridGapWidth)) / 2);
            dealsSection.style.gridTemplateColumns = `repeat(${gridColumnCount}, ${columnWidth}px)`;
            dealsSection.style.setProperty('margin-left', `${gridMarginLeft}px`, 'important');
          }
          updateGridView();
          window.addEventListener('resize', updateGridView);

          const styleNode = document.createElement('style');
          const styleText = document.createTextNode(`
            .listLayout-box.bg--color-brandPrimaryPale {
              grid-column: 1 / -1;
            }
            .threadGrid-headerMeta {
              grid-column: 1;
              grid-row: 1;
              -ms-grid-row-span: 1;
              width: 196px !important;
            }
            .cept-meta-ribbon .icon--clock.text--color-green, .cept-meta-ribbon .icon--clock.text--color-green ~ span[class^="hide--"],  /* deal starts */
            .cept-meta-ribbon .icon--hourglass, .cept-meta-ribbon .icon--hourglass ~ span[class^="hide--"],  /* deal ends */
            .cept-meta-ribbon .icon--location, .cept-meta-ribbon .icon--location ~ span[class^="hide--"],    /* local deal */
            .cept-meta-ribbon .icon--world, .cept-meta-ribbon .icon--world ~ span[class^="hide--"],          /* delievery */
            .cept-vote-box .cept-show-expired-threads,  /* deal ended text */
            .cept-vote-box span[class^="hide--"] {  /* Discussion ended text */
              display: none;
            }
            .cept-meta-ribbon .icon--refresh {
              margin-right: .35em !important;
            }
            .cept-vote-box button[data-track*="vote"] {  /* smaller vote box */
              padding-left: .28em !important;
              padding-right: .28em !important;
            }
            .threadGrid-image {
              grid-row-start: 2;
              grid-row-end: 4;
              -ms-grid-row-span: 3;
              grid-column: 1;
              width: 196px !important;
              padding: 0.35em 0 0.65em 0 !important;
            }
            .thread-listImgCell, .thread-listImgCell--medium {
              width: 100%;
            }
            .threadGrid-title {
              grid-column: 1;
              grid-row-start: 5;
              grid-row-end: 6;
              width: 196px !important;
            }
            .threadGrid-title .thread-title {
              padding-top: 0.2em;
              height: 3.3em;
            }
            .threadGrid-title .overflow--fade {
              height: 1.9em;
            }
            .threadGrid-body {
              grid-column: 1;
              -ms-grid-column-span: 1;
              grid-row: 7;
              padding-top: .28571em !important;
              height: 3.7em;
              text-overflow: ellipsis;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
            }
            .threadGrid-title .userHtml-content {  /* Discussion description */
              height: 6.2em;
              margin-bottom: 0.5em;
              text-overflow: ellipsis;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 4;
              -webkit-box-orient: vertical;
            }
            .threadGrid-body.threadGrid--row--collapsed {
              display: none;
            }
            .threadGrid-body .flex--dir-row-reverse {
              flex-direction: column;
            }
            .threadGrid-body .space--t-2 {
              padding-top: 0 !important;
            }
            .threadGrid-body .thread-updates-top,
            .threadGrid-body .voucher {
              display: none;
            }
            .threadGrid-body .width--fromW2-6 {
              width: 100%;
              padding: 0 !important;
              margin: 5px;
            }
            .threadGrid-body .cept-threadUpdate,
            .threadGrid-body .flex--dir-row-reverse {
              display: none;
            }
            .threadGrid-footerMeta {
              grid-column: 1;
              -ms-grid-column-span: 1;
              grid-row: 8;
              width: 196px !important;
              padding-top: 0.5em !important;
            }
            .threadGrid-footerMeta .footerMeta.fGrid {
              flex-flow: row wrap;
            }
            .threadGrid-footerMeta .iGrid-item {
              margin: 13px 0;
              padding: 0 !important;
              width: 100%;
            }
            .threadGrid-footerMeta .iGrid-item .space--fromW2-r-1 {
              padding-right: 0 !important;
            }
            .threadGrid-footerMeta .cept-flag-mobile-source {
              display: none;
            }
            #toc-target-deals div.thread {
              display: none !important;
            }
            .threadGrid-footerMeta .cept-off {
              display: none;
            }
            #toc-target-deals .listLayout-side {
              position: absolute !important;
              right: 0;
              top: 0;
            }
            #toc-target-deals .listLayout-side > div, .card--type-vertical {
              min-height: 500px;
              max-height: 500px;
            }
            .footerMeta .iGrid-item.width--all-12.width--fromW3-auto.space--l-0.space--fromW3-l-2.space--t-2.space--fromW3-t-0.hide--empty {
              display: none;
            }
            .js-pagi-top {  /* hidding top pagination */
              display: none;
            }
            .listLayout, .tGrid-row.height--all-full .page-content {
              position: static;
              max-width: none;
            }
            .tabbedInterface-tabs.width--max-listLayoutWidth, .cept-hottest-widget-position-top {
              width: 85.4em;
              margin-left: auto;
              margin-right: auto;
            }
            .listLayout-main {
              width: max-content;
            }
            .listLayout-side {
              width: ${sideContainerWidth}px;
              padding: 0 ${sideContainerPadding}px;
            }
            .thread .threadGrid {
              padding-bottom: 0;  /* removes padding that appears at the bootm of outline from filters */
            }
            /* Font Size */
            .cept-description-container {
              font-size: 0.75rem !important;
              line-height: 1rem !important;
            }
            .thread-title--list {
              font-size: 0.875rem !important;
              line-height: 1.25rem !important;
            }
            /* END: Font Size */
            .thread-title--list::after {
              top: 20px;
            }
            .size--all-l {
              font-size: 1rem !important;
              line-height: 1.5rem !important;
            }
            .listLayout-main > div:empty {
              display: none;
            }
          `);
          styleNode.appendChild(styleText);
          document.head.appendChild(styleNode);
        }
        /* END: List to Grid */

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
          // errorCallback: (observer, error) => {
          //     if (observer.responseStatus !== 200) {
          //         if (confirm(`Wystąpił błąd podczas pobierania strony (status: ${observer.responseStatus}).\nCzy przerwać obserwowanie?`)) {
          //             observer.disconnect();
          //             autoUpdateCheckbox.querySelector('input').checked = false;
          //         }
          //     }
          // },
        });

        const autoUpdateCheckbox = createLabeledCheckbox({
          label: 'Obserwuj', callback: event => {
            if (event.target.checked) {
              newDealsObserver.observe();
            } else {
              newDealsObserver.disconnect();
            }
          }
        });
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

  if (isOperaBrowser) {
    window.addEventListener('load', startPepperTweaker);
  } else {
    document.addEventListener('DOMContentLoaded', startPepperTweaker);
  }

  /***** END: RUN AFTER DOCUMENT HAS BEEN LOADED *****/

})();
