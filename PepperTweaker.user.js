// ==UserScript==
// @name         PepperTweaker
// @namespace    bearbyt3z
// @version      0.10.1
// @description  Pepper na resorach...
// @author       bearbyt3z
// @match        https://www.pepper.pl/*
// @run-at       document-start
// @grant        none
// @downloadURL  https://update.greasyfork.org/scripts/390341/PepperTweaker.user.js
// @updateURL    https://update.greasyfork.org/scripts/390341/PepperTweaker.meta.js
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
    restoreOriginalEmoticons: true,
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
        restoreOriginalEmoticons: isBoolean(configuration.improvements.restoreOriginalEmoticons) ? configuration.improvements.restoreOriginalEmoticons : pepperTweakerConfig.improvements.restoreOriginalEmoticons,
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
      || !isBoolean(outputConfig.improvements.restoreOriginalEmoticons)
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

  const orangeColor = '#f7641b';

  /* Theme independent style */
  const voteRedColor = '#e00034';
  const voteBlueColor = '#1f7ecb';

  css += `
    /* The override of the color variables used by Pepper */
    :root {
      /* hot deal temperature + hot badge icon */
      --temperature90: ${voteRedColor} !important;
      /* cold deal temperature */
      --temperature10: ${voteBlueColor} !important;
    }
    /* END */

    body {
      font-family: Arial;
    }

    /* Font Size */
    .userHtml {
      font-size: 0.925rem !important;
    }
    .size--fromW3-xxl, .thread-title--item, .userHtml--subtitles h3 {
      font-size: 1.25rem !important;
    }
    #threadDetailPortal .threadItemCard-price { /* the main price in deal details */
      font-size: 1.5rem !important;
    }
    .card .threadItemCard-price { /* the price of a deal in related threads */
      font-size: 1rem !important;
    }
    .card .textBadge { /* the discount badge of a deal in related threads */
      font-size: 0.925rem;
      line-height: 1.25rem;
      --line-height: 1.25rem;
    }
    .threadListCard-body .textBadge { /* the discount badge of a deal in the main page */
      line-height: 1.3rem;
      --line-height: 1.3rem;
    }
    /* END: Font Size */

    .button--fromW3-size-l {
      height: 40px !important;
    }

    /* Pepper ads */
    #belowDetailsAdSlotPortal, /* ad slot below deal info on deal details pages */
    #eventThemingPortal, /* top page event banner */
    #leftStickySidebarLinkedAdSlotPortal,
    #sidebarTopAdSlotPortal, #sidebarBottomAdSlotPortal,
    #mrec1FuseZonePortal, #vrec1FuseZonePortal {
      display: none;
    }
    /* END: Pepper ads */

    /* Pepper Widgets */
    #votePromptPortal, /* empty box in the alerts page */
    #personalizationMessagePortal, /* personalization link in the popular tab */
    #personalizedVotingWidgetPortal, /* empty tile in the grid view */
    #topMerchantsWidgetPortal, /* another empty tile in the grid view? */
    .js-threadList > div:has(a[href*="/kupony/"]), /* a coupon subpage link in merchant search results */
    #voteSecondarySectionPortal, /* Secondary vote section */
    #threadDetailPortal *[data-t="keywordSuggestionsWidget"], /* the keyword widget for an expired deal */
    #keywordSuggestionsWidgetPortal { /* the keyword widget below deal details */
      display: none;
    }
    /* END: Pepper Widgets */

    /* Voting buttons: Replaced up/down arrow with +/- */
    .vote-button .icon--arrow-rounded-down, .vote-button .icon--arrow-rounded-up {
      display: none;
    }

    .vote-button.vote-button--mode-up span:after {
      content: '+';
      font-weight: bold;
      font-size: 1.7em;
    }
    .vote-button.vote-button--mode-down span:after {
      content: '\u2013';
      font-weight: bold;
      font-size: 1.7em;
      margin-top: -0.17em;
    }

    /* Changing the color only when voting enabled (not voted already) */
    .vote-button.vote-button--mode-up:not(:disabled) span:after {
      color: ${voteRedColor};
    }
    .vote-button.vote-button--mode-down:not(:disabled) span:after {
      color: ${voteBlueColor};
    }
    /***/

    .vote-button.vote-button--mode-up.vote-button--mode-selected {
      background-color: ${voteRedColor} !important;
    }
    .vote-button.vote-button--mode-down.vote-button--mode-selected {
      background-color: ${voteBlueColor} !important;
    }
    /* END: Voting buttons */

    /* Thread description: All deals, Hottest deals... etc. */
    #threadListingDescriptionPortal > div > p:first-child {
      display: none !important;
    }

    /* Force the orange color */
    .text--color-green, /* green text like in "For free" */
    .button[data-t="removeBookmark"] { /* bookmark button for saved deals */
      color: ${orangeColor} !important;
    }
  `;

  if (pepperTweakerConfig.pluginEnabled) {

    if (pepperTweakerConfig.improvements.restoreOriginalEmoticons) {

      const originalPepperEmoticonsWithHashCharEncoded = {
        angel_4e27f: '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="20"><g fill="none" fill-rule="evenodd"><path fill="%238CBAE4" d="M7 10.82c.24-.34.8-1.57-.9-2.67 0 0-1.15-.93-1.33-1.17 0 0-2.6-2.9-2.74-2.97-.23-.08-1.5.73-.16 2.86C.7 6.56.2 6.86.05 7.1c-.1.2-.2.87 1.26 2.06-.14.02-1.2.4-.78.9.42.5 1.1.7 1.6.84-.25.35-.2.73-.06.9.6.7 2.4-.27 3.05-.53.6.37 1.62-.08 1.9-.45z"/><path fill="%23FFF" d="M6.4 10.5c.2-.3.8-1.05-.62-2l-1.2-.94S2.2 4.88 2.08 4.8c-.2-.06-.9.3.73 2.68-1-.25-2.17-.36-2.3-.15-.1.18.24 1 1.72 2-.12.02-1.43.28-1.07.7.36.4 1.26.62 1.7.57-.2.3-.5.82-.38.96.33.22 1.76-.47 2.32-.7.5.33 1.36-.06 1.6-.37z"/><path fill="%238CBAE4" d="M18.6 10.37c-.23-.35-.75-1.6.97-2.64 0 0 1.2-.88 1.4-1.12 0 0 2.68-2.78 2.82-2.87.23-.08 1.47.78.06 2.86 1.2-.27 1.66.04 1.8.3.1.2.17.87-1.33 2 .15.03 1.2.46.76.94-.45.48-1.14.66-1.63.8.23.34.17.72.03.88-.63.7-2.38-.35-3.04-.64-.6.36-1.6-.13-1.87-.5z"/><path fill="%23FFF" d="M19.2 10.06c-.18-.3-.77-1.07.7-1.96l1.22-.9s2.47-2.6 2.6-2.66c.2-.07.9.32-.83 2.64 1-.22 2.18-.3 2.3-.07.1.2-.27 1-1.78 1.96.12.02 1.4.32 1.04.72-.37.4-1.28.58-1.72.5.2.3.47.85.35 1-.35.2-1.75-.54-2.3-.8-.5.32-1.37-.1-1.6-.42z"/><path fill="%23FFB612" d="M8.63 5.04c1.94-1.33 3.62-1.64 3.96-2.92.2-.76.07-1.2-.7-2.2 2.25.76 3.56 1.84 3.88 2.72.53 1.43-.17 3.03.52 3.18.66.14 1.13-.93 1-1.93 2.18 1.96 3.6 4.2 3.7 7.82.14 4.3-3.08 8.21-8.25 8.21-4.56 0-8.27-3.44-8.27-7.68 0-3.92 2.2-5.87 4.15-7.2z"/><path fill="%23FDDB38" d="M8.03 4.68c-1.74-.36-2.55-.9-2.55-1.65 0-1.97 6.22-2.07 7.46-2.07 1.25 0 7.47.1 7.47 2.07 0 .9-1.2 1.32-2.08 1.55a.61.61 0 01-.74-.45c-.1-.32.1-.65.44-.74.55-.15.86-.28 1.02-.37-.63-.35-2.72-.85-6.1-.85-3.37 0-5.46.5-6.1.85.2.1.62.3 1.44.46a.6.6 0 01.47.7c-.06.3-.32.5-.6.5-.04 0-.08 0-.12-.02z"/><path fill="%23863F01" d="M7.92 7.4c.36-.1 1.2-.35 2.1-.15.93.2.36-.56-.16-.77-.52-.2-1.42.02-1.83.4-.4.4-.75.73-.1.53zm7.66-.96c1.06-.23 1.7.24 2.12.6.25.23-.23.32-.5.17-.3-.14-1.47-.4-2.2-.24-.7.16-.04-.4.58-.52z"/><path fill="%23462000" d="M18.24 9.95c.04.64-.14 3.66-1.6 3.64-2.13-.05-2-3-1.97-3.74.02-.55.78-.43.8.1.04.5 0 2.55 1.14 2.48.66-.04.76-2.1.8-2.55.05-.47.8-.6.84.05zm-7.41 0c.04.64-.1 3.67-1.57 3.64-2.13-.05-2.02-3-2-3.74.02-.55.78-.43.8.1.05.5 0 2.55 1.14 2.5.65-.05.75-2.1.8-2.56.04-.46.8-.6.83.05z"/><path fill="%23462000" fill-rule="nonzero" d="M9.8 16.32c.88 1.93 4.3 2.02 5.3.04.1-.2.02-.46-.2-.57a.4.4 0 00-.56.17c-.7 1.34-3.18 1.28-3.78 0-.1-.22-.35-.32-.56-.22-.22.1-.3.36-.2.57z"/></g></svg>',
        annoyed_b07c1: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23FFF" d="M8.84 11.63l6.84-.01c0 4.04-6.78 4-6.84 0zm-7.71-.01l6.83-.01c0 4.04-6.78 4-6.83 0z"/><path fill="%23462000" d="M12.63 11.64c0 1.41.49 1.95 1.55 1.95 1.05 0 1.5-.54 1.5-1.97l-3.05.02zm-7.72-.01c0 1.41.49 1.95 1.55 1.95s1.5-.54 1.5-1.97l-3.05.02z"/><path fill="%23462000" fill-rule="nonzero" d="M7.42 17.2c.35-.66.66-.97 1.25-.97s.87.34 1.35 1.43a.38.38 0 00.69-.3c-.6-1.35-1.04-1.88-2.04-1.88-.95 0-1.45.49-1.91 1.38a.38.38 0 00.66.35z"/><path fill="%23863F01" d="M10.8 9.17c.87.32 2.03.33 2.03.33l.04.44s-1.45.34-2.42-.08C8.94 9.21 9.41 7.78 9.4 7.78l.44-.03s.28 1.16.98 1.42zM5.2 6.95c1.5-.43 2.3 1.07 2.3 1.06l-.33.28s-.7-.75-1.8-.58c-.8.13-1.73 1.12-1.73 1.12l-.37-.24S3.7 7.38 5.2 6.95z"/></g></svg>',
        blank_822a0: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><g transform="translate(10.71 13.03)"><path fill="%23FFF" d="M2.7 4.42A1.83 1.83 0 01.87 2.59c0-1 .82-1.82 1.83-1.82H7c1.02 0 1.85.82 1.85 1.82S8.02 4.42 7 4.42H2.7z"/><path fill="%2338060B" d="M7 1.07c.86 0 1.55.68 1.55 1.53 0 .84-.69 1.53-1.54 1.53H2.7c-.86 0-1.55-.69-1.55-1.53 0-.85.7-1.53 1.54-1.53H7zm0-.59H2.7C1.53.48.57 1.43.57 2.6c0 1.16.96 2.1 2.13 2.1H7c1.18 0 2.14-.94 2.14-2.1 0-1.17-.96-2.12-2.13-2.12z"/><circle cx="2.85" cy="2.57" fill="%2338060B" r=".61"/><circle cx="4.89" cy="2.57" fill="%2338060B" r=".61"/><circle cx="6.93" cy="2.57" fill="%2338060B" r=".61"/></g><path fill="%23462000" d="M5.03 10.11c.36 0 .66.58.66 1.28 0 .7-.3 1.28-.66 1.28-.37 0-.67-.57-.67-1.28 0-.7.3-1.28.67-1.28z"/><path stroke="%23462000" d="M7.23 15h2.15" stroke-linecap="round" stroke-linejoin="round"/><path fill="%23462000" d="M11.53 10.11c.38 0 .7.58.7 1.28 0 .7-.32 1.28-.7 1.28-.4 0-.7-.57-.7-1.28 0-.7.3-1.28.7-1.28z"/></g></svg>',
        cheeky_b10b9: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="a" d="M1.91 2.57C3.7 2.4 3.92.04 2.67.04 1.69.04.92.44.37.92c-.52.47.37 1.76 1.54 1.65z"/><path id="c" d="M2.71.95c-.94 0-1.77.24-2.41.67-.47.32.66 2.03 1.84 1.82C3.4 3.23 4.9.94 2.71.94z"/></defs><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23FFF" d="M1.1 10.97c-.14.45-.26 1.82 1.32 1.83.67 0 1.08-.3 1.4-.55.27-.19.47-.34.77-.34.57 0 1.45.59 1.6.64.6.22 1.95.12 1.77-1.6C7.78 9.17 5.6 8.7 4.35 8.7a3.52 3.52 0 00-3.25 2.27zm11.3-2.36c-1.64 0-2.96.73-3.47 1.9-.15.34-.36.98-.14 1.52.11.27.46.77 1.15.72 1.13-.09 1.26-.93 2.29-.97 1.03-.03 1.8.88 2.3.9 1.13.07 1.34-1.34 1.23-1.81A3.41 3.41 0 0012.4 8.6z"/><g transform="translate(1.68 8.66)"><mask id="b" fill="%23fff"><use xlink:href="%23a"/></mask><use fill="%23FFF" xlink:href="%23a"/><ellipse cx="1.62" cy=".49" fill="%23462000" mask="url(%23b)" rx=".85" ry="1.37"/></g><g transform="translate(9.68 7.66)"><mask id="d" fill="%23fff"><use xlink:href="%23c"/></mask><use fill="%23FFF" xlink:href="%23c"/><ellipse cx="1.6" cy="1.44" fill="%23462000" mask="url(%23d)" rx=".81" ry="1.31"/></g><path fill="%23462000" d="M8.15 14.56c.77.05 1.37-.45 1.88-.98.8 3.03-.88 3.92-1.49 3.92-.78 0-2.48-.7-1.8-3.81.3.63.64.82 1.41.87z"/><path fill="%23EA114F" d="M8.52 17.08c.37 0 1.27-.44 1.33-1.8a1.72 1.72 0 00-.82-.2c-.76-.01-1.41.5-1.78 1.25.35.58.92.75 1.27.75z"/><path fill="%23D34101" d="M11.5 14.06l2.03-1.24c.1-.06.22-.02.27.1.05.12.01.27-.09.33l-2.03 1.24c-.2.12-.5-.23-.18-.43zm1.14.19l3.14-1.52c.34-.12.45.31.15.45L12.8 14.7c-.38.15-.44-.31-.15-.45zm1.39.25l1.71-.53c.37-.09.45.36.1.46l-1.7.53c-.34.1-.5-.34-.11-.46zM.99 14l1.72-.67c.35-.09.46.32.13.46l-1.72.67c-.3.12-.52-.32-.13-.46zm.73.56l3.14-1.5c.43-.17.52.27.15.44l-3.14 1.51c-.3.13-.5-.27-.15-.45zm2.1-.11l1.63-.8c.27-.12.44.28.16.44l-1.63.8c-.3.15-.5-.29-.16-.44z"/></g></svg>',
        confused_36f0a: '<svg xmlns="http://www.w3.org/2000/svg" width="19" height="20" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="a" d="M2.5.5C1.46.46.5 1.52.38 2.9.27 4.28.75 5.44 1.95 5.48c1.44.06 1.98-1.04 2.1-2.42C4.14 1.68 3.54.54 2.5.5z"/><path id="c" d="M2.5.5C1.46.46.5 1.52.38 2.9.27 4.28.75 5.44 1.95 5.48c1.44.06 1.98-1.04 2.1-2.42C4.14 1.68 3.54.54 2.5.5z"/></defs><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23863F01" d="M5.78 8.24c-.64.07-2.16-.33-2.16-.33l-.18.42s1.17.74 2.4.72c1.89-.03 1.81-1.74 1.83-1.74l-.43-.17s-.5 1-1.46 1.1zM11.3 6.6c-1.79-.08-2.22 1.48-2.23 1.47l.4.23s.77-1.01 1.77-.89c1 .07 1.98.86 1.98.86l.35-.3s-.77-1.3-2.27-1.37z"/><g transform="translate(2.8 8.94)"><mask id="b" fill="%23fff"><use xlink:href="%23a"/></mask><use fill="%23FFF" xlink:href="%23a"/><path fill="%23462000" d="M3.12.41c.91 0 1.13.77 1.13 1.7 0 .95-.42 1.7-1.13 1.7-.89 0-1.12-.75-1.12-1.7 0-.93.5-1.7 1.12-1.7z" mask="url(%23b)"/></g><g transform="translate(9.22 8.94)"><mask id="d" fill="%23fff"><use xlink:href="%23c"/></mask><use fill="%23FFF" xlink:href="%23c"/><path fill="%23462000" d="M3.12.41c.91 0 1.13.77 1.13 1.7 0 .95-.42 1.7-1.13 1.7-.89 0-1.12-.75-1.12-1.7 0-.93.5-1.7 1.12-1.7z" mask="url(%23d)"/></g><path fill="%235C2A00" d="M16.2 4.45c.22.03.42-.15.48-.38l.05-.15c.9-.07 1.66-.43 1.82-1.55v-.02c.16-1.17-.52-1.94-1.67-2.1-.7-.1-1.27.08-1.74.4a.65.65 0 00-.28.45c-.04.34.17.66.47.7.14.02.28-.03.38-.1.32-.19.63-.26.97-.22.46.07.7.34.65.73v.02c-.07.43-.42.63-1.12.63-.26 0-.44.18-.44.47v.62c0 .24.13.46.36.49h.06zm-.95 1.24c-.06.42.19.8.59.85.4.05.73-.23.8-.66v-.01c.05-.43-.2-.8-.6-.85-.39-.06-.73.23-.79.65v.02z"/><path fill="%23462000" fill-rule="nonzero" d="M7.96 16.8c1.08.5 2.45.8 3.59.14 0 0 .31-.2.15-.5s-.55-.18-.55-.18c-.87.5-1.96.15-2.86-.18-1.04-.37-1.72-.3-2.39.03 0 0-.39.17-.21.53.17.37.56.18.56.18.5-.25 1.1-.3 1.71-.02z"/></g></svg>',
        cool_894b1: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M5.37 5.1C7.3 3.78 8.99 3.48 9.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23462000" d="M9.87 16.8c.78 0 3.08.17 3.2-1.54.02-.35.76-.2.75 0-.08 1.79-1.14 2.28-3.92 2.34-.57.01-.61-.8-.03-.8z"/><path d="M20.54 9.46v.94h-2.56v.94h-.76v.78h-.75v.94h-.62V14h-5.28v-.95h-.75v-.94h-.75V10.4h-.88v.94h-.63v.78h-.75v.94h-.76V14H1.41v-.95H.66v-.94H.03V9.46zm0 .94h1.38v.94h-1.38z" fill="%23000"/><path d="M15.97 10.4h.75v.93h-.75zm-.75.93h.75v.78h-.75zm-.76.79h.75v.94h-.75zm0-1.72h.75v.93h-.75zm-.75.93h.75v.78h-.75zm-.75.79h.75v.94h-.75zM6.05 10.4h.75v.93h-.75zm-.75.93h.75v.78H5.3zm-.75.79h.75v.94h-.75zm0-1.72h.75v.93h-.75zm-.76.93h.75v.78h-.75zm-.75.79h.75v.94h-.75z" fill="%23FFF"/><path fill="%23863F01" d="M5.14 8.15c.32-.1 1.06-.31 1.86-.14.8.18.3-.49-.15-.67-.45-.19-1.25.02-1.6.35-.36.34-.67.64-.1.46zm6.75-.85a2 2 0 011.86.53c.22.2-.2.28-.44.15a3.97 3.97 0 00-1.93-.22c-.63.14-.04-.35.5-.46z"/></g></svg>',
        cry_b8c80: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="a" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/></defs><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><mask id="b" fill="%23fff"><use xlink:href="%23a"/></mask><use fill="%23FFC415" xlink:href="%23a"/><path fill="%238DE2FF" d="M3.28 12.63c-.12-.45 2 .04 2.23.48.23.44.24 1.96-.14 2.64-.37.67-1.11.5-1.5 1.43-.37.93.5 1.81.8 2.46.3.65-2.91-1.62-3.33-3.14.14-2.02.58-2.04 1.33-2.3.75-.25.73-1.11.61-1.57zm10.16 0c-.12.46-.2 1.53.66 1.79.86.26.93.68 1.07 2.7-.42 1.52-3.68 3.17-3.37 2.52.3-.65 1.02-1.53.93-2.46-.1-.93-1.1-1.11-1.48-1.78a3.65 3.65 0 01-.18-2.43c.18-.57 1.24.07 2.37-.33z" mask="url(%23b)"/><path d="M7.4 8.92c-.32.65-3.21.87-3.58.46-.1-.12 1.68-.15 2.72-.75.54-.32.53-1.18.79-1.34.22-.13.68.43.08 1.63zm2-.93c-.02.42-.2 1.94 3.52 1.65.3-.02.08-.4-.72-.44-1.64-.08-2.07-.83-2.34-1.3-.19-.32-.45-.4-.47.09z" fill="%23863F01"/><path stroke="%23462000" stroke-width=".75" d="M7.18 16.22c.19-.43.53-1.16 1.32-1.16.8 0 1.1.82 1.4 1.63" stroke-linecap="round"/><path stroke="%23462000" d="M6.77 12.42c-1.17.7-2.92 1-4.77-.42m12.6.21c-1.16.7-2.85 1.41-4.7 0" stroke-linecap="round"/></g></svg>',
        devil_b2062: '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="20"><defs><linearGradient id="a" x1="62.65%" x2="43.97%" y1="91.76%" y2="13.59%"><stop stop-color="%23F25757" offset="0%"/><stop stop-color="%23FF053F" offset="100%"/></linearGradient></defs><g fill="none" fill-rule="evenodd"><path fill="%23462000" d="M14.69 15.19l.22.18c.25.18.65.44 1.15.62.5.17 1.06.24 1.54.02l.09-.04.1-.06c.08-.05.2-.12.23-.16a2.3 2.3 0 00.88-1.14c.24-.6.16-1.34-.13-1.98-.15-.33-.36-.73-.5-1.1a5.6 5.6 0 01-.37-1.13 2.41 2.41 0 01.4-1.93c.29-.37.49-.52.49-.52s.56-.15.72.06c.15.2.12.48-.06.65 0 0-.14.13-.3.39-.16.26-.27.6-.13 1.11.07.26.2.55.35.87.17.32.36.61.58 1.02a3.85 3.85 0 01-.95 5.02l-.28.2-.17.12-.18.1c-.5.28-1.04.4-1.52.41-.5.02-.93-.06-1.32-.16a6.26 6.26 0 01-2.2-1.12l-.11-.1a1 1 0 111.35-1.45l.12.12z" opacity=".22"/><path fill="%23462000" d="M14.91 15.37c2.3 1.6 3.37.2 3.47.07 1.54-1.9-.2-3.35-.48-5.04-.18-1.09.27-1.73.4-1.92.29-.38 1.42-.34.85.57-.16.26-.27.6-.13 1.11.07.26.7 1.48.93 1.89.45.82.7 1.94.38 3.01-.5 1.75-1.96 2.43-1.96 2.43-.5.28-2.22.97-4.55-.51-.19-.12.96-1.7 1.1-1.6z"/><path fill="%23462000" d="M20.86 6.9c-.29.62-.81 3.16-.7 3.77-.59-.57-1.23-1.84-1.03-2.18-1.08.1-2.04.1-2.74-.34 1.5-.86 2.9-1.5 4.47-1.25z"/><path fill="url(%23a)" d="M4.06 5.82c1.58-1.03 4-1.5 4.4-3.03.2-.76-.06-1.8-.82-2.79 2.25.75 3.56 1.82 3.88 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.44-8.27-7.69 0-4.96 3.84-6.5 3.84-6.5z"/><path fill="%23462000" d="M11.6 14.97c.68.19 1.15 1.44.4 2.24a4.92 4.92 0 01-3.8 1.56c-1.74-.03-3.49-1.04-4.06-2.46-.14-.35.22-.5.54-.6.45-.13 6.26-.92 6.93-.74z"/><path fill="%23D14218" d="M11.01 17.3c-.32-.23-2.04-.62-2.58.93.63-.05 1.66-.08 2.58-.93z"/><path fill="%23F0F3F5" d="M5.95 16c-.2.14.36.67.65.65.9-.15 2.46-.33 3.85-.47.12.12.23.68.38.64.43-.14.83-.62.8-1.18-.1-.12-.16-.17-.3-.2-.5-.1-5.24.46-5.38.56z"/><path fill="%23462000" d="M3.5 5.3c.6.8 1.84 1.94 2.08 2.12.06.59-.2 2.38-2.08 1.82-.72-.87-.44-3.23 0-3.94zm7.06 1.98c-.47 1.1.2 2.35 2.05 1.8.72-.87.44-3.2.01-3.9-.6.78-1.83 1.92-2.06 2.1z"/><path fill="%23F0F2F3" d="M4.88 14.1c-1.15 0-3.04-.96-2.63-3.83l4.73 1.87c-.11.68-.96 1.96-2.1 1.96z"/><path fill="%23462000" d="M4.7 13.12c.53 0 .69-.6.69-1.2 0-.58-.4-.84-.69-.84-.3 0-.69.26-.69.85s.16 1.19.7 1.19z"/><path fill="%23F0F2F3" d="M14.34 9.98c.38 1.42-.01 4.11-2.19 4.38-2.18.28-2.7-1.6-2.82-2.3.55-.16 5-2.08 5-2.08z"/><path fill="%23462000" d="M2.05 9.49l4.82 2.28.37-1.17c.03-.12.25-.22.38-.2.13.03.26.21.23.34l-.3 1.69-.04.09c-.08.17-.31.36-.48.28L1.79 10c-.12-.06-.15-.28-.1-.4.06-.12.36-.12.36-.12zm9.35 3.72c.51 0 .68-.5.68-1.1 0-.59-.39-.81-.68-.81-.3 0-.68.22-.68.81 0 .6.17 1.1.68 1.1z"/><path fill="%23462000" d="M9.17 10.54l.34 1.18 5-2.14a.3.3 0 01.4.15c.06.15-.04.54-.2.61 0 0-5.3 2.47-5.33 2.47-.44.1-.45-.26-.5-.46l-.35-1.64c-.03-.15.1-.32.24-.37.15-.05.35.04.4.2z"/></g></svg>',
        embarrassed_fa379: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23863F01" d="M10.47 7.8c.89.3 1.95.31 1.95.31l.04.42s-1.57.43-2.69-.26c-1-.6-.64-1.81-.66-1.82l.42-.02s.16 1.1.94 1.36zm-3.74.34c-.96.56-2.03.49-2.03.49l-.05-.42s.85-.24 1.67-.71a4.72 4.72 0 001.23-1.27l.38.18s-.15 1.11-1.2 1.73z"/><path fill="%23D34101" d="M12.85 13.52l1.95-1c.27-.14.47.2.18.35l-1.95 1c-.25.1-.4-.24-.18-.35zm.8.26l3.02-1.23c.3-.1.37.28.15.37l-3.02 1.23c-.34.13-.48-.23-.15-.37zm1.34.2l1.65-.43c.32-.06.35.3.1.38l-1.65.43c-.3.06-.43-.29-.1-.38z"/><path fill="%23462000" d="M3.42 12.13c.02-1.05.46-2.9 1.9-2.64.62.11 1.03.58 1.17 1.17.1.42.2 1.85-.22 1.84-.36 0-.4-.31-.42-.63-.03-.46-.01-1.4-.61-1.54-.64-.15-.89.73-1.04 1.18-.07.2-.1.55-.23.71-.18.22-.52.28-.55-.1m8.42-2.48c.73.04 1.25.55 1.42 1.21.12.45.37 2-.1 2-.42 0-.5-.92-.57-1.38-.07-.49-.25-.97-.82-.97-.7 0-1.04.71-1.17 1.3-.06.24-.07.69-.1.93-.01.23-.6.5-.61-.01-.08-1.28.24-3.16 1.95-3.08z"/><path fill="%23F3F3F3" d="M4.44 15.29c.78-.52 1.6.29 3.65.52 2.04.23 3.04-1.21 3.46-1.57.8-.7 1.97.85 1.26 2.22-.72 1.37-2.76 2.34-4.55 2.27-1.78-.08-3.22-.78-3.86-1.53-.64-.75-.46-1.59.04-1.91z"/><path stroke="%23C3C3C3" stroke-width=".5" d="M7 15.65l-.67 2.58m3.45-2.63l.78 2.62" stroke-linecap="round" stroke-linejoin="round"/><path stroke="%23462000" stroke-width=".54" d="M4.44 15.29c.78-.52 1.6.29 3.65.52 2.04.23 3.04-1.21 3.46-1.57.8-.7 1.97.85 1.26 2.22-.72 1.37-2.76 2.34-4.55 2.27-1.78-.08-3.22-.78-3.86-1.53-.64-.75-.46-1.59.04-1.91z"/><path fill="%23D34101" d="M.42 13.7l1.72-.67c.35-.09.46.32.13.46l-1.72.67c-.3.12-.52-.32-.13-.46zm.73.56l3.14-1.51c.43-.16.52.28.15.45L1.3 14.71c-.3.13-.5-.27-.15-.45zm2.1-.12l1.63-.8c.27-.1.44.29.16.45l-1.63.8c-.3.14-.5-.3-.16-.45z"/></g></svg>',
        excited_141fa: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path d="M9.68 10.62c-.45.59-.26 1.31.5 1.35.97.05 1.78.08 3.2.42.66.16.8-.46.35-.75-.44-.28-1.38-.4-2.56-.48-.1 0-.69-.01-.17-.47.65-.6 1.5-.95 2.32-1.08 1-.15.34-.88-.23-.83-1.3.12-2.71.92-3.41 1.84zm-2.77.4A4.88 4.88 0 003.9 8.98c-.5-.08-.88.46-.51.57.74.24 1.76.74 2.2 1.17.04.05.05.36-.22.36-.7.08-1.7.25-2.06.4-.43.19-.58.9.26.7.84-.2 2.11-.42 2.85-.49.6-.06.69-.36.49-.67zm-3.44 3.35c-.05-.38.22-.46.3-.47 1.53-.17 7.67.12 8.89.33.3.06 1.02.69.67 1.49a5.16 5.16 0 01-4.72 2.9c-2.57 0-4.84-1.83-5.14-4.25z" fill="%23462000"/><path fill="%23CF4324" d="M7.8 18.06a2.84 2.84 0 014.48-1.76 4.46 4.46 0 01-4.49 1.76z"/><path fill="%23FF7B5F" d="M8.65 17.07c.19-.25.85-.82 1.43-.88.57-.07.2.28-.14.41-.35.14-.72.44-.97.75-.24.32-.53 0-.32-.28z"/></g></svg>',
        fierce_30b68: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23462000" d="M10.7 11.54c.09-.26.23-.97 1.39-1.77a.35.35 0 00-.27-.64c-.07.02-1.47.26-2.11 2.9-.06.25.28.55.49.47a5.73 5.73 0 013.13-.22c.19.06.38-.03.45-.2a.35.35 0 00-.21-.46 4.26 4.26 0 00-2.87-.08zm-4.28 0c-.09-.26-.22-.97-1.38-1.77a.35.35 0 01.27-.64c.06.02 1.47.26 2.1 2.9.07.25-.27.55-.48.47a5.73 5.73 0 00-3.14-.22.35.35 0 01-.24-.66 4.26 4.26 0 012.87-.08z"/><path fill="%23462000" fill-rule="nonzero" d="M7.32 16.35c.06.01.16.05.29.11l.44.22c1.15.54 2.11.61 3.29-.07 0 0 .33-.21.16-.53-.17-.31-.57-.18-.57-.18-.91.53-1.6.48-2.53.04l-.45-.22a2.68 2.68 0 00-2.49.03s-.4.18-.22.55c.19.38.58.19.58.19.53-.26.87-.3 1.5-.14z"/></g></svg>',
        flirt_27e52: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.88 5.1c1.94-1.32 3.63-1.62 3.97-2.9.2-.76.07-1.2-.7-2.2 2.26.75 3.56 1.83 3.89 2.71.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.96 3.6 4.2 3.71 7.82.14 4.3-3.09 8.22-8.25 8.22C4.44 20 .74 16.55.74 12.3c0-3.91 2.2-5.87 4.14-7.2z"/><path fill="%23FFE5CD" d="M9.16 10.94l5.7-.01c0 3.37-5.65 3.34-5.7 0zm-6.43 0l5.7-.02c0 3.37-5.65 3.34-5.7.01z"/><path fill="%23462000" d="M12.32 10.94c0 1.17.4 1.63 1.29 1.63.88 0 1.25-.44 1.25-1.64h-2.54zm-6.44-.01c0 1.18.41 1.63 1.3 1.63.87 0 1.24-.44 1.24-1.64l-2.54.01z"/><path fill="%23863F01" d="M5.08 9.3c1.05 0 1.8-.3 1.92-.92.04-.22.68-.19.66.6 0 .9-1.76 1.38-2.6 1.01-.73-.31-.2-.7.02-.7zm4.69-1.71c.53.57 1.25.92 1.78.83.52-.09.68.36.4.56-.27.2-1.8.58-2.57-.4-.78-1 .18-1.22.39-.99z"/><path fill="%23462000" d="M9.36 15.76c1.65-.12 3.15-.11 3.2-1.47 0-.34.76-.5.77.04 0 1.43-.94 2.13-4 2.19-.36 0-.53-.72.03-.76z"/></g></svg>',
        football_69030: '<svg width="21" height="20" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="M10.2 0a10.1 10.1 0 0110.2 10c0 5.51-4.57 10-10.2 10A10.1 10.1 0 010 10C0 4.48 4.57 0 10.2 0z" fill="%231D1F20"/><path d="M16.82 16.76a9.63 9.63 0 01-6.55 2.6 5.47 5.47 0 003.16-1.66 6.07 6.07 0 003.28-1.05l.1.1zm-4.31-1.51a13.4 13.4 0 01-4.15-1.32c-1.04.6-1.98 1.05-2.8 1.3.03.6.17 1.8.86 2.9.89.5 2 .88 3.29 1.02.75-.13 2.42-.55 3.4-1.68l-.6-2.22zM.94 12.35c.6.16 1.46.08 1.87-.02a6.7 6.7 0 002.39 2.9 6 6 0 00.7 2.74h-.73a9.41 9.41 0 01-4.23-5.62zm18.76-1.3a9.27 9.27 0 01-2.6 5.42l-.1-.09c.52-.77.83-1.69 1.03-2.67a10.8 10.8 0 001.67-2.65zm-8.75-4.02a41.3 41.3 0 00-3.19 2.95l.79 3.6c.72.38 1.73.86 4.14 1.3a15.16 15.16 0 002.75-2.44 17.2 17.2 0 00-.9-4.23c-1.03-.4-2.17-.8-3.6-1.18zm5.46-1.35c-.52.87-1.05 1.68-1.56 2.37.64 1.4.92 3.66.97 4.3l2.1.93c.4-.5 1.37-1.96 1.7-3.15-.1-1.07-.31-1.9-.89-3.45a5.1 5.1 0 00-2.32-1zm-14.53-.3c.47-.13.95-.14 1.51-.06.03 1.74.28 2.98.6 3.76a5.55 5.55 0 00-1.23 2.84c-1.02.28-1.64.11-1.93-.03a9.22 9.22 0 011.05-6.51zM6.6 2.7a9.07 9.07 0 00-2.84 2.43c.01.83.15 2.74.62 3.81 1.06.2 2.13.42 3.13.77.5-.51 2.51-2.45 3.22-2.96-.13-1-.28-2.01-.44-3.03A13.19 13.19 0 006.6 2.7zm7.46-1.28a9.52 9.52 0 014.83 4.66l-.13.18c-.8-.6-1.74-.87-2.38-.96a7.67 7.67 0 00-2.4-2.54c.08-.38.13-.93.08-1.34zM6.8 1.24a9.7 9.7 0 016.86.01 6.9 6.9 0 01-.03 1.42 9.2 9.2 0 00-3.11.69c-.66-.3-1.95-.83-3.68-1.04a7 7 0 00-.04-1.08z" fill="%23F6F6F6"/></g></svg>',
        happy_da384: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23462000" d="M3.51 14.45c-.1-.6.58-.74.66-.75 1.64-.2 6.32-.18 8.96.38.31.07 1.22.48.74 1.52a5.54 5.54 0 01-5.02 3.23 5.21 5.21 0 01-5.34-4.38z"/><path fill="%23FFF" d="M4.2 14.58a.22.22 0 01.04-.18c.04-.05.1-.08.17-.09a34.8 34.8 0 017.98.25c.66.12 1.16.36.63 1.15-.97 1.43-2.37 2.46-4.22 2.46a4.6 4.6 0 01-4.6-3.6z"/><path fill="%23D1D5DB" d="M12.86 15.94c-.18.25-.38.48-.59.7l-1.07.32-.06-.71-2.06-.16c-.94-.1-1.05-.46-.06-.43l2.58.12.04.52 1.22-.36z"/><path fill="%23863F01" d="M4.1 7.53c.35-.1 1.16-.34 2.03-.14.88.19.34-.54-.16-.74-.5-.2-1.42-.07-1.81.3-.39.36-.67.78-.05.58zm7.47-1.11a1.88 1.88 0 011.93.61c.21.22-.22.46-.5.31a4.33 4.33 0 00-2.09-.23c-.69.15.06-.57.66-.7z"/><path fill="%23462000" d="M10.56 12.08c-.04-.62.35-3.52 1.74-3.5 2.06.04 1.7 2.88 1.68 3.58-.01.53-.74.41-.77-.1-.03-.47.19-2.56-.92-2.5-.62.04-.89 2.13-.93 2.57-.04.44-.77.56-.8-.05zm-7.12 0c-.03-.61.35-3.52 1.75-3.5 2.05.05 1.7 2.88 1.68 3.59-.02.53-.75.4-.78-.1-.03-.48.23-2.5-.88-2.44-.62.04-.92 2.06-.96 2.5-.05.44-.77.57-.8-.05z"/></g></svg>',
        highfive_5ffa5: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M9.37 5.1c1.93-1.33 3.62-1.63 3.96-2.91.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23E5A310" d="M5.25 11.85c.8.01 2.29-.36 3.15-.89.87-.52 1.15-2.5 2.37-3.13 1.21-.63 1.54-1.26.92-1.98-.72.28-4.45 2.48-5.32 3.28-.86.8-1.14 1.47-1.12 2.72z"/><path fill="%23863F01" d="M9.38 8.54c.32-.1 1.06-.32 1.86-.14s.3-.5-.15-.68c-.45-.18-1.25.02-1.61.36-.36.33-.66.63-.1.46zm6.74-.86a2 2 0 011.87.53c.22.2-.2.29-.45.15a3.97 3.97 0 00-1.92-.21c-.63.13-.04-.35.5-.47z"/><path fill="%23462000" d="M15.44 12.82c-.04-.61.35-3.5 1.73-3.47 2.04.04 1.7 2.85 1.67 3.56-.02.52-.74.4-.77-.1-.03-.48.02-2.43-1.08-2.37-.61.03-.71 2-.75 2.43-.05.44-.77.56-.8-.05zm-7.07 0c-.04-.6.34-3.5 1.73-3.47 2.04.04 1.7 2.86 1.67 3.56-.02.53-.74.4-.77-.1-.03-.47.02-2.43-1.08-2.37-.62.04-.71 2-.76 2.43-.04.44-.76.57-.8-.05z"/><path fill="%23FFC415" d="M8.74 9.32c-1.12 2-5.7 1.98-6.8.79C.83 8.89-.14 4.38.54 2.84 1.63.3 5.36-.3 6.48.92 7.1 1.6 7.82 3.9 8.14 6c.27-.4.54-.91 1.1-1.26 1.04-.64 3.46.4 1.96 1.6a9.83 9.83 0 00-2.46 2.98z"/><path d="M5.09.44l.5 3.51M3.18.65l.63 3.58M1.67 1.54l.55 3.38m-.63 1.2c.4-.3 2.97-1.25 4.84-1.3m-.67 3.32c.4-.56.77-1.32 2.3-2.12" stroke="%23B55500" stroke-width=".55" stroke-linecap="round" stroke-linejoin="round"/><path stroke="%236D3705" stroke-width=".6" d="M8.74 9.32c-1.12 2-5.7 1.98-6.8.79C.83 8.89-.14 4.38.54 2.84 1.63.3 5.36-.3 6.48.92 7.1 1.6 7.82 3.9 8.14 6c.27-.4.54-.91 1.1-1.26 1.04-.64 3.46.4 1.96 1.6a9.83 9.83 0 00-2.46 2.98z" stroke-linecap="round" stroke-linejoin="round"/><path fill="%23F3F3F3" d="M10.2 14.57c.7-.36 1.3.38 2.98.75 1.67.37 2.62-.73 3-1 .73-.5 1.56.88.85 1.95-.71 1.07-2.49 1.7-3.96 1.48-1.47-.22-2.6-.92-3.06-1.6-.46-.68-.24-1.35.2-1.58z"/><path stroke="%23C3C3C3" stroke-width=".4" d="M12.3 15.1l-.78 2.07m3.08-1.87l.41 2.24" stroke-linecap="round" stroke-linejoin="round"/><path stroke="%23462000" stroke-width=".5" d="M10.2 14.57c.7-.36 1.3.38 2.98.75 1.67.37 2.46-.7 2.85-.92.89-.5 1.7.8 1 1.87-.71 1.07-2.49 1.7-3.96 1.48-1.47-.22-2.6-.92-3.06-1.6-.46-.68-.24-1.35.2-1.58z" stroke-linecap="round" stroke-linejoin="round"/></g></svg>',
        horror_566a5: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M5.11 4.85c1.82-1.27 3.4-1.55 3.73-2.77.2-.72.07-1.15-.65-2.08 2.12.7 3.35 1.73 3.65 2.57.5 1.36-.16 2.88.49 3.02.62.13 1.06-.89.94-1.83a9.67 9.67 0 013.49 7.43A7.5 7.5 0 018.99 19c-4.3 0-7.78-3.27-7.78-7.3 0-3.72 2.08-5.58 3.9-6.85z"/><g transform="translate(1.65 .82)"><path d="M10.74.26c-.2 0-.42.25-.42.54v5.42c0 .3.22.54.42.54.21 0 .43-.24.43-.54V.8c0-.3-.22-.54-.43-.54zm1.71 1.09c-.2 0-.42.24-.42.54V7.3c0 .3.22.54.42.54.2 0 .43-.24.43-.54V1.9c0-.3-.22-.54-.43-.54zm1.71 2.16c-.2 0-.42.24-.42.54v2.17c0 .3.22.54.42.54.2 0 .43-.24.43-.54V4.05c0-.3-.22-.54-.43-.54z" fill="%2338060B"/><circle cx="10.78" cy="10.68" r="3" fill="%23FFF" stroke="%235D2A00" stroke-width=".6"/><circle cx="3.93" cy="10.59" fill="%23FFF" stroke="%235D2A00" stroke-width=".6" r="3"/><path fill="%23462000" d="M4.44 14.34c.53-.17 3.42-.32 4.21-.06.79.25-.22 3.59-1.08 3.92-.87.33-1.77.25-1.93.01-.16-.24-.73-2.94-.84-3-.1-.08-1.22-.6-.36-.87z"/><path fill="%23EA114F" d="M7.42 15.65c-.86 0-1.55.84-1.55 1.88 0 .09 0 .17.02.26l.02.04c.12.2.66.27 1.36 0 .39-.15.82-1.06 1-1.87-.24-.2-.53-.3-.85-.3z"/></g></g></svg>',
        kitty_c8091: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M18.07 10.08c-.02-.03-2.2-2.74-2.9-3.36l-.46-.4.51-.35c.7-.47 1.98-.8 3.1-.8.48 0 .88.06 1.2.18l.23.1.06.24c.23 1.04-.32 3.98-1.11 4.49l-.36.23-.27-.33z"/><path fill="%23FFB612" d="M6.37 5.1c1.93-1.32 3.62-1.62 3.96-2.9.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23FFB612" d="M2.13 10.24c-.73-.6-1-3.7-.66-4.77l.08-.25.25-.08c.24-.08.53-.12.86-.12 1.16 0 2.64.48 3.38 1.1l.48.4-.5.4c-.62.49-2.5 2.52-3.18 3.27l-.33.36-.38-.3z"/><path fill="%23462000" d="M12.35 11.22c-.03-.6.35-3.48 1.73-3.46 2.02.04 1.68 2.85 1.65 3.55-.01.52-.73.4-.76-.1-.03-.47.02-2.42-1.07-2.36-.62.04-.71 1.99-.76 2.42-.04.44-.75.56-.79-.05zm-7.23 0c-.04-.6.34-3.48 1.72-3.45 2.03.04 1.68 2.84 1.66 3.54-.02.53-.74.4-.77-.1-.03-.47.03-2.42-1.07-2.35-.61.03-.7 1.98-.75 2.42-.04.43-.76.56-.8-.05z"/><path stroke="%237C3A00" stroke-width=".8" d="M15.77 14.46s2.04.53 3.25 1.5m-14.53-1.5s-2.04.53-3.24 1.5m14.14-2.84s1.52-.5 3.87-.22m-14.4.22s-1.5-.5-3.86-.22" stroke-linecap="round" stroke-linejoin="round"/><path stroke="%23462000" stroke-width=".8" d="M7.15 14.6c-.56.28-.66 1.9.7 2.24 1.2.3 1.93-.84 2.55-.86.63-.03 1.2 1.23 2.62.76.49-.17 1.15-1.14.4-2.15" stroke-linecap="round" stroke-linejoin="round"/><path fill="%23E56E01" d="M10.2 14.17c.25.08 1.6-.96 1.74-1.35.15-.4-2.4-.46-3.4-.1-.46.15 1.06 1.27 1.65 1.45zM16.9 6c.3-.05.61-.08.9-.08.42 0 .76.05 1.03.16l.2.07.05.22c.16.7-.11 2.44-.57 3.34A9.39 9.39 0 0016.9 6zM2.67 9.5c-.5-.43-.69-2.59-.46-3.33L2.27 6l.17-.06a2 2 0 01.6-.08c.58 0 1.28.17 1.82.43-.9.81-1.7 1.84-2.19 3.2z"/></g></svg>',
        laugh_70618: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23863F01" d="M4.22 7.49c.32-.1 1.06-.31 1.86-.14.8.18.3-.49-.15-.67-.46-.2-1.26.02-1.61.35-.36.34-.66.64-.1.46zm6.74-.85a2 2 0 011.86.53c.23.2-.2.28-.44.15a3.97 3.97 0 00-1.92-.22c-.64.14-.05-.35.5-.46z"/><path fill="%23462000" d="M10 12.04c-.04-.59.33-3.4 1.68-3.37 1.98.04 1.64 2.77 1.62 3.46-.02.5-.72.4-.75-.1-.03-.46.02-2.36-1.04-2.3-.6.04-.7 1.94-.74 2.36-.04.43-.74.55-.78-.05zm-6.88 0c-.03-.59.34-3.4 1.69-3.37 1.98.04 1.64 2.78 1.62 3.46-.02.51-.72.4-.75-.1-.03-.46.02-2.36-1.04-2.3-.6.04-.7 1.94-.74 2.37-.04.42-.74.54-.78-.05zm.54 2.69c-.04-.35.2-.42.27-.43 1.4-.16 7.03.1 8.14.3.27.05.94.63.62 1.36a4.72 4.72 0 01-4.32 2.67c-2.35 0-4.43-1.68-4.7-3.9z"/><path fill="%23CF4324" d="M7.62 18.11a2.6 2.6 0 014.1-1.61 4.08 4.08 0 01-4.1 1.61z"/><path fill="%23FF7B5F" d="M8.4 17.2c.18-.23.78-.75 1.3-.8.53-.06.2.25-.12.38-.31.12-.66.4-.88.68-.23.29-.49 0-.3-.26z"/></g></svg>',
        lipstick_484aa: '<svg xmlns="http://www.w3.org/2000/svg" width="23" height="20" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="a" d="M1.56.07C.86-.03.2.63.07 1.55-.06 2.47.4 3.3 1.1 3.4c.7.1 1.36-.57 1.49-1.48C2.71.99 2.25.16 1.56.07z"/><path id="c" d="M.09.79C.3.35.69.05 1.1.06c.66.01 1.18.73 1.17 1.6-.01.88-.56 1.58-1.22 1.57-.4 0-.77-.29-.97-.7V.78z"/></defs><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M10.31 5.1c1.94-1.33 3.62-1.63 3.97-2.91.2-.76.07-1.2-.7-2.19 2.25.75 3.56 1.82 3.88 2.7.53 1.44-.17 3.04.52 3.18.66.14 1.13-.93 1-1.92 2.18 1.97 3.6 4.2 3.7 7.82.14 4.3-3.08 8.22-8.24 8.22-4.57 0-8.28-3.45-8.28-7.69 0-3.91 2.21-5.86 4.15-7.2z"/><path fill="%23002942" d="M4.3 13.02l-1.07-2.57c-.09-.2-.3-.33-.54-.34-.26-.02-1.04-.04-1.69-.05a.63.63 0 00-.6.86l1.3 3.2-.12.11a.11.11 0 00-.03.13l2.08 4.94c.04.1.15.18.27.18.29-.02.86-.07 1.4-.3a4.97 4.97 0 001.28-.84.29.29 0 00.07-.32L4.58 13.1a.11.11 0 00-.1-.07H4.3z"/><path fill="%2395001D" d="M4.46 12.92l-1.12-2.67c-.09-.21-.32-.34-.59-.34H.73a.63.63 0 00-.58.87l1.37 3.39-.14.12a.11.11 0 00-.03.13l2.15 5.13c.05.11.16.18.28.17.32-.02.96-.1 1.6-.36.64-.27 1.2-.7 1.46-.93.1-.08.12-.2.08-.32l-2.15-5.13a.11.11 0 00-.11-.07l-.2.01z"/><path fill="%23FF9200" d="M1.94 14.47v-.04l.03-.03c.19-.05.9-.27 1.24-.41a14.52 14.52 0 001.15-.58l.03.03 1.9 4.53c.02.05.01.11-.03.15-.16.16-.58.54-1.07.75-.5.2-1.01.22-1.22.22a.14.14 0 01-.13-.1l-1.9-4.52z"/><path fill="%23FEBB34" d="M4.11 13.53l-.23.13 2.01 4.78.21-.17-1.99-4.74z"/><path fill="%23D36200" d="M2.04 14.38L4 19.08c.2 0 .61-.01 1.02-.16L3 14.07c-.32.12-.75.25-.95.31z"/><path fill="%23CF4324" d="M4.08 13.23L3 10.66a.49.49 0 00-.44-.3l-1.47-.05a.43.43 0 00-.41.6L2 14.1c.29-.09.8-.25 1.1-.37.27-.12.72-.36.97-.5z"/><path fill="%23F29E9A" d="M2.03 10.49c.11 0 .49.03.64.13.14.1.33.61.45.9.1.24-.18.35-.3.08-.07-.2-.25-.65-.33-.74-.06-.07-.35-.09-.48-.11-.18-.03-.15-.28.02-.26zm-.5-.01a.14.14 0 00-.08.18c.03.07.12.1.19.07s.1-.11.08-.18a.14.14 0 00-.19-.07z"/><path fill="%2395001D" d="M5.89 16.64l.14.34a7.02 7.02 0 01-2.7 1.16l-.15-.34a7.05 7.05 0 002.7-1.16zm3.13-4.67c-.73-.23-1.22-.81-1.22-.81l.55-.22a2.7 2.7 0 01-.27-.26l.51-.2v-.08c.17-1.12 1.39-2.1 2.42-2.02.65.06 1.68.76 1.41 2.55-.17 1.11-1.19 1.73-2.23 1.65a1.69 1.69 0 01-1.17-.6zm10.18-1.1c-.12-1.1-.88-2.02-1.87-2.08-1.12-.06-2.11.77-2.2 2.05-.1 1.28.74 2.65 1.86 2.71.49.03.94-.14 1.32-.44 1.3-.13 2.22-1 2.22-1l-1.01-.4c.4-.25.63-.47.63-.47l-.95-.38z"/><path fill="%23FFF" d="M17.1 9.25c-1.04-.06-1.95 1.05-2.04 2.48-.1 1.44.68 2.66 1.72 2.72 1.04.07 1.96-1.04 2.05-2.48.09-1.43-.69-2.65-1.73-2.72zM11 8.86c-.98-.1-1.89.91-2.03 2.26-.14 1.35.54 2.52 1.51 2.63.98.1 1.89-.91 2.03-2.26.14-1.35-.54-2.52-1.51-2.63z"/><g transform="translate(15.03 10.78)"><mask id="b" fill="%23fff"><use xlink:href="%23a"/></mask><path fill="%23652700" d="M2.08-1.52C1.04-1.6.12-.48.03.96-.06 2.39.71 3.6 1.75 3.67 2.8 3.74 3.71 2.63 3.8 1.2c.1-1.43-.68-2.65-1.72-2.71z" mask="url(%23b)"/></g><g transform="translate(8.86 10.23)"><mask id="d" fill="%23fff"><use xlink:href="%23c"/></mask><path fill="%23652700" d="M2.13-1.36C1.15-1.46.25-.46.1.89c-.14 1.35.54 2.53 1.52 2.63.98.1 1.88-.9 2.03-2.25.14-1.35-.54-2.53-1.52-2.63z" mask="url(%23d)"/></g><path fill="%23BF6600" d="M12.55 7.56c-.14-.24-.68-.84-1.15-.85-.47-.01-1.14.42-1.3.61-.16.2-.06.34.33.19.38-.15.5-.26.87-.22.38.04.79.32 1 .5.2.17.39 0 .25-.23zm6.37.5c-.16-.25-.85-.97-1.4-.99-.54 0-1.03.26-1.44.87-.15.22.11.34.28.18.33-.33.74-.45 1.18-.41.44.04.84.4 1.08.56.23.18.46.02.3-.22zm-2.39 7.36a.33.33 0 10.07.65.33.33 0 00-.07-.65z"/><path fill="%23CF4324" d="M15.22 16.31c-.47-1.02-1.54-2-1.98-1.99-.45.01-.8.4-.96.38-.16-.01-.39-.33-.57-.36-.16-.03-1.27.2-1.67 1.24.2 1.06 1.11 1.98 2.51 2.14 1.4.17 2.34-.56 2.67-1.4z"/><path fill="%2395001D" d="M13 16.18c-.17-.16-.37-.79-1.07-.36.27.31.71.44 1.07.36z"/><path fill="%23F29E9A" d="M14.22 15.48c-.13-.13-.7-.65-.9-.68-.2-.03-.22.26-.04.35.17.1.65.43.76.55.12.13.35-.06.18-.22zm-2.49.57c-.16-.08-.65-.25-.78-.17-.14.08-.12.25.06.23.17-.02.53.1.65.17s.23-.14.07-.23z"/></g></svg>',
        lol_b5c8d: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23462000" d="M3.78 14.54c-.05-.34.19-.41.26-.42 1.37-.16 6.85.1 7.93.3.27.04.92.6.6 1.32a4.6 4.6 0 01-4.2 2.6c-2.3 0-4.32-1.64-4.6-3.8z"/><path fill="%23CF4324" d="M7.64 17.84a2.53 2.53 0 014-1.58 3.98 3.98 0 01-4 1.58z"/><path fill="%23FF7B5F" d="M8.4 16.95c.17-.23.76-.74 1.27-.79.51-.06.19.25-.12.37-.31.13-.65.4-.86.67-.22.28-.48 0-.29-.25z"/><path fill="%23462000" d="M10.1 12.27c-.03-.56.33-3.23 1.6-3.2 1.89.03 1.57 2.63 1.54 3.28-.01.48-.68.37-.7-.09-.04-.44.24-2.26-.78-2.2-.57.03-.88 1.85-.92 2.26-.04.4-.7.51-.74-.05zm-6.52 0c-.03-.56.32-3.22 1.6-3.2 1.88.04 1.56 2.63 1.54 3.28-.01.49-.68.38-.71-.09-.03-.44.2-2.2-.81-2.15-.57.03-.84 1.8-.88 2.21-.04.4-.7.52-.74-.05z"/><path fill="%23863F01" d="M4.2 8.1c.3-.1 1.05-.3 1.85-.13.8.17.3-.5-.15-.68-.46-.19-1.34-.12-1.7.22-.35.33-.57.77 0 .6zm6.75-1.09c.93-.2 1.44.35 1.8.67.22.2-.15.38-.4.25a3.97 3.97 0 00-1.92-.22c-.64.14-.03-.58.52-.7z"/><path fill="%234582C3" d="M14.53 12.78a.26.26 0 00-.14.15c-.35.97-.65 2.17.13 2.84.4.33.93.42 1.4.22.48-.2.78-.66.77-1.18-.02-1.08-1.13-1.68-1.96-2.03a.25.25 0 00-.2 0"/><path fill="%239AC8F9" d="M14.7 13.11c.9.39 1.68.89 1.7 1.7 0 .43-.25.75-.59.9-.32.14-.73.1-1.06-.17-.63-.54-.36-1.59-.06-2.43"/><path fill="%23FFF" d="M16.11 15.09c.08-.2.05-.4-.07-.45-.13-.05-.3.06-.38.26-.08.19-.05.39.08.44.12.06.29-.06.37-.25z"/><path fill="%234582C3" d="M2.84 12.64a.26.26 0 00-.2 0c-.97.35-2.09.9-2.1 1.92 0 .52.28.98.73 1.2.47.25 1.01.18 1.4-.16.82-.71.56-1.94.3-2.8a.25.25 0 00-.13-.16"/><path fill="%239AC8F9" d="M2.7 12.98c.28.94.4 1.87-.21 2.4a.95.95 0 01-1.07.13c-.31-.16-.55-.5-.55-.93 0-.82.99-1.29 1.82-1.6"/><path fill="%23FFF" d="M1.07 14.66c.02.2.14.37.27.36.14-.02.23-.2.21-.4-.02-.22-.14-.38-.27-.37-.14.02-.23.2-.21.4z"/></g></svg>',
        love_c7110: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23462000" d="M3.66 14.73c-.04-.35.2-.42.27-.43 1.4-.16 7.03.1 8.14.3.27.05.94.63.62 1.36a4.72 4.72 0 01-4.32 2.67c-2.35 0-4.43-1.68-4.7-3.9z"/><path fill="%23CF4324" d="M7.62 18.11a2.6 2.6 0 014.1-1.61 4.08 4.08 0 01-4.1 1.61z"/><path fill="%23FF7B5F" d="M8.4 17.2c.18-.23.78-.75 1.3-.8.53-.06.2.25-.12.38-.31.12-.66.4-.88.68-.23.29-.49 0-.3-.26z"/><path fill="%23BC6C00" d="M5.26 9.2c.4-1.28 1.6-1.5 2.3-1.09.69.4.87 1.42.45 2.55-.29.84-1.23 1.8-2.05 2.47-.99-.35-2.21-.92-2.77-1.6-.78-.92-.97-1.94-.45-2.56.5-.62 1.71-.83 2.52.23z"/><path fill="%23940F00" d="M4.94 8.37c.86-1.24 2.49-1.08 2.94.04.45 1.12.11 2.75-2.1 4.52-2.1-.71-3.51-1.71-3.58-3.27-.07-1.55 1.65-2.03 2.74-1.3z"/><path fill="%23D7301C" d="M5.06 9.04c.34-1.11 1.4-1.3 2-.95.6.35.76 1.24.4 2.23a5.89 5.89 0 01-1.79 2.15c-.87-.3-1.93-.8-2.42-1.4-.68-.8-.84-1.69-.4-2.23.45-.54 1.5-.72 2.2.2z"/><path stroke="%23FF7B5F" stroke-width=".5" d="M4.28 9.05c-.34-.32-.92-.18-1.11.14-.19.32-.13.95.3 1.31" stroke-linecap="round" stroke-linejoin="round"/><path fill="%23BC6C00" d="M12.47 9.27c.81-1.06 2.02-.85 2.53-.24.51.62.34 1.64-.44 2.55-.56.7-1.78 1.27-2.77 1.63-.81-.67-1.77-1.63-2.05-2.46-.43-1.13-.25-2.15.44-2.56.69-.4 1.9-.2 2.3 1.08z"/><path fill="%23940F00" d="M12.46 8.38c1.23-.87 2.7-.16 2.74 1.05.04 1.2-.83 2.61-3.51 3.52-1.73-1.38-2.72-2.8-2.25-4.29.46-1.49 2.25-1.34 3.02-.28z"/><path fill="%23D7301C" d="M12.34 9.06c.7-.93 1.75-.75 2.2-.22.45.54.3 1.43-.39 2.23-.48.6-1.54 1.1-2.41 1.42a5.89 5.89 0 01-1.8-2.15c-.36-.98-.2-1.87.4-2.23.6-.35 1.65-.17 2 .95z"/><path stroke="%23FF7B5F" stroke-width=".5" d="M11.6 8.8c-.2-.42-.8-.49-1.09-.25-.28.23-.45.84-.17 1.33" stroke-linecap="round" stroke-linejoin="round"/></g></svg>',
        mad_fa9ae: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><defs><linearGradient id="a" x1="62.65%" x2="43.97%" y1="91.76%" y2="13.59%"><stop stop-color="%23F25757" offset="0%"/><stop stop-color="%23FF053F" offset="100%"/></linearGradient></defs><g fill="none" fill-rule="evenodd"><path fill="url(%23a)" d="M4.02 5.85l.04-.03c1.58-1.03 4-1.5 4.4-3.03.2-.76-.06-1.8-.82-2.79 2.25.75 3.56 1.82 3.88 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.44-8.27-7.69a7.19 7.19 0 011.7-4.67 8.13 8.13 0 012.1-1.8z"/><path fill="%23F0F2F3" d="M4.86 14.35c-1.17 0-3.1-.99-2.69-3.92l4.84 1.91c-.11.7-.98 2-2.15 2z"/><path fill="%235D2A00" d="M4.68 13.34c.54 0 .7-.61.7-1.22 0-.6-.4-.87-.7-.87-.3 0-.7.27-.7.87s.16 1.22.7 1.22z"/><path fill="%23F0F2F3" d="M14.54 10.13c.4 1.45 0 4.21-2.24 4.49-2.23.27-2.76-1.65-2.89-2.36.57-.17 5.13-2.13 5.13-2.13z"/><path fill="%23462000" d="M1.97 9.63l4.93 2.33.38-1.2c.03-.12.26-.22.39-.2.13.03.26.22.24.35l-.32 1.73-.03.09c-.09.17-.33.37-.5.29L1.7 10.16c-.12-.06-.15-.28-.1-.4.07-.13.37-.13.37-.13z"/><path fill="%235D2A00" d="M11.53 13.44c.53 0 .7-.52.7-1.13 0-.6-.4-.83-.7-.83-.3 0-.69.23-.69.83s.17 1.13.7 1.13z"/><path fill="%23462000" stroke="%23462100" stroke-width=".2" d="M5.65 16.92a7.3 7.3 0 011.23-1.27c.2-.04 2.16-.06 2.39 0 .15.05.94.9 1.16 1.27a.27.27 0 10.47-.28c-.2-.32-1.11-1.4-1.47-1.52-.3-.1-2.48-.04-2.7 0-.38.1-1.37 1.28-1.51 1.48-.1.12-.07.3.06.38.04.04.1.05.15.05.09 0 .17-.03.22-.1z"/><path fill="%23DA370E" d="M8.19 16.34c-.84-.08-1.77.55-1.51 1.1.25.56 2.63.69 2.87 0 .25-.67-.86-1.05-1.36-1.1"/><path fill="%23462000" d="M9.25 10.7l.35 1.21 5.12-2.18a.3.3 0 01.4.15c.07.15-.04.55-.2.62l-5.45 2.53c-.45.1-.46-.26-.5-.47l-.37-1.68c-.03-.16.1-.33.24-.38.16-.05.36.04.41.2z"/><path d="M10.68 6.68l.05.1c.04.07.08.16.17.25.15.18.41.4.75.48.33.1.7.02.92-.11.22-.13.3-.26.32-.26a.18.18 0 10-.24-.27c0-.01-.1.07-.27.12a.93.93 0 01-.6.02 1.7 1.7 0 01-.56-.3l-.17-.14L11 6.5a.18.18 0 00-.25-.05.18.18 0 00-.07.2l.01.03zm-1.28.87s.1.1.27.23c.16.13.34.3.38.5.06.2 0 .44-.06.63s-.12.32-.12.32c-.05.1-.01.2.08.24.08.04.17.02.22-.05l.07-.09c.04-.05.1-.13.16-.24.06-.1.12-.24.16-.4.04-.16.03-.36 0-.55a1.28 1.28 0 00-.63-.73l-.34-.17h-.01a.18.18 0 00-.24.1c-.03.08 0 .16.06.21m2.21 2.16l.12-.34c.07-.2.16-.42.33-.53.16-.12.41-.15.61-.16h.35c.1.02.19-.06.2-.16a.18.18 0 00-.13-.19l-.1-.03c-.07-.02-.17-.05-.3-.06a1.42 1.42 0 00-.42 0c-.17 0-.35.08-.51.19-.32.24-.43.6-.47.83-.03.24-.03.38-.03.38v.01c0 .1.08.19.18.19.08 0 .15-.05.17-.13" fill="%23C12802"/></g></svg>',
        nerd_57277: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23B55500" d="M3.85 8.13c.25-.13.84-.39 1.52-.33s.25-.41-.15-.52c-.4-.11-1.08.06-1.34.39-.26.32-.24.57-.03.46zm7.09-.87c.66-.1 1.18.31 1.44.67.16.23-.14.36-.31.2a3.17 3.17 0 00-1.38-.44c-.46 0-.15-.37.25-.43z"/><path fill="%23FFF" d="M8.7 9.64l.36.04-.27 1.66-.2-.05v.01l-.7.04v-.06h-.03L7.5 9.66l.3-.05-.01-.08h.9zm-3.1 4.28c-.38.22-2.57.61-3.56-.08-.99-.7-.9-2.87-.86-3.03.03-.12 3.65-1.09 5.57-.06.48.24-.28 2.67-1.15 3.17zm9.03-.08c-.99.7-3.17.3-3.54.08-.87-.5-1.63-2.93-1.16-3.18 1.92-1.03 5.53-.06 5.56.05.05.19.13 2.36-.86 3.05z"/><path fill="%2343260C" d="M7.76 11.41c-.13.66-.7 2.54-1.27 3-.64.51-3.24 1.15-4.9.25-1.24-.68-1.24-3.32-1.37-3.7-.52-.1-.43-1.16-.05-1.33.28-.13 3.7-1.01 7.2.05l-.03-.13.32-.06v-.1h1.18l.01.01v.11l.35.04h.01l-.03.2c.51-.1 1.95-.57 2.99-.57 1.17 0 3.6.25 4.34.34.35.14.52 1.27 0 1.47-.13 1.15-.57 2.95-1.03 3.33-.47.39-2.36 1.36-5.12.21-.9-.38-1.28-2.73-1.43-3.27l-.02.17h-.02l-.23-.06v-.01l-.9.05zM5.6 13.92c-.38.22-2.57.61-3.56-.08-.99-.7-.9-2.87-.86-3.03.03-.12 3.65-1.09 5.57-.06.48.24-.28 2.67-1.15 3.17zm9.03-.08c-.99.7-3.17.3-3.54.08-.87-.5-1.63-2.93-1.16-3.18 1.92-1.03 5.53-.06 5.56.05.05.19.13 2.36-.86 3.05zM8.7 9.53h-.9l.09 1.74.7-.04.11-1.7zm.13.12l-.1 1.6.06.02.26-1.6-.22-.02zm-1.33 0l.21.93-.05-.95-.16.03z"/><path fill="%23652700" d="M12.14 10.8c.5 0 .92.6.92 1.33 0 .73-.41 1.32-.92 1.32-.5 0-.92-.6-.92-1.32 0-.73.41-1.33.92-1.33zm-7.43 0c.5 0 .92.6.92 1.33 0 .73-.41 1.32-.92 1.32-.5 0-.92-.6-.92-1.32 0-.73.41-1.33.92-1.33z"/><path stroke="%23462000" stroke-width=".85" d="M6.17 16.14c.73 1.56 3.68 1.73 4.55.03" stroke-linecap="round"/></g></svg>',
        ninja_771d8: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="a" d="M2.47.81C1.52.77.64 1.81.53 3.17c-.1 1.36.34 2.5 1.44 2.54 1.31.05 1.8-1.03 1.9-2.39.11-1.35-.44-2.47-1.4-2.5z"/><path id="c" d="M2 .73C1.05.7.17 1.73.06 3.1-.04 4.45.4 5.6 1.5 5.63c1.31.05 1.8-1.03 1.9-2.39C3.52 1.9 2.97.77 2 .74z"/></defs><g fill="none" fill-rule="evenodd"><ellipse cx="16.15" cy="14.58" fill="%23000" rx="1.5" ry="1.58"/><path fill="%23000" d="M16.96 14.49a2.34 2.34 0 012.97-2.99 2.64 2.64 0 01-2.97 2.99zm-.68.45a2.5 2.5 0 012.7 3.58l-.42-.03a2.8 2.8 0 01-2.28-3.55z"/><path fill="%23000" d="M4.02 5.85l.04-.03c1.58-1.03 4-1.5 4.4-3.03.2-.76-.06-1.8-.82-2.79 2.25.75 3.56 1.82 3.88 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.44-8.27-7.69a7.19 7.19 0 011.7-4.67 8.13 8.13 0 012.1-1.8z"/><path fill="%23FFC415" d="M2.75 12.36A4.55 4.55 0 016.2 8.08s1.41-.36 2.24-.36c.83 0 2.15.35 2.15.35a4.58 4.58 0 013.43 4.29v.42a2 2 0 01-2 2H4.75a2 2 0 01-2-2v-.42z"/><g transform="translate(3.22 8.47)"><mask id="b" fill="%23fff"><use xlink:href="%23a"/></mask><use fill="%23FFF" xlink:href="%23a"/><path fill="%23462000" d="M3.12 1.6c.83 0 1.03.75 1.03 1.68 0 .92-.39 1.67-1.03 1.67-.82 0-1.03-.75-1.03-1.67 0-.93.46-1.68 1.03-1.68z" mask="url(%23b)"/></g><g transform="translate(9.07 8.47)"><mask id="d" fill="%23fff"><use xlink:href="%23c"/></mask><use fill="%23FFF" xlink:href="%23c"/><path fill="%23462000" d="M2.65 1.52c.83 0 1.03.75 1.03 1.68 0 .92-.39 1.67-1.03 1.67-.82 0-1.03-.75-1.03-1.67 0-.93.46-1.68 1.03-1.68z" mask="url(%23d)"/></g></g></svg>',
        nutella_474f8: '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23A54A0C" d="M17.43 17.4c-.5 0-.97-.19-1.33-.53l-.62-.59a1.9 1.9 0 01-.6-1.37V9.97c0-.44.16-.87.44-1.2l.74-.9c.37-.43.9-.68 1.48-.68h4.99c.57 0 1.11.25 1.48.69l.74.88c.28.34.44.77.44 1.21v4.94a1.9 1.9 0 01-.6 1.37l-.62.6c-.36.33-.83.52-1.33.52h-5.21z"/><path fill="%230F0F0F" d="M22.53 6.94h-4.99c-.65 0-1.26.28-1.67.78l-.74.88c-.32.39-.5.87-.5 1.37v4.94c0 .58.25 1.15.67 1.55l.62.6c.41.38.94.59 1.5.59h5.22c.56 0 1.1-.21 1.5-.6l.63-.59c.42-.4.67-.97.67-1.55V9.97c0-.5-.18-.98-.5-1.37l-.74-.88a2.18 2.18 0 00-1.67-.78m0 .5c.5 0 .96.22 1.28.6l.74.88c.25.3.38.67.38 1.05v4.94c0 .45-.18.88-.51 1.2l-.63.58c-.3.3-.72.46-1.15.46h-5.21c-.43 0-.84-.17-1.16-.46l-.62-.59a1.64 1.64 0 01-.51-1.19V9.97c0-.38.13-.75.38-1.05l.74-.88c.31-.38.79-.6 1.28-.6h4.99"/><path fill="%23E5E5E5" d="M15.13 9.9h9.81v5.27h-9.81z"/><path fill="%23000" d="M17.05 12.2h-.64a.4.4 0 01-.4-.4v-.81c0-.22.18-.4.4-.4h.64c.22 0 .4.18.4.4v.8a.4.4 0 01-.4.4"/><path fill="red" d="M23.8 12.22h-5.73a.4.4 0 01-.4-.4v-.8c0-.23.18-.4.4-.4h5.74c.22 0 .4.17.4.4v.8a.4.4 0 01-.4.4"/><path fill="%23A54A0C" d="M20.4 14.6h-3.13a.4.4 0 01-.4-.4v-1.17c0-.22.17-.4.4-.4h3.13c.22 0 .4.18.4.4v1.17a.4.4 0 01-.4.4"/><path fill="%23FFF" d="M23 14.6h-.53a.4.4 0 01-.4-.4v-1.17c0-.22.17-.4.4-.4H23c.22 0 .4.18.4.4v1.17a.4.4 0 01-.4.4"/><path fill="%23FFDC08" d="M21.43 14.6h-.03a.4.4 0 01-.4-.4c0-.21.18-.4.4-.4h.03c.22 0 .4.19.4.4a.4.4 0 01-.4.4"/><path fill="%2300B943" d="M16.34 14.6a.33.33 0 01-.33-.32v-.15c0-.18.15-.32.33-.32.18 0 .32.14.32.32v.15c0 .18-.14.32-.32.32m7.57 0a.3.3 0 01-.3-.3v-1.38c0-.16.14-.3.3-.3.17 0 .3.14.3.3v1.39a.3.3 0 01-.3.3"/><path fill="%23E5E5E5" d="M16.55 8.1a.96.96 0 01-.96-.95V6.4c0-.52.43-.95.96-.95h6.85c.53 0 .96.43.96.95v.75c0 .53-.43.95-.96.95h-6.85z"/><path fill="%230F0F0F" d="M23.4 5.2h-6.85a1.2 1.2 0 00-1.21 1.2v.75c0 .67.54 1.2 1.21 1.2h6.85a1.2 1.2 0 001.21-1.2V6.4c0-.66-.54-1.2-1.21-1.2m0 .5c.39 0 .7.31.7.7v.75a.7.7 0 01-.7.7h-6.85a.7.7 0 01-.7-.7V6.4c0-.39.31-.7.7-.7h6.85"/><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23863F01" d="M4.17 7.95c.31-.1 1.05-.31 1.86-.14.8.18.3-.49-.15-.68-.46-.18-1.26.02-1.62.36-.35.34-.66.63-.1.46zm6.74-.86a2 2 0 011.86.53c.23.2-.2.29-.44.15a3.97 3.97 0 00-1.92-.21c-.64.13-.05-.35.5-.47z"/><path fill="%23462000" d="M10.08 12.11c-.03-.56.32-3.22 1.6-3.2 1.88.04 1.56 2.63 1.54 3.28-.02.49-.68.38-.71-.09-.03-.44.02-2.24-1-2.18-.56.03-.65 1.84-.7 2.24-.03.4-.7.52-.73-.05zm-6.52 0c-.03-.56.32-3.22 1.6-3.2 1.88.04 1.56 2.64 1.54 3.28-.02.49-.68.38-.71-.08-.03-.44.02-2.25-1-2.19-.57.03-.66 1.84-.7 2.24-.03.4-.7.52-.73-.04zm.1 2.62c-.04-.35.2-.42.27-.43 1.4-.16 7.03.1 8.14.3.27.05.94.63.62 1.36a4.72 4.72 0 01-4.32 2.67c-2.35 0-4.43-1.68-4.7-3.9z"/><path fill="%23CF4324" d="M7.62 18.11a2.6 2.6 0 014.1-1.61 4.08 4.08 0 01-4.1 1.61z"/><path fill="%23FF7B5F" d="M8.4 17.2c.18-.23.78-.75 1.3-.8.53-.06.2.25-.12.38-.31.12-.66.4-.88.68-.23.29-.49 0-.3-.26z"/></g></svg>',
        onion_7ee7d: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%2300B14C" d="M8.86 2.54C10.49.28 12.94 1 12.94 1c-2.01.6-2.6 2.2-1.82 2.84 0 0-1.1-.07-1.43-.3a5.69 5.69 0 01-.83-.99"/><path fill="%2373F91C" d="M11.25.01s-1.48.66-1.3 3.43c.09 1.33-1.82-.82-1.6-1.6 0 0-.02-1.8 2.9-1.83z"/><path fill="%23FFD967" d="M7.94 3.24c-.15.67-3.83.68-6.1 3.29-2.25 2.6-2.15 7.85.48 10.14 3.16 2.75 8.22 2.81 11.44 1.14 3.21-1.66 3.89-7.46 1.7-10.17-1.23-1.54-4.51-3.79-5.2-4.5C8.93 1.77 8 .9 7.03.9c-.14 0-.28.02-.42.05 0 0 1.81.24 1.33 2.3z"/><path fill="%23EE9123" d="M14.63 6.76c.72 3.1 2.06 7.3-3.88 10.45-3.12 1.67-7.41-.35-9.24-1.45.24.34.5.64.81.9a9.04 9.04 0 003.51 1.86c-.34.18-.67.41-.45.57.42.29 1.51-.01 1.51-.01s.3.88.7.9c.4.03.99-.83.99-.83s.9.93 1.25.86c.35-.08 0-.71-.27-1.1 1.52-.09 2.99-.47 4.2-1.1 3.21-1.66 3.99-7.53 1.7-10.17-.26-.32-.54-.6-.83-.88z"/><path fill="%23FFA24F" d="M3.75 6.75a3.7 3.7 0 011.87-.14c.82.18.31-.5-.15-.68-.46-.2-1.27.02-1.63.36-.36.34-.66.64-.1.46zm6.8-.86c.95-.2 1.53.21 1.9.53.22.2-.2.29-.46.15a4.01 4.01 0 00-1.94-.22c-.64.14-.04-.35.5-.46z"/><path fill="%23462000" d="M9.72 10.96c-.03-.57.06-3.26 1.43-3.24 2.02.04 1.96 2.66 1.94 3.32-.02.49-.74.38-.77-.09-.02-.44.03-2.27-1.06-2.21-.61.03-.7 1.86-.75 2.27-.04.4-.75.52-.79-.05zm-6.82.02c-.03-.57.2-3.29 1.85-3.25 1.9.03 1.58 2.66 1.55 3.31-.01.5-.69.38-.72-.09-.02-.44.16-2.26-.86-2.2-.95.06-1.03 1.87-1.07 2.28-.04.4-.71.52-.75-.05zm.6 1.97c-.05-.34.2-.41.26-.42 1.4-.16 7.03.1 8.15.3.27.05.94.63.61 1.36a4.72 4.72 0 01-4.31 2.67c-2.36 0-4.44-1.69-4.71-3.9z"/><path fill="%23CF4324" d="M7.45 16.34a2.6 2.6 0 014.11-1.61 4.08 4.08 0 01-4.1 1.6z"/><path fill="%23FF7B5F" d="M8.24 15.43c.17-.23.78-.75 1.3-.81.53-.06.2.26-.12.38-.32.13-.66.4-.89.69-.22.28-.48 0-.29-.26z"/></g></svg>',
        party_ae2b6: '<svg xmlns="http://www.w3.org/2000/svg" width="29" height="20"><g fill="none" fill-rule="evenodd"><g fill="%23FF9302" transform="translate(19.21 1.35)"><rect width="1" height="3" x="3.8" y="1.57" transform="rotate(37 4.3 3.07)" rx=".5"/><rect width="1" height="3.76" x="6.66" y="3.74" transform="rotate(65 7.16 5.62)" rx=".5"/><rect width="1" height="3.53" x="6.33" y="1.82" transform="rotate(52 6.83 3.59)" rx=".5"/><rect width=".77" height="2.57" x="1.71" y="2.32" transform="rotate(19 2.21 3.6)" rx=".38"/><rect width=".77" height="2.57" x="3.34" y="4.49" transform="rotate(47 3.84 5.77)" rx=".38"/><rect width="1.01" height="3.01" x="4.77" y="6.73" transform="rotate(80 5.27 8.24)" rx=".5"/><rect width="1" height="3" x="5.66" y="9.59" transform="rotate(108 6.16 11.09)" rx=".5"/><rect width=".91" height="2.89" x="5.62" y="11.55" transform="rotate(119 6.12 13)" rx=".46"/><rect width=".71" height="2.82" x="6.87" y="8.15" transform="rotate(91 7.37 9.56)" rx=".35"/><rect width=".87" height="2.46" x="3.38" y="12.09" transform="rotate(137 3.88 13.32)" rx=".44"/><rect width="1" height="3" x=".23" y=".68" transform="rotate(4 .73 2.18)" rx=".5"/><circle cx="8.55" cy="11.96" r=".5"/><circle cx="5.92" cy=".58" r=".5"/><circle cx="8.17" cy="7.74" r=".5"/><circle cx="5.86" cy="15.48" r=".5"/><circle cx="4.58" cy="6.82" r=".42"/><circle cx="2.87" cy="1.3" r=".42"/></g><g fill="%23FF9302" transform="rotate(-139 5.69 7.7)"><rect width="1" height="4.1" x="4.04" y=".58" transform="rotate(37 4.54 2.63)" rx=".5"/><rect width="1" height="3.76" x="7.28" y="3.68" transform="rotate(69 7.78 5.56)" rx=".5"/><rect width="1" height="3.53" x="5.6" y="2.09" transform="rotate(54 6.1 3.86)" rx=".5"/><rect width=".77" height="2.57" x="1.63" y="2.32" transform="rotate(19 2.13 3.6)" rx=".38"/><rect width="1" height="2.57" x="3.46" y="5.78" transform="rotate(69 3.96 7.07)" rx=".5"/><rect width="1.01" height="3.01" x="7.18" y="6.29" transform="rotate(80 7.69 7.8)" rx=".5"/><rect width="1" height="3" x="5.58" y="9.59" transform="rotate(108 6.08 11.09)" rx=".5"/><rect width=".91" height="2.89" x="5.53" y="11.55" transform="rotate(119 6.03 13)" rx=".46"/><rect width="1.18" height="4.5" x="7.89" y="7.46" transform="rotate(91 8.48 9.7)" rx=".59"/><rect width=".87" height="2.46" x="4.04" y="12.92" transform="rotate(137 4.54 14.15)" rx=".44"/><rect width="1" height="3" x=".14" y=".68" transform="rotate(4 .64 2.18)" rx=".5"/><circle cx="8.4" cy="11.82" r=".5"/><circle cx="5.39" cy="8.19" r=".5"/><circle cx="11.62" cy="9.72" r=".5"/><circle cx="6.18" cy="15.8" r=".5"/><circle cx="3.95" cy="5.4" r=".42"/><circle cx="2.79" cy="1.3" r=".42"/></g><path fill="%23FFB612" d="M10.37 5.1c1.93-1.33 3.62-1.63 3.96-2.91.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23B55500" d="M10.12 7.95c.31-.1 1.05-.31 1.85-.14.8.18.31-.49-.15-.68-.45-.18-1.25.02-1.6.36-.36.34-.67.63-.1.46zm6.74-.86a2 2 0 011.86.53c.23.2-.2.29-.44.15a3.97 3.97 0 00-1.92-.21c-.64.13-.05-.35.5-.47z"/><path fill="%23462000" d="M15.62 12.11c-.03-.56.32-3.23 1.6-3.2 1.88.03 1.56 2.63 1.54 3.28-.02.49-.69.38-.71-.09-.03-.44.02-2.24-1-2.18-.57.03-.66 1.84-.7 2.24-.04.4-.7.52-.73-.05zm-6.52 0c-.04-.56.32-3.22 1.6-3.2 1.88.04 1.56 2.64 1.54 3.28-.02.49-.69.38-.72-.08-.02-.44.03-2.25-.99-2.2-.57.04-.66 1.85-.7 2.25-.04.4-.7.52-.73-.04z"/><path stroke="%23EA114F" stroke-width=".75" d="M23.13 3.25c.51.97 1.07 2.97 2.67 2.2 1.6-.76.49-2.65-.52-1.9-1.01.74-1.67 2.84-1.12 4.39.56 1.55 2.7 1.67 2.82.1.1-1.57-2.45-1-2.37 2.97.03 1.78 1.74 3.07 2.31 1.88M3.9 9.47c.06-.95.57-2.63-1.08-3.06-1.66-.43-1.68 1.5-.5 1.6 1.16.1 2.71-.93 3-2.3.3-1.38-1.36-2.73-2.2-1.74-.85 1 1.49 2.12 3.34-.6.82-1.21.06-3.1-.97-2.63" stroke-linecap="round"/><path fill="%23462000" d="M9.52 14.67c-.05-.35.2-.42.26-.42 1.41-.16 7.03.1 8.15.3.27.05.94.63.61 1.36a4.72 4.72 0 01-4.31 2.66c-2.36 0-4.44-1.68-4.71-3.9z"/><path fill="%23CF4324" d="M13.48 18.06a2.6 2.6 0 014.1-1.62 4.08 4.08 0 01-4.1 1.62z"/><path fill="%23FF7B5F" d="M14.26 17.14c.17-.22.78-.75 1.3-.8.53-.06.2.25-.12.38s-.66.4-.89.69c-.22.28-.48 0-.29-.27z"/></g></svg>',
        pirate_a6d26: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 8 3.48 8.33 2.2c.2-.77.07-1.22-.7-2.2 2.26.75 3.57 1.82 3.9 2.7.52 1.44-.18 3.04.5 3.18.67.14 1.13-.93 1-1.92 2.2 1.97 3.6 4.2 3.7 7.82.15 4.3-3.07 8.22-8.24 8.22C3.92 20 .2 16.55.2 12.3c0-3.9 2.2-5.85 4.15-7.2z"/><path stroke="%23462100" stroke-width=".5" d="M3 6c1.08.28 9.4 4.06 13.5 8.54" stroke-linecap="round"/><path fill="%23462000" d="M4.27 14.65c-.03-.5.55-.54.62-.54a31 31 0 017.3 1.22c.26.1.96.52.46 1.32a4.55 4.55 0 01-4.44 2.15 4.34 4.34 0 01-3.95-4.15z"/><path fill="%23FFF" d="M4.98 14.9c0-.2.1-.2.16-.2 1.1.02 4.07.3 6.3.98.5.15.9.4.4.97a4.09 4.09 0 01-3.6 1.53 3.6 3.6 0 01-3.26-3.27z"/><path fill="%23D1D5DB" d="M11.68 16.8c-.17.2-.35.36-.53.5l-.9.16.03-.57-1.6-.33c-.74-.17-.8-.47-.02-.35l2.04.34-.02.42 1-.17z"/><path fill="%23462000" d="M3.15 12.25c-.04-.62.35-3.58 1.77-3.55 2.08.04 1.73 2.92 1.7 3.64 0 .53-.75.4-.8-.1-.02-.5.2-2.46-.9-2.4-.64.04-.92 2-.96 2.46-.04.45-.78.57-.8-.05z"/><path fill="%23462100" d="M8.85 8.4c.9-.84 5-.77 5.9 2.06.36 1.15-.4 2.75-1.87 3.4-1.47.63-3.18.07-3.78-1.08-.6-1.15-1.16-3.5-.25-4.37z"/></g></svg>',
        police_058f2: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23ffb612" d="m4.02 5.85.04-.03c1.58-1.03 4-1.5 4.4-3.03.2-.76 2.74-.97 3.06-.08.53 1.43-.17 3.03.51 3.17.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.44-8.27-7.69a7.2 7.2 0 0 1 1.7-4.67 8.1 8.1 0 0 1 2.1-1.8z"/><path fill="%23462000" d="M6.28 16.9c1.22-.34 3.5-.43 4.67.1.14.06.34-.24.17-.36-1.07-.69-3.84-.84-5.24-.02-.12.07 0 .4.4.29z"/><path fill="%23d47400" d="M2.04 8.75c-.1.18-.37.57.45 1.14.82.58 2.91 2.6 7.62 1.94 4.7-.65 5.39-1.84 5.6-2.14-.02-.45-.2-1.31-.2-1.31s-13.37.18-13.47.37"/><path fill="%23f0f2f3" d="M5.19 14.64c-1.07 0-2.85-.9-2.47-3.6l4.44 1.76c-.1.64-.9 1.84-1.97 1.84"/><path fill="%23462000" d="M5.02 13.72c.5 0 .65-.57.65-1.12s-.37-.8-.65-.8c-.27 0-.64.25-.64.8s.15 1.12.64 1.12"/><path fill="%23f0f2f3" d="M14.05 10.77c.37 1.33 0 3.86-2.04 4.12-2.05.25-2.54-1.51-2.65-2.16.51-.16 4.7-1.96 4.7-1.96z"/><path fill="%23462000" d="m2.54 10.31 4.52 2.14.34-1.1c.03-.1.24-.2.36-.18s.24.2.22.32l-.3 1.58-.02.09c-.08.15-.3.34-.46.26L2.3 10.8c-.12-.05-.15-.26-.1-.37.06-.12.34-.12.34-.12m8.76 3.5c.48 0 .64-.48.64-1.04 0-.55-.36-.76-.64-.76-.27 0-.63.21-.63.76 0 .56.15 1.03.63 1.03z"/><path fill="%23462000" d="M9.2 11.3c.06.14.33 1.1.33 1.1l4.7-2c.13-.06.3 0 .36.14s-.04.51-.18.58c0 0-4.97 2.3-5 2.3-.41.1-.42-.23-.46-.42l-.34-1.54c-.02-.14.09-.3.22-.35.15-.04.33.04.38.19z"/><path fill="%23010d21" d="M1.02 7.04C.95 8 2.8 10.5 7.98 10.65c5.17.16 8.34-1.28 8.46-3.06.06-.83-.31-.7-1.06-1.95-.38-.63-3.91-.55-5.98-.6-2.58-.06-6.57-.63-7.2.2-.54.73-1.11 1-1.18 1.8"/><path fill="%23022e71" d="M2.4 5.97C1.92 5.54.49 4.3 1.88 2.54 3.28.77 6.8-.11 8.86.08c2.05.2 5.74.53 7.15 2.86.91 1.5.25 2.76-.44 3.3-.7 0-3.7.4-6.55.27-2.77-.12-5.82-.5-6.62-.54"/><path fill="%230055ab" d="m1.95 5.38-.02.53s2.05 1.4 6.58 1.5 7.2-1.02 7.2-1.02l-.01-.67c-.78-.09-4.54-.45-7.1-.51-2.56-.07-6.65.17-6.65.17"/><path fill="%23feca00" d="M8.63 3.36a2 2 0 0 0 2.42.5c0 1.02-.51 3.43-2.44 3.91-2.08-.44-2.47-3-2.48-3.89.62.58 1.97.05 2.5-.52"/><path fill="%23d8d8d8" d="M1.95 7.37c.1.47.39 1.32 2.5 1.94.65.19.62-.59.2-.67-.42-.07-1.9-.57-2.01-1.22-.12-.65-.78-.52-.69-.05"/></g></svg>',
        poo_115b2: '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="20"><g fill="none" fill-rule="evenodd" transform="translate(-.5 .6)"><path fill="%237B461A" d="M14.24 9.1c-.12-.5.21-.51-.4-1.07-.61-.55-3.6-2.27-1.3-3.34-4.9-.47-5 3.1-4.72 4.35-.92.18-2.86 1.01-2.01 3.15-.81.6-2.02 1.8-1.89 3.05.13 1.26 2.27 2.61 7.07 2.68 4.8.07 6.62-1.96 6.62-3.35 0-1.4-1.37-2.38-1.37-2.38.61-1.41-.89-3.45-2-3.1z"/><path fill="%2368360C" d="M15.88 9.9c.46.75.6.98.3 1.95s-1.8 2.04-2.58 2.23c-.77.18-5.41 1.14-6.95-.72-1.53-1.85-.76-1.05.2-.77s3.66.59 5.88 0c1.27-.33 3.1-1.1 3.15-2.7z"/><path fill="%2368360C" d="M16.97 13.13c-.12 2.25-2.62 3.3-5.74 3.6-2.94.27-4.87-.68-5.8-.96-.54-.16-1.4-.83-1.34-.29.14 1.17 3.1 2.3 6.9 2.44 2.56.1 5.86-.5 6.45-2.46.6-2.01-.18-1.92-.47-2.33zM12.6 7.1c-.26.15.49 1-.34 1.9-.83.9-1.56.75-2.3.64-.8-.11-1.3.42-.15.66.23.05 1.56.37 2.93-.1 1.38-.46 1.88-.96 1.5-1.57A9.59 9.59 0 0012.6 7.1z"/><path fill="%234F2C16" d="M14.1 10.1a.37.37 0 01-.35-.44l.05-.21c.12-.57.16-.8-.2-1.14l-.41-.32c-.79-.59-1.97-1.48-1.87-2.44.02-.19.08-.36.19-.52-1.32.07-2.3.6-2.87 1.54-.65 1.1-.55 2.38-.3 2.73a.37.37 0 01-.62.41c-.4-.58-.51-2.17.29-3.51.59-1 1.87-2.14 4.56-1.88a.37.37 0 01.12.7c-.27.13-.6.34-.64.6C12 6.17 13.1 7 13.63 7.4c.2.14.36.27.46.36.7.64.55 1.28.42 1.85l-.04.2a.37.37 0 01-.36.3z"/><path fill="%234F2C16" d="M6.66 13.55a.38.38 0 01-.22-.08 3.57 3.57 0 01-1.39-2.59c0-1.08 1-1.96 2.61-2.3.2-.04.4.09.44.29.04.2-.09.4-.29.43-1.24.27-2.02.87-2.02 1.58 0 .77.55 1.59 1.1 2a.37.37 0 01-.23.67z"/><path fill="%234F2C16" d="M11 18.3c-6.9 0-7.43-2.55-7.43-3.34a3.96 3.96 0 012.11-3.12.37.37 0 11.26.7c-.61.22-1.63 1.48-1.63 2.42 0 1.2 1.75 2.6 6.68 2.6 2.88 0 4.86-.56 5.74-1.61.45-.54.6-1.19.47-1.94a3.14 3.14 0 00-1.15-1.5.37.37 0 11.38-.64 3.78 3.78 0 011.5 2 3 3 0 01-.63 2.55c-1.04 1.24-3.16 1.87-6.3 1.87z"/><path fill="%234F2C16" d="M15.88 13.2a.37.37 0 01-.31-.56c.19-.32.45-1.14.35-2.07-.07-.66-1.3-1.05-1.73-1.1a.37.37 0 01.1-.74c.58.08 2.24.58 2.36 1.76a4.35 4.35 0 01-.46 2.53.37.37 0 01-.31.17z"/><path fill="%234F2C16" d="M10.02 14.77c-.5 0-1.01-.02-1.56-.07a.37.37 0 01-.34-.4c.02-.2.2-.35.4-.34 4.2.38 6.4-.88 7.14-1.43a.37.37 0 01.44.59c-.71.53-2.62 1.65-6.08 1.65z"/><path fill="%2338060B" d="M18.2 4.29c.52-.34.55-1.22.07-1.99-.48-.76-1.3-1.1-1.82-.77-.53.33-.56 1.22-.07 1.98.48.76 1.3 1.1 1.82.78z"/><path fill="%2338060B" d="M17.02 2.43c.53-.33.75-.9.51-1.29-.24-.38-.86-.42-1.38-.09-.53.34-.75.91-.51 1.3.24.38.86.41 1.38.08z"/><path fill="%2341C9FE" d="M16.98 2.65c.3.48.2 1.4-.57 1.88-.77.49-1.64.5-1.94.02-.3-.47.07-1.25.84-1.74s1.37-.63 1.67-.16zm.3-.2c.31.48 1.19.77 1.95.28.77-.48 1.15-1.27.84-1.74-.3-.48-1.16-.47-1.93.02s-1.15.97-.85 1.45z"/><path fill="%2338060B" d="M2.59 5.58c.46.41 1.32.2 1.92-.48.6-.67.71-1.55.25-1.96-.47-.42-1.33-.2-1.93.47-.6.68-.7 1.56-.24 1.97z"/><path fill="%2338060B" d="M4.05 3.94c.46.41 1.08.47 1.38.13.3-.34.16-.94-.3-1.35-.46-.42-1.08-.47-1.38-.14-.3.34-.17.95.3 1.36z"/><path fill="%2341C9FE" d="M3.82 3.96c-.37.42-1.28.57-1.96-.04-.68-.6-.93-1.43-.55-1.85.37-.42 1.22-.28 1.9.33.68.6.99 1.14.61 1.56zm.27.24c-.37.42-.4 1.34.28 1.95.68.6 1.53.74 1.9.32.38-.42.13-1.25-.55-1.85-.68-.6-1.25-.84-1.63-.42z"/><path fill="%23BFC3C8" d="M1.77 8.6l-.03-.02a1.34 1.34 0 01-.25-.33.2.2 0 01.08-.26c.09-.05.2-.02.25.08l.11.16a.6.6 0 00.06.07c.08.06.08.18.01.26a.19.19 0 01-.23.04zm.64.26a.19.19 0 01-.08-.2.2.2 0 01.23-.14l.34.07c.1.02.16.11.14.22a.2.2 0 01-.22.15 9.38 9.38 0 01-.4-.1zm1.04.21a.18.18 0 01-.08-.2.2.2 0 01.23-.14l.35.09c.1.03.15.13.12.23a.19.19 0 01-.24.13 5.77 5.77 0 00-.38-.1zm1.3.53h-.01l-.16-.1-.12-.07c-.11-.07-.13-.16-.08-.25.05-.1.16-.13.25-.09l.17.1.15.1a.19.19 0 01-.2.31zM1.47 7.62a.18.18 0 01-.09-.2c.03-.12.07-.25.14-.38.04-.1.16-.13.25-.09.1.05.13.16.08.25-.05.1-.09.2-.1.3a.19.19 0 01-.22.15.17.17 0 01-.06-.03zM2 6.7a.19.19 0 01-.03-.3l.28-.25c.09-.06.2-.05.26.03a.2.2 0 01-.03.27l-.25.22A.19.19 0 012 6.7zm15.14 4.53a.19.19 0 01-.2-.13c-.02-.1.03-.2.13-.24l.34-.11c.1-.04.2.02.24.11a.2.2 0 01-.11.25 6.18 6.18 0 01-.4.12zm1.03-.42a.19.19 0 01-.1-.36c.1-.05.2-.1.3-.17a.2.2 0 01.26.06.2.2 0 01-.06.26 4.84 4.84 0 01-.4.21zm.91-.62a.18.18 0 01-.16-.07.2.2 0 01.03-.27c.09-.07.17-.16.25-.24a.18.18 0 01.26 0 .2.2 0 010 .27c-.08.09-.18.18-.28.26a.17.17 0 01-.1.05zm.74-.85c-.04 0-.08 0-.12-.03a.2.2 0 01-.06-.26l.17-.3c.04-.1.15-.14.24-.1.1.05.13.16.1.25a2.8 2.8 0 01-.2.36.18.18 0 01-.13.08zm.35-1.06h-.03c-.1 0-.18-.1-.17-.2v-.35c-.02-.1.06-.19.16-.2.1-.01.2.07.2.17.01.15.02.28 0 .41 0 .1-.07.16-.16.17zm-.15-1.12a.19.19 0 01-.2-.13 4.13 4.13 0 00-.12-.34.2.2 0 01.1-.25c.1-.03.2.01.25.1.04.13.09.25.12.38a.2.2 0 01-.12.24h-.03zm-.44-1.04a.19.19 0 01-.18-.1l-.19-.32a.2.2 0 01.06-.26c.09-.05.2-.02.26.07l.19.33c.05.1.02.2-.07.26a.2.2 0 01-.07.02zm-.62-.94a.19.19 0 01-.16-.07c-.09-.1-.17-.2-.24-.26a.2.2 0 010-.27.18.18 0 01.25 0c.08.07.18.17.27.29a.2.2 0 01-.02.26.19.19 0 01-.1.05z"/><ellipse cx="7.04" cy="10.59" fill="%23DDB695" transform="rotate(38 7.28 10.7)" rx=".26" ry=".39"/><path fill="%23DDB695" d="M10.22 5.78c.67-.09.43.42.1.73-.68.67-.95 1-1.56 1.03-.4.02.58-1.64 1.46-1.76z"/></g></svg>',
        popcorn_3c9c0: '<svg xmlns="http://www.w3.org/2000/svg" width="25" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFEA37" d="M19.59 9.59l-.08-.01-4.83-1.43a.25.25 0 01-.16-.14c-.02-.06-.21-.55.02-.9a.67.67 0 01.49-.27c-.05-.46.04-1.07.63-1.23a1.3 1.3 0 01.74 0c0-.39.1-.87.55-1.04.17-.07.33-.1.5-.1.16 0 .3.03.4.08.17-.32.52-.79 1.07-.79h.05c.51.03.83.35 1 .6.2-.13.48-.26.81-.26a.97.97 0 01.93.63.74.74 0 01.77.1c.28.22.34.54.31.8.22.06.5.2.67.52.13.27.14.51.12.7.26.04.43.15.5.33.12.28 0 .82-.04.98a.25.25 0 01-.17.18l-4.21 1.24a.26.26 0 01-.07.01"/><path fill="%23FF9100" d="M18.92 3.51c-.58 0-.96.4-1.19.74a1.6 1.6 0 00-.88.09c-.45.17-.62.58-.68.97a1.57 1.57 0 00-.58.06c-.6.17-.84.7-.83 1.28a.87.87 0 00-.43.33c-.3.44-.09 1.01-.05 1.12a.5.5 0 00.33.3l4.83 1.42a.51.51 0 00.3 0l4.2-1.24a.5.5 0 00.35-.36c.07-.29.16-.81.02-1.14a.77.77 0 00-.47-.42c0-.18-.05-.4-.16-.62a1.2 1.2 0 00-.63-.58 1.07 1.07 0 00-.41-.83 1 1 0 00-.8-.2 1.14 1.14 0 00-.64-.52 1.42 1.42 0 00-.42-.06c-.28 0-.54.08-.74.18a1.55 1.55 0 00-1.12-.52m0 .5h.03c.67.04.95.71.95.71s.4-.37.88-.37a.9.9 0 01.27.04c.43.13.5.7.5.7s.22-.17.47-.17c.1 0 .2.03.3.1.38.3.16.83.16.83h.03c.12 0 .53.03.72.41.22.45.03.82.03.82h.07c.14 0 .44.02.52.2.1.22-.05.82-.05.82l-4.21 1.24-4.84-1.43s-.34-.83.43-.83h.15s-.3-1.04.4-1.23c.11-.03.22-.04.32-.04.43 0 .64.26.64.26s-.2-1.05.35-1.27c.15-.06.29-.08.4-.08.34 0 .52.2.52.2s.31-.9.96-.9"/><path fill="%23FFBC00" d="M23.8 8.1l-4.21 1.24-4.84-1.43s-.38-.93.58-.82c0 0-.3-1.05.4-1.24.64-.18.96.22.96.22s-.2-1.05.35-1.27c.6-.24.92.11.92.11s.33-.94 1-.9c.66.04.94.71.94.71s-.76-.13-.95.22c-.24.41-.06.8-.06.8s-.54-.06-.8.12.2.82.2.82-.4.56-.12.9c.28.32 1-.06 1-.06s.34.46.78.54c.44.07 1.04-.08 1.22-.41 0 0 .57.56 1.03.51.47-.05 1.6-.06 1.6-.06"/><path fill="%23FFF" d="M19.22 17.74l-.07-.01-3.41-1.04a.25.25 0 01-.18-.2L14.2 8a.25.25 0 01.07-.22.25.25 0 01.23-.06l4.87 1.02 4.56-1.02H24c.06 0 .12.01.17.06.06.05.1.13.08.21l-1.15 8.55a.25.25 0 01-.19.2l-3.61.99h-.07"/><path fill="%23E40F0F" d="M23.99 7.46l-.11.01-4.5 1.01-4.83-1a.51.51 0 00-.45.12.5.5 0 00-.15.44l1.36 8.49a.5.5 0 00.35.4l3.41 1.03a.51.51 0 00.28 0l3.62-.98a.5.5 0 00.37-.41l1.15-8.54a.5.5 0 00-.16-.44.51.51 0 00-.34-.13m0 .5l-1.15 8.54-3.62.99-3.4-1.04-1.37-8.49L19.38 9l4.61-1.04"/><path fill="%23B8BABF" d="M19.22 17.49l-3.4-1.04-1.37-8.49L19.38 9l-.16 8.49"/><path fill="%23E40F0F" d="M16.78 17.01a.25.25 0 01-.25-.22l-.89-8.64a.25.25 0 01.23-.28c.14-.01.26.09.28.22l.89 8.65a.25.25 0 01-.26.27m4.96.2h-.03a.25.25 0 01-.23-.27l.9-8.87a.25.25 0 01.27-.22c.14.01.24.13.23.27l-.9 8.87a.25.25 0 01-.24.22m-3.72.27a.25.25 0 01-.26-.24l-.42-8.77c0-.14.1-.26.24-.26.14 0 .26.1.27.24l.42 8.76a.25.25 0 01-.25.27m1.2.1a.25.25 0 01-.25-.25l.15-8.39c0-.14.12-.25.26-.24.14 0 .25.11.25.25l-.16 8.39c0 .13-.11.24-.25.24m1.34-.26h-.02a.25.25 0 01-.24-.26l.4-8.61c0-.14.12-.25.26-.24.14 0 .25.12.24.26l-.4 8.62c0 .13-.11.23-.24.23"/><path fill="%23FFF" d="M22.74 12.1c-.07 1.1-.69 1.95-1.36 1.9-.67-.05-1.16-.97-1.08-2.07.08-1.1.7-1.95 1.37-1.9.67.04 1.15.97 1.07 2.07"/><path fill="%23E40F0F" d="M21.61 10.27c-.3 0-.53.26-.64.42-.23.32-.38.77-.42 1.26-.06.94.32 1.77.85 1.8.31.02.56-.25.68-.41.23-.33.38-.77.41-1.26.07-.94-.32-1.77-.84-1.8h-.04m-.17 3.97h-.08c-.82-.06-1.4-1.08-1.31-2.34.04-.58.22-1.11.5-1.5.31-.44.72-.66 1.13-.63.83.05 1.4 1.08 1.32 2.34a2.98 2.98 0 01-.5 1.5c-.3.41-.67.63-1.06.63"/><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23863F01" d="M4.17 7.57c.32-.1 1.05-.3 1.86-.13.8.17.3-.5-.15-.68-.46-.19-1.26.02-1.61.36-.36.33-.66.63-.1.45zm6.74-.85a2 2 0 011.86.53c.23.2-.2.28-.44.15a3.97 3.97 0 00-1.92-.22c-.64.14-.05-.34.5-.46z"/><path fill="%23462000" d="M10.16 12.11c-.03-.56.32-3.22 1.6-3.2 1.88.04 1.56 2.63 1.54 3.28-.01.49-.68.38-.71-.09-.03-.44.02-2.24-1-2.18-.56.03-.65 1.84-.7 2.24-.03.4-.7.52-.73-.05zm-6.52 0c-.03-.56.32-3.22 1.6-3.2 1.88.04 1.56 2.64 1.54 3.28-.02.49-.68.38-.71-.08-.03-.44.02-2.25-1-2.19-.56.03-.65 1.84-.7 2.24-.03.4-.7.52-.73-.04zm.02 2.34c-.04-.35.2-.42.27-.43 1.4-.16 7.03.1 8.14.3.27.05.94.63.61 1.36a4.72 4.72 0 01-4.31 2.67c-2.35 0-4.43-1.68-4.71-3.9z"/><path fill="%23CF4324" d="M7.62 17.83a2.6 2.6 0 014.1-1.61 4.08 4.08 0 01-4.1 1.61z"/><path fill="%23FF7B5F" d="M8.4 16.92c.18-.23.78-.75 1.3-.8.53-.06.2.25-.12.38-.32.12-.66.4-.88.68-.23.29-.49 0-.3-.26z"/></g></svg>',
        relieved_07108: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23863F01" d="M4.07 7.57c.32-.1 1.06-.3 1.86-.13.8.17.4-.66-.05-.85-.46-.18-1.3 0-1.65.34-.36.34-.72.82-.16.64zm6.74-1.06c.94-.2 1.52.3 1.88.62.22.2-.21.4-.46.27a3.97 3.97 0 00-1.92-.22c-.64.14-.04-.55.5-.67z"/><path fill="%23462000" d="M10.06 12.11c-.03-.56.32-3.22 1.6-3.2 1.88.04 1.56 2.63 1.54 3.28-.01.49-.68.38-.71-.09-.03-.44.16-2.2-.85-2.15-.57.03-.8 1.8-.84 2.21-.04.4-.7.52-.74-.05zm-6.52 0c-.03-.56.32-3.22 1.6-3.2 1.88.04 1.56 2.64 1.54 3.28-.02.49-.68.38-.71-.08-.03-.44.25-2.26-.77-2.2-.57.03-.88 1.85-.92 2.25-.04.4-.7.52-.74-.04zm.5 2.33c-.03-.34.2-.4.27-.41 1.37-.16 6.85.1 7.94.3.26.04.91.6.6 1.32a4.6 4.6 0 01-4.21 2.6c-2.3 0-4.32-1.64-4.6-3.8z"/><path fill="%23CF4324" d="M7.9 17.74a2.53 2.53 0 014.01-1.57 3.98 3.98 0 01-4 1.57z"/><path fill="%23FF7B5F" d="M8.67 16.85c.17-.22.76-.73 1.27-.78.52-.06.19.25-.12.37-.3.12-.64.4-.86.67-.22.28-.48 0-.29-.26z"/><path fill="%234582C3" d="M13.43 4.23c-.1.05-.2.14-.23.25-.6 1.65-1.1 3.69.22 4.82.67.56 1.57.7 2.35.37a2.11 2.11 0 001.32-2c-.04-1.83-1.91-2.84-3.32-3.44a.43.43 0 00-.34 0"/><path fill="%239AC8F9" d="M13.71 4.8c1.53.65 2.86 1.5 2.89 2.88a1.6 1.6 0 01-1 1.51c-.55.24-1.24.19-1.8-.29-1.06-.9-.6-2.68-.09-4.1"/><path fill="%23FFF" d="M16.1 8.14c.15-.33.1-.67-.12-.76-.2-.09-.5.1-.63.44-.14.33-.08.67.13.75.2.1.49-.1.63-.43z"/></g></svg>',
        sad_46b75: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path stroke="%235B2A00" stroke-width=".9" d="M7 17.16c.19-.43.53-1.16 1.32-1.16s1.1.81 1.4 1.63" stroke-linecap="round"/><path stroke="%23462000" d="M6.77 12.42c-1.17.7-2.92 1-4.77-.42m11.85.21c-1.18.7-2.86 1.41-4.72 0" stroke-linecap="round"/><path fill="%23D34101" d="M11.5 15.06l2.03-1.24c.1-.06.22-.02.27.1.05.12.01.27-.09.33l-2.03 1.24c-.2.12-.5-.23-.18-.43zm1.14.19l3.14-1.52c.34-.12.45.31.15.45L12.8 15.7c-.38.15-.44-.31-.15-.45zm1.39.25l1.71-.53c.37-.09.45.36.1.46l-1.7.53c-.34.1-.5-.34-.11-.46zM.99 15l1.72-.67c.35-.09.46.32.13.46l-1.72.67c-.3.12-.52-.32-.13-.46zm.73.56l3.14-1.5c.43-.17.52.27.15.44l-3.14 1.51c-.3.13-.5-.27-.15-.45zm2.1-.11l1.63-.8c.27-.12.44.28.16.44l-1.63.8c-.3.15-.5-.29-.16-.44z"/><path fill="%23863F01" d="M10.76 9.47c.8.27 1.85.3 1.85.3l.03.4s-1.6.42-2.55-.24c-.98-.68-.6-1.72-.62-1.73l.4-.02s.17 1.06.89 1.3zm-4.62.02c-.69.52-1.69.6-1.69.6l-.08-.36s.75-.23 1.37-.75c.54-.45.93-1.19.93-1.19l.34.12s0 .97-.87 1.58z"/></g></svg>',
        shock_db4e3: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23FFF" d="M5.08 8.89a3.2 3.2 0 013.21 3.2 3.2 3.2 0 01-6.42 0 3.2 3.2 0 013.21-3.2zm6.38.37c1.6 0 2.91 1.27 2.91 2.83s-1.3 2.83-2.91 2.83a2.87 2.87 0 01-2.91-2.83c0-1.56 1.3-2.83 2.9-2.83z"/><path fill="%23582A00" d="M5.2 11.67c.24 0 .44.23.44.5 0 .28-.2.5-.44.5s-.44-.22-.44-.5c0-.27.2-.5.44-.5zm6.47-.01c.24 0 .44.22.44.5 0 .27-.2.5-.44.5s-.44-.23-.44-.5c0-.28.2-.5.44-.5z"/><path fill="%23863F01" d="M3.87 7.82c.28-.15.96-.44 1.74-.37s.28-.46-.17-.59c-.45-.12-1.24.07-1.54.44-.3.37-.27.65-.03.52zm7.62-.74c.76-.11 1.36.35 1.65.76.19.26-.16.4-.36.22-.2-.19-1.1-.48-1.58-.49-.52 0-.16-.42.3-.49z"/><circle cx="9.22" cy="16.18" r=".84" fill="%235B2A00"/></g></svg>',
        sir_16b5b: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="a" d="M2.36.61c1.3 0 2.35 1 2.35 2.22 0 1.23-1.05 2.22-2.35 2.22S.01 4.05.01 2.83C0 1.61 1.06.61 2.36.61z"/></defs><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M6.32 4.9c1.83-1.27 3.41-1.56 3.73-2.78.2-.72.07-1.14-.65-2.08 2.12.71 3.35 1.73 3.65 2.57.5 1.36-.16 2.89.49 3.02.62.13 1.06-.88.94-1.83a9.67 9.67 0 013.5 7.44 7.5 7.5 0 01-7.78 7.8c-4.3 0-7.78-3.27-7.78-7.3 0-3.72 2.08-5.57 3.9-6.84z"/><path fill="%23462000" d="M8.72 16.35c-.81 2.3-2.86 3.28-4.9 3.28-2.6 0-2.85-2.97-2.46-3.45-.04.45-.13 1.62 1.46 1.33 1.58-.28.28-2.83 2.4-4 1.66-.9 3.08-.43 3.63.14a3.98 3.98 0 014.42-.42c2.48 1.28.96 4.07 2.82 4.38 1.85.3 1.75-.97 1.7-1.47.47.54.18 3.78-2.88 3.78-3.17 0-5.44-.9-6.19-3.57z"/><path fill="%2343250B" d="M13.06 6.65l.08.01h.08l.08.01.08.01.08.01.08.01.07.01.08.02.08.02.07.02.07.02.08.02.07.02.07.03.07.03.07.03.07.03.07.03.07.03.07.04.06.04.07.03.06.04.06.04.06.05.06.04.06.05.06.04.06.05.05.05.06.05.05.05.05.05.05.06.05.05.05.06.04.06.05.06.04.06.05.06.04.06.04.06.03.07.04.06.03.07.04.06.03.07.03.07.03.07.02.07.03.07.02.07.02.08.02.07.02.07.01.08.01.07.02.08v.08l.01.07.01.08v.39l-.02.08v.07l-.02.08v.08l-.02.07-.02.08-.02.07-.02.07-.02.07-.03.07-.02.07-.03.07-.03.07-.03.07-.04.07-.03.06-.04.07-.03.06-.04.07-.04.06-.05.06-.04.06-.05.06-.04.05-.05.06-.05.06-.05.05-.05.05-.05.05-.06.06-.05.04-.06.05-.06.05-.06.04-.06.05-.06.04-.06.04-.06.04-.07.04-.06.04-.07.03-.07.03-.07.04-.07.03-.07.03-.07.02-.07.03-.07.02-.08.03-.07.02-.07.02-.08.01-.08.02-.07.01-.08.02-.08.01-.08.01h-.08l-.08.01h-.47l-.08-.02h-.08l-.08-.03h-.08l-.07-.03h-.08l-.07-.03-.08-.02-.07-.03-.07-.02-.07-.03-.08-.02-.07-.03-.06-.03-.07-.04-.07-.03-.07-.03-.06-.04-.07-.04-.06-.04-.06-.04-.06-.04-.06-.05-.06-.04-.06-.05-.06-.05-.05-.04-.06-.06-.05-.05-.05-.05-.05-.05-.05-.06-.05-.06-.05-.05-.04-.06-.05-.06-.04-.06-.04-.06-.04-.07-.04-.06-.03-.07-.04-.06-.03-.07-.03-.07-.03-.07-.03-.07-.02-.07-.03-.07-.02-.07-.02-.07-.02-.08-.02-.07v-.07l-.03-.08v-.08L9.83 10v-.63l.01-.08.01-.08.02-.07.01-.08.02-.07.02-.07.02-.08.02-.07.03-.07.02-.07.03-.07.03-.07.03-.07.03-.06.04-.07.03-.06.04-.07.04-.06.04-.06.04-.06.05-.06.04-.06.05-.06.05-.06.05-.05.05-.06.05-.05.05-.05.06-.05.05-.05.06-.05.06-.04.06-.05.06-.04.06-.05.06-.04.06-.04.07-.03.06-.04.07-.04.07-.03.07-.03.06-.03.07-.03.08-.03.07-.03.07-.02.07-.02.08-.02.07-.02.08-.02.07-.02h.08l.08-.02h.08l.08-.02h.16l.08-.02h.08z"/><path fill="%23F3CDFF" d="M12.99 7.45c1.3 0 2.35 1 2.35 2.23a2.3 2.3 0 01-2.35 2.23c-1.3 0-2.35-1-2.35-2.23a2.3 2.3 0 012.35-2.23z"/><path fill="%2343250B" d="M16.2 10.41c.24.05.4.26.35.5a.43.43 0 01-.5.34.42.42 0 01-.34-.5.43.43 0 01.5-.34z"/><path d="M16.2 10.41c.24.05.4.26.35.5a.43.43 0 01-.5.34.42.42 0 01-.34-.5.43.43 0 01.5-.34z"/><path fill="%2343250B" d="M16.39 11.62c.23.04.39.26.35.49a.43.43 0 01-.5.34.42.42 0 01-.35-.49.43.43 0 01.5-.34z"/><path d="M16.39 11.62c.23.04.39.26.35.49a.43.43 0 01-.5.34.42.42 0 01-.35-.49.43.43 0 01.5-.34z"/><path fill="%2343250B" d="M16.81 12.82c.24.04.4.26.35.49a.43.43 0 01-.5.34.42.42 0 01-.34-.49.43.43 0 01.5-.34z"/><path d="M16.81 12.82c.24.04.4.26.35.49a.43.43 0 01-.5.34.42.42 0 01-.34-.49.43.43 0 01.5-.34z"/><path fill="%2343250B" d="M17.51 13.72c.27.05.45.3.4.57a.5.5 0 01-.57.4.49.49 0 01-.4-.57.5.5 0 01.57-.4z"/><path d="M17.51 13.72c.27.05.45.3.4.57a.5.5 0 01-.57.4.49.49 0 01-.4-.57.5.5 0 01.57-.4z"/><path fill="%2343250B" d="M18.65 14.22c.27.05.44.3.4.56a.49.49 0 01-.57.39.48.48 0 01-.4-.56c.05-.26.3-.44.57-.39zm-.14-.88c.18.03.3.2.26.37a.32.32 0 01-.37.26.32.32 0 01-.26-.37c.03-.17.2-.29.37-.26z"/><path d="M18.51 13.34c.18.03.3.2.26.37a.32.32 0 01-.37.26.32.32 0 01-.26-.37c.03-.17.2-.29.37-.26z"/><g transform="translate(10.6 6.85)"><mask id="b" fill="%23fff"><use xlink:href="%23a"/></mask><path fill="%23FFF" d="M4.09-.38l-4.12 7-.78-.43L3.31-.82l.78.44zm.9-.27L.89 6.36l-.3-.17L4.68-.82l.3.17z" mask="url(%23b)"/></g><path fill="%23B55500" d="M5.56 7.75a8.23 8.23 0 011.84-.49c.4-.04.59-.79-.37-.68-.97.1-1.5.64-1.7.82-.21.18-.03.5.23.35z"/><path fill="%23462000" d="M8.45 8.82c.03.54-.31 3.1-1.55 3.08-1.82-.04-1.5-2.53-1.49-3.16.02-.46.67-.36.7.09.02.42-.16 2.14.82 2.08.56-.03.77-1.75.8-2.14.05-.39.69-.5.72.05z"/></g></svg>',
        skeptical_51344: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="a" d="M.72.55L5.23.54C5.23 4.23.76 4.2.72.54z"/><path id="c" d="M3.07.5C1.99.45.99 1.63.87 3.15c-.11 1.53.38 2.8 1.62 2.86 1.5.06 2.05-1.16 2.16-2.69C4.77 1.8 4.15.54 3.07.5z"/></defs><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><g transform="translate(9 11)"><mask id="b" fill="%23fff"><use xlink:href="%23a"/></mask><use fill="%23FFF" xlink:href="%23a"/><path fill="%23462000" d="M.72.56c0 1.56.35 2.15 1.1 2.15.77 0 1.08-.59 1.08-2.17L.72.56z" mask="url(%23b)"/></g><path fill="%23462000" fill-rule="nonzero" d="M8.02 17.28c.3-.51.59-.75 1.12-.75.54 0 .78.26 1.21 1.1a.37.37 0 10.67-.33c-.55-1.09-.96-1.52-1.88-1.52-.86 0-1.34.4-1.76 1.12a.37.37 0 00.64.38z"/><path fill="%23863F01" d="M10.74 9.74c.81.26 1.85.3 1.85.3l.04.4s-1.6.42-2.55-.24c-.98-.68-.61-1.72-.63-1.73l.4-.02s.17 1.06.9 1.3zM6.26 6.6c1.54-.28 2.1.98 2.1.97l-.3.26s-.66-.74-1.64-.53c-.8.17-1.58 1.02-1.58 1.02L4.5 8.1s.51-1.27 1.76-1.5z"/><g transform="rotate(-5 102.96 -27.7)"><mask id="d" fill="%23fff"><use xlink:href="%23c"/></mask><use fill="%23FFF" xlink:href="%23c"/><path fill="%23462000" d="M1.75 1.54c.94 0 1.17.85 1.17 1.89S2.48 5.3 1.75 5.3C.83 5.31.6 4.47.6 3.43s.52-1.89 1.16-1.89z" mask="url(%23d)"/></g></g></svg>',
        smiley_b8bfd: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23863F01" d="M4.38 8.54c.32-.1 1.06-.32 1.86-.14s.3-.5-.15-.68c-.45-.18-1.25.02-1.61.36-.36.33-.66.63-.1.46zm6.74-.86a2 2 0 011.87.53c.22.2-.2.29-.45.15a3.97 3.97 0 00-1.92-.21c-.63.13-.04-.35.5-.47z"/><path fill="%23462000" d="M10.3 12.7c-.04-.56.32-3.23 1.6-3.2 1.88.03 1.56 2.63 1.54 3.28-.02.49-.69.38-.72-.09-.02-.44.03-2.24-.99-2.18-.57.03-.66 1.84-.7 2.24-.04.4-.7.52-.73-.05zm-6.53 0c-.03-.56.33-3.22 1.6-3.2 1.89.04 1.57 2.64 1.54 3.28-.01.49-.68.38-.7-.08-.03-.44.01-2.25-1-2.2-.57.04-.66 1.85-.7 2.25-.04.4-.7.52-.74-.04z"/><path stroke="%23462000" stroke-width=".85" d="M6.17 16.14c.73 1.56 3.68 1.73 4.55.03" stroke-linecap="round"/></g></svg>',
        strong_676f6: '<svg xmlns="http://www.w3.org/2000/svg" width="25" height="20" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="a" d="M2.44.758c.923 0 1.672.98 1.672 2.187 0 1.208-.749 2.188-1.671 2.188-.923 0-1.672-.98-1.672-2.188 0-1.207.75-2.187 1.672-2.187z"/><path id="c" d="M2.46.477c1.032 0 1.87 1.003 1.87 2.238 0 1.234-.838 2.237-1.87 2.237-1.03 0-1.87-1.003-1.87-2.237C.59 1.48 1.43.477 2.46.477z"/></defs><g fill="none" fill-rule="evenodd"><path fill="%23A64F00" d="M16.285 12.945c.115-.048.748-.013.895.034.148.048 1.166.286 1.559.355.166-.12.484-.295.59-.263.107.032.872.28 1.08.35-.01-.389.16-1.34.302-1.676-.202.009-.55.036-.734-.025-.395.508-1.554.664-2.111.25-.558-.415-.351-1.242-.113-1.509-.441-.754-.529-1.965-.007-2.676.55-.75 2.387-1.732 4.441-.372 1.257.831 2.178 3.96 2.462 5.82.285 1.862.342 3.712.087 4.01-.255.299-2.598 2.445-6.1 1.382-.166.223-.168.464-.366.398-.198-.066-1.472-.878-1.642-.996-.169-.117-.083-.377-.146-.398-.063-.022-.52-.194-1.044-.692-.523-.497-1.239-3.128.847-3.992z"/><path fill="%23FFC415" d="M18.021 10.789c.215.243.795.677 1.424.847-.458.324-1.753.42-1.424-.847z"/><path fill="%2364BEE0" d="M20.355 13.915l.008.323c-.753.27-2.4 2.5-2.219 4.23-.492-.252-1.07-.548-1.308-.858-.026-.288.068-1.077.122-1.3.273-1.135 1.553-2.29 2.295-2.774.33.102 1.102.379 1.102.379z"/><path fill="%230087BB" d="M18.4 13.788s-1.479 1.05-1.804 2.084c-.095.303-.1.927-.088 1.086-.189-.054-.443-.284-.694-.614-.835-1.099.081-2.6.4-2.729.317-.129.79-.15 1.066-.085.275.064.92.154 1.12.258z"/><path fill="%23FFC415" d="M18.215 10.309a1.994 1.994 0 01-.256-1.58c.27-1.074 1.542-1.68 2.838-1.353a2.78 2.78 0 011.257.678c.544.43 1.023 1.123 1.552 3.094.654 2.438.815 5.355.508 5.834-.307.479-2.376 2.058-5.522 1.002.03-.847.947-2.729 1.592-3.163.323.072.729.105.851.058-.106-.497-.18-2.088.313-3.316.349-.145.952-.663 1.097-.855.091-.119-.042-.24-.175-.198-.322.374-.811.645-1.356.765-.412-.229-.58-.837-.776-.665-.16.14.107.476.33.728a2.81 2.81 0 01-1.09-.144.722.722 0 00-.016-.028c-.217-.356-.021-.849-.242-.849-.198 0-.134.453-.098.722a2.245 2.245 0 01-.485-.345.427.427 0 00-.024-.103c-.136-.393.16-.833-.056-.88-.173-.038-.219.327-.242.598z"/><path fill="%23FFB612" d="M13.044 5.109c-1.938-1.337-3.62-1.64-3.964-2.923C8.877 1.428 9.007.982 9.773 0 7.52.745 6.216 1.823 5.89 2.705c-.527 1.433.172 3.035-.514 3.178-.665.14-1.13-.93-1.004-1.923C2.193 5.926.78 8.155.667 11.782.532 16.08 3.756 20 8.92 20c4.565 0 8.272-3.445 8.272-7.688 0-3.913-2.21-5.866-4.148-7.203z"/><path fill="%2395001D" d="M1.019 14.425a8.13 8.13 0 01-.352-2.643C.78 8.155 2.193 5.926 4.373 3.96c-.127.992.339 2.063 1.004 1.923.686-.143-.013-1.745.514-3.178C6.216 1.823 7.521.745 9.773 0c-.766.982-.896 1.428-.693 2.186.343 1.283 2.026 1.586 3.964 2.923 1.058.73 2.196 1.642 3.012 2.956-4.73-1.492-9.629-1.18-15.037 6.36z"/><path fill="%23F20000" d="M14.391 6.876a9.671 9.671 0 00-.573-.464c-2.219-1.664-3.266-1.728-4.738-2.936-.588-.482-.927-.99-.75-2.047-.636.32-1.575.986-1.667 2.042-.126 1.459.417 2.58-.813 3.165-.468.223-1.468.182-2.012-1.038-1.421 1.731-2.336 3.585-2.42 6.275-.012.371 0 .739.036 1.1 4.592-5.865 8.84-6.869 12.937-6.097z"/><path fill="%23C60" d="M10.476 9.089c.063-.375.564-1.147 1.213-1.291.542-.12 1.087.034 1.459.722.213.394-.568-.18-1.348.015-.78.195-.862.5-1.04.682-.178.182-.327.125-.284-.128zm-3.168.465c-.295-.267-.6-.468-1.25-.318-.649.15-.857.595-.99.843-.134.247.012.314.242.208.415-.192 1.016-.336 1.672-.331.508.003.523-.224.326-.402z"/><g transform="translate(10.073 9.225)"><mask id="b" fill="%23fff"><use xlink:href="%23a"/></mask><use fill="%23F6F7F9" xlink:href="%23a"/><path fill="%23462000" d="M1.731 1.697c.603 0 1.092.75 1.092 1.675s-.489 1.676-1.092 1.676C1.13 5.048.64 4.298.64 3.372c0-.924.489-1.675 1.091-1.675z" mask="url(%23b)"/></g><g transform="translate(4.073 9.74)"><mask id="d" fill="%23fff"><use xlink:href="%23c"/></mask><use fill="%23F6F7F9" xlink:href="%23c"/><path fill="%23462000" d="M1.621 1.604c.603 0 1.092.758 1.092 1.691s-.49 1.691-1.092 1.691c-.603 0-1.092-.758-1.092-1.691s.49-1.691 1.092-1.691z" mask="url(%23d)"/></g><path fill="%23F6F7F9" d="M2.56 9.54a.52.52 0 11-.001 1.039.52.52 0 010-1.039zm1.848-1.656a.52.52 0 110 1.039.52.52 0 010-1.039zm3.497-1.921a.52.52 0 110 1.038.52.52 0 010-1.038zm2.5-.765a.52.52 0 110 1.039.52.52 0 010-1.039zM9 4.37a.52.52 0 110 1.039.52.52 0 010-1.039z"/><path fill="%2395001D" d="M4.777 7.78C3.894 8.564 1.912 9.235.15 8.87c-.078-1.525.6-3.118 1.59-3.407.645-.189 1.529.038 2.274.408A1.566 1.566 0 015.53 4.823c0-.507.188-1.026.802-1.508 1.366-1.073 2.724-1.29 3.438-1.273.242 1.67-.76 4.146-2.724 4.513A1.565 1.565 0 014.777 7.78z"/><path fill="%23F20000" d="M6.294 5.045c-.107-.478-.082-.998.495-1.467.927-.755 1.85-.909 2.333-.897.175 1.26-.62 3.17-2.15 3.206a1.57 1.57 0 00-.678-.842zM4.373 7.48c-.55.635-2.144 1.238-3.546.948-.058-1.123.44-2.294 1.168-2.507.551-.161 1.341.091 1.931.442-.006.434.165.83.447 1.117zM5.51 5.224a1.163 1.163 0 11-.04 2.326 1.163 1.163 0 01.041-2.326z"/><path fill="%23F6F7F9" d="M2.26 5.876c.31-.022.666.05 1.009.175v.005a.52.52 0 11-1.01-.18zm-.023 1.368a.52.52 0 11-.018 1.038.52.52 0 01.018-1.038zm5.728-4.201a.527.527 0 11-.02 1.054.527.527 0 01.02-1.054zm-.522 2.77a.548.548 0 11.911-.605c-.249.28-.554.497-.911.605zM6.041 7.41a.469.469 0 01-.274-.438.462.462 0 01.464-.46.452.452 0 01.372.21c-.09.297-.295.544-.562.688zM4.944 5.36a.46.46 0 01.424.474.462.462 0 01-.463.46.461.461 0 01-.447-.444c.109-.21.279-.38.486-.49z"/><path fill="%23462000" d="M6.897 15.884c.07.23.247.641.624.7.378.059 3.32-.764 4.441-.672.439.036.232.632.02.628-1.365-.025-3.864.68-4.435.69-.571.007-1.018-.657-1.075-1.134-.058-.476.355-.441.425-.212z"/></g></svg>',
        thumb_98587: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M7.37 5.1c1.93-1.33 3.62-1.63 3.96-2.91.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23863F01" d="M7.38 8.54c.32-.1 1.06-.32 1.86-.14s.3-.5-.15-.68c-.45-.18-1.25.02-1.61.36-.36.33-.66.63-.1.46zm6.74-.86a2 2 0 011.87.53c.22.2-.2.29-.45.15a3.97 3.97 0 00-1.92-.21c-.63.13-.04-.35.5-.47z"/><path fill="%23462000" d="M13.3 12.7c-.04-.56.32-3.23 1.6-3.2 1.88.03 1.56 2.63 1.54 3.28-.02.49-.69.38-.72-.09-.02-.44.03-2.24-.99-2.18-.57.03-.66 1.84-.7 2.24-.04.4-.7.52-.73-.05zm-6.53 0c-.03-.56.33-3.22 1.6-3.2 1.89.04 1.57 2.64 1.54 3.28-.01.49-.68.38-.7-.08-.03-.44.01-2.25-1-2.2-.57.04-.66 1.85-.7 2.25-.04.4-.7.52-.74-.04z"/><path fill="%23F3F3F3" d="M8.26 14.93c.7-.42 1.39.32 3.16.62 1.78.3 2.71-.92 3.1-1.2.73-.58 1.68.82 1 1.98-.7 1.16-2.52 1.92-4.08 1.77-1.55-.14-2.77-.82-3.3-1.5-.52-.7-.32-1.4.12-1.67z"/><path stroke="%23C3C3C3" stroke-width=".4" d="M10.48 15.37l-.7 2.21m3.13-2.14l.56 2.33" stroke-linecap="round" stroke-linejoin="round"/><path stroke="%23863F01" stroke-width=".4" d="M8.26 14.93c.7-.42 1.39.32 3.16.62 1.78.3 2.71-.92 3.1-1.2.73-.58 1.68.82 1 1.98-.7 1.16-2.52 1.92-4.08 1.77-1.55-.14-2.77-.82-3.3-1.5-.52-.7-.32-1.4.12-1.67z"/><path fill="%23FFC415" d="M1.13 13.7c.35-.86.38-2.24.32-3.02-.1-1.54 1.75-1.37 2.38.35.22.59.1 1 .01 1.43 1.6-.13 2.67.08 2.74 1.29.05.9-.48.85-.43 1.39.01.13.34.55.26.98-.05.3-.13.63-.26.98-.07.2.12.84.02 1.05-.48 1.02-1.17 1.54-2.39 1.49a3.42 3.42 0 01-3.4-3.73c.04-.85.45-1.5.75-2.21z"/><path stroke="%236D3705" stroke-width=".7" d="M1.13 13.7c.35-.86.38-2.24.32-3.02-.1-1.54 1.75-1.37 2.38.35.22.59.1 1 .01 1.43 1.6-.13 2.67.08 2.74 1.29.05.9-.48.85-.43 1.39.01.13.34.55.26.98-.05.3-.13.63-.26.98-.07.2.12.84.02 1.05-.48 1.02-1.17 1.54-2.39 1.49a3.42 3.42 0 01-3.4-3.73c.04-.85.45-1.5.75-2.21z" stroke-linecap="round" stroke-linejoin="round"/></g></svg>',
        tongue_8c79c: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M5.11 4.85c1.82-1.27 3.4-1.55 3.73-2.77.2-.72.07-1.15-.65-2.08 2.12.7 3.35 1.73 3.65 2.57.5 1.36-.16 2.88.49 3.02.62.13 1.06-.89.94-1.83a9.67 9.67 0 013.49 7.43A7.5 7.5 0 018.99 19c-4.3 0-7.78-3.27-7.78-7.3 0-3.72 2.08-5.58 3.9-6.85z"/><path fill="%23462000" d="M6.07 15.05a4.31 4.31 0 00-.55 3.58c.3.93 1.75 1.27 2.9 1.2 1.13-.05 2.47-.74 2.54-1.66.08-.91-.2-2.55.3-3.03-1.36.06-4.33.1-5.2-.09z"/><path fill="%23CF4324" d="M6.5 15.14c-.28.39-1.02 1.9-.57 3.27.26.8 1.51 1.06 2.48 1 .97-.05 2.03-.7 2.1-1.48.05-.78-.07-2.33.22-2.8-1.16.06-3.5.17-4.24 0z"/><path fill="%23F29A89" d="M6.53 16.35c-.08.3-.29 1.4.03 1.86.31.47.82.54.95.59.14.05.04.3-.31.23-.35-.07-.82-.2-1.03-.69a3.92 3.92 0 010-2.04c.15-.36.42-.15.36.05zm1.84-.7c-.03.14-.2.93-.15 1.17.04.24-.35.25-.36.08 0-.17.08-1 .13-1.26.05-.25.43-.25.38 0z"/><path fill="%23462000" d="M4.53 14.38c.39.15 4.74 1.62 8.68-.67.37-.2.66.47.23.72a10.1 10.1 0 01-9.05.49c-.24-.11-.3-.7.14-.54zm5.25-2.95c-.26.68.12 1.33.86 1.16.95-.22 1.73-.42 3.2-.48.67-.03.63-.66.12-.82-.5-.15-1.44 0-2.59.25-.1.02-.67.17-.3-.4a4.45 4.45 0 011.94-1.69c.92-.42.08-.94-.45-.73a5.23 5.23 0 00-2.78 2.7zm-2.26.69A4.88 4.88 0 005.66 9c-.42-.28-.99.05-.7.3a6.45 6.45 0 011.5 2c.01.06-.11.35-.36.23-.67-.23-1.64-.5-2.04-.5-.46-.02-.9.56-.06.74.85.17 2.1.5 2.8.75.57.2.78-.03.72-.4z"/></g></svg>',
        unicorn_041db: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FF0068" d="M16.04 5.24c-1.43-2.6-7.37 1.04-7.24.85 1.38-2.12 4.16-4.3 7.56-2.9 2.02.83 2.67 2.75 1.96 6.74-.3 1.7.58 4.61 3.23 6.18-.57.34-2.45.3-2.91-.17-3.44-3.57-.71-7.26-2.6-10.7z"/><path fill="%23FF0068" d="M16.73 5.24c-1.24-2.06-6 .42-7.67 1.26-.44.22-.45-.32-.42-.36 2.31-3.06 4.88-4.57 7.58-3.5 2.7 1.08 3.78 3.3 3 7.3-.32 1.69.64 4.6 3.54 6.17-.63.34-2.69.3-3.19-.17-3.76-3.57-.78-7.26-2.84-10.7z"/><path fill="%23EDE34A" d="M9.27 6.38c2.6-3.22 6.88-2.98 7.88-2.04 3.36 3.15-1.4 7.95 3.85 11.43-.37.03-1.23.04-1.44 0-.06.3 1.18 1.34 1.68 1.76-.42.37-3.71-.15-4.1-.73-2.6-3.83-.6-8.35-2.34-10.57-1.51-1.93-4.38-.23-5.37.33-.3.17-.22-.12-.16-.18z"/><path fill="%2347BD30" d="M9.12 6.72c3.3-2.6 6.35-2.21 7.3-1.19 2.9 3.13-1.37 8.54 4.1 12.15-.59.01-1.05.05-2.07-.2.08.18.2.38.27.51-2.66-1.76-2.46-3.18-2.22-5.74.2-2.04.29-4.01-.63-5.41-.93-1.42-4.22-.77-6.45.07-.21.08-.1-.28-.3-.19z"/><path fill="%230398D2" d="M16.18 12.7c.08-1.9-.3-4.94-1.79-6.71.47.1 1.15.36 1.45.73 1.65 2 .47 6.98.67 8.4.09.57.88 2.09 2.3 2.93.05.19.4.67.5.85-1.95-.31-4.15-.87-4.54-2.72.37-1.07 1.38-2.63 1.41-3.49z"/><path fill="%23FFB612" d="M11.45 3.34l-.18-.53C10.96 1.94 9.7.87 7.54.13c.73.97.99 2.02.8 2.77-.4 1.5-2.72 1.98-4.28 3.03a7.9 7.9 0 00-3.1 3.6 7.33 7.33 0 00-.56 2.82c0 4.2 3.57 7.63 7.96 7.63a8.07 8.07 0 006.14-2.79c.15-.14.34-.42.43-.54a7.38 7.38 0 001.36-4.83 10.2 10.2 0 00-3.56-7.76c.1.83-.2 1.72-.68 1.89-.09.03-1.99.66-2.52.97-.15-.1-.63-.6-.63-.78.95-1.64 2.1-2.44 2.55-2.8z"/><path fill="%23462000" d="M3.11 10.32c-.25.82-.1 2.69 1.26 2.77 1.4.08 1.81-1.95 1.86-2.44.02-.17-.08-.31-.16-.34-.08-.04-.3-.04-.4.22-.07.27-.39 1.82-1.17 1.83-.79 0-.94-1.58-.8-1.95.07-.18-.1-.33-.2-.35a.35.35 0 00-.39.26zm6.31.16c-.27.83-.11 2.71 1.38 2.8 1.53.07 2.01-1.77 2.08-2.15.07-.39-.07-.5-.16-.53-.09-.03-.35-.04-.44.23-.1.27-.45 1.71-1.34 1.71-.9 0-1.02-1.43-.87-1.97.05-.19-.12-.33-.22-.35-.1-.02-.34 0-.43.26z"/><path fill="%23F3F3F3" d="M4.76 15.74c.6-.4 1.24.23 2.83.4 1.58.19 2.35-.93 2.67-1.2.63-.55 1.53.65.98 1.71s-2.14 1.82-3.52 1.76c-1.38-.06-2.5-.6-2.99-1.18-.5-.59-.35-1.23.03-1.49z"/><path stroke="%239CACC2" stroke-width=".5" d="M6.74 16.03l-.52 2m2.68-2.04l.6 2.03" stroke-linecap="round" stroke-linejoin="round"/><path stroke="%23663000" stroke-width=".5" d="M4.76 15.74c.6-.4 1.24.23 2.83.4 1.58.19 2.2-.88 2.55-1.13.77-.54 1.65.58 1.1 1.64-.55 1.06-2.14 1.82-3.52 1.76-1.38-.06-2.5-.6-2.99-1.18-.5-.59-.35-1.23.03-1.49z" stroke-linecap="round" stroke-linejoin="round"/><path fill="%23FF0069" d="M13.18.57l.15-.34a.29.29 0 01.38-.14c.15.06.22.23.15.38l-.15.33.33.15a.29.29 0 11-.23.53l-.33-.15-.15.33a.29.29 0 11-.53-.23l.15-.34-.33-.15a.29.29 0 11.23-.52l.33.15z"/><path fill="%2300B8FF" d="M2 1.82l-.07-.34a.28.28 0 01.54-.13l.08.34.34-.08c.15-.03.3.06.33.21.04.15-.05.3-.2.34l-.35.08.08.34c.04.15-.05.3-.2.33a.28.28 0 01-.34-.2l-.08-.35-.34.08a.28.28 0 01-.13-.54l.35-.08z"/><path fill="%2393FF7D" d="M.83 5.73l-.25-.25a.28.28 0 11.4-.4l.25.25.25-.26c.12-.1.3-.1.4 0 .12.11.12.3 0 .4l-.25.26.26.25c.11.11.11.3 0 .4a.28.28 0 01-.4 0l-.26-.25-.25.26a.28.28 0 11-.4-.4l.25-.26z"/><path fill="%2300B8FF" d="M2.99 3.79a.34.34 0 110 .69.34.34 0 010-.7zm8.27-2.66a.35.35 0 110 .7.35.35 0 010-.7z"/><path fill="%2393FF7D" d="M15.98.58a.34.34 0 110 .7.34.34 0 010-.7z"/><path fill="%23FFF77D" d="M5.95 1.13a.32.32 0 110 .64.32.32 0 010-.64z"/><path fill="%23FF0069" d="M.5 1.9a.45.45 0 110 .88.45.45 0 010-.89zm16.22-.38a.45.45 0 110 .89.45.45 0 010-.9z"/><path fill="%23863F01" d="M3.27 0s2.2 7.66 2.52 8.4c.12.29 1 2.2 2.78 1.3a2.07 2.07 0 00.9-2.96C8.33 5.17 3.27 0 3.27 0z"/><path fill="%23FFE7CE" d="M4.3 1.73s1.57 5.64 1.85 6.3c.1.25.76 1.9 2.2 1.17a1.5 1.5 0 00.69-2.16c-1-1.39-4.74-5.3-4.74-5.3z"/><path fill="%237A3A00" d="M4.78 4.14c.12.17.98.54 1.86-.17.15 0 .16.26.22.32-.26.3-.91.6-1.8.45a.76.76 0 01-.28-.6zm1.18 3.52c.26.19 2.1.8 3.19-.53.29.07.44.22.2.45-.24.22-1.33 1.12-3.22.58-.1-.15-.1-.3-.17-.5zM5.4 5.93c.28.1 2.01.54 2.6-.34.16.05.37.27.26.38-.1.12-.59.85-2.63.46-.13-.1-.2-.3-.23-.5z"/><path fill="%23D34101" d="M11.62 14.35a.18.18 0 01-.16-.1.18.18 0 01.08-.24l1.79-.93c.09-.04.2 0 .24.08.05.09.01.2-.08.24l-1.79.93a.18.18 0 01-.08.02m1 .14a.18.18 0 01-.18-.11c-.03-.1.01-.2.1-.23l2.77-1.13c.1-.04.2 0 .24.1.04.1 0 .2-.1.23l-2.77 1.13a.19.19 0 01-.07.01"/><path fill="%23D54000" d="M13.82 14.68a.18.18 0 01-.05-.35l1.51-.4c.1-.02.2.04.22.13.03.1-.03.2-.13.22l-1.5.4a.2.2 0 01-.05 0"/><path fill="%23D34101" d="M.68 14.13a.18.18 0 01-.17-.12c-.04-.1.02-.2.11-.23l1.52-.5c.1-.02.2.03.23.12.03.1-.02.2-.12.23l-1.52.5H.68m.7.65a.18.18 0 01-.17-.11c-.04-.1 0-.2.1-.24l2.77-1.12c.1-.04.2 0 .23.1.04.09 0 .2-.1.23l-2.76 1.13a.17.17 0 01-.07.01m1.56.08a.18.18 0 01-.06-.34l1.44-.6c.09-.04.2 0 .23.1.04.09 0 .2-.1.23l-1.44.6a.18.18 0 01-.07.01"/></g></svg>',
        wink_53fb6: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="a" d="M2.54 1.13C1.5 1.1.51 2.31.4 3.9.28 5.49.77 6.82 1.98 6.87c1.46.07 2-1.2 2.12-2.8.11-1.58-.5-2.9-1.56-2.94z"/></defs><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><g transform="translate(3.03 8.08)"><mask id="b" fill="%23fff"><use xlink:href="%23a"/></mask><use fill="%23FFF" transform="rotate(-7 2.25 4)" xlink:href="%23a"/><path fill="%23462000" d="M3.02 2.24c1 0 1.24.9 1.24 2S3.8 6.23 3.02 6.23c-.98 0-1.24-.9-1.24-2s.56-1.99 1.24-1.99z" mask="url(%23b)" transform="rotate(-7 3.02 4.24)"/></g><path fill="%23B55500" d="M4.36 7.63c.26-.2.88-.64 1.68-.73.8-.1.13-.57-.36-.6-.48-.03-1.16.42-1.38.86-.22.44-.4.83.06.47z"/><path fill="%23462000" d="M9.61 16.52c.68.01 2.12-.14 3.05-1.62.42-.67 1.12-.33.9.16-.42.94-1.3 2.42-4 2.4-1-.01-1.07-.95.05-.94z"/><path fill="%23B55500" d="M11.14 7.5c-.3.06-1.01.23-1.57.76-.57.52-.5-.26-.22-.63.27-.37 1.02-.57 1.48-.46.46.1.85.2.3.33z"/><path fill="%23462000" d="M8.8 12.1c-.3.74.1 1.46.93 1.29 1.04-.23 1.9-.43 3.52-.47.74-.02.7-.71.15-.9-.54-.17-1.58-.03-2.85.22-.12.03-.74.19-.32-.44a4.9 4.9 0 012.16-1.82c1.02-.44.1-1.03-.48-.81a5.75 5.75 0 00-3.1 2.92z"/></g></svg>',
        worldcup_cf32e: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="20"><g fill="none" fill-rule="evenodd"><path fill="%231d1f20" d="M19.45 6.62a6.57 6.57 0 0 1 2.96 8.8 6.57 6.57 0 0 1-8.86 2.78 6.57 6.57 0 0 1-2.95-8.8 6.57 6.57 0 0 1 8.85-2.78"/><path fill="%23f6f6f6" d="M18.34 18.28a6.26 6.26 0 0 1-4.57-.42c1.17.33 1.92.11 2.33-.04.75.37 1.49.44 2.2.36zm-2.05-2.15a8.7 8.7 0 0 1-2.01-1.99c-.79.04-1.46.03-2.01-.06A4 4 0 0 0 11.9 16c.37.56.9 1.1 1.6 1.57.48.14 1.57.4 2.47.03l.3-1.47zm-5.84-5.1c.3.28.82.48 1.08.55-.07 1 .2 1.72.53 2.39a3.9 3.9 0 0 0-.4 1.78 4 4 0 0 1-.42-.2 6.12 6.12 0 0 1-.8-4.51zm11.24 4.8a6.02 6.02 0 0 1-3.1 2.37l-.03-.08c.53-.3.98-.74 1.38-1.25.58-.2 1.33-.71 1.75-1.04m-3.88-4.92c-.36.09-1.84.44-2.71.77L14.49 14c.3.43.75 1 2.02 1.97.8-.12 1.59-.31 2.3-.6.4-1.01.68-2.08.73-2.72-.48-.54-1.02-1.1-1.73-1.74m3.56.84c-.55.34-1.1.66-1.6.9-.04 1-.55 2.4-.71 2.79l.94 1.15a7 7 0 0 0 1.92-1.32c.25-.65.38-1.2.5-2.26a3.3 3.3 0 0 0-1.05-1.26m-8.32-4.47c.3.06.59.2.89.41a6.8 6.8 0 0 0-.76 2.36 3.6 3.6 0 0 0-1.56 1.28c-.67-.14-.98-.42-1.1-.6a6 6 0 0 1 2.53-3.45m3.52-.16a5.9 5.9 0 0 0-2.36.57 7.9 7.9 0 0 0-.77 2.39c.56.43 1.11.87 1.6 1.37.43-.15 2.17-.68 2.73-.76l.64-1.9a8.6 8.6 0 0 0-1.84-1.67m4.7 1.46a6.2 6.2 0 0 1 1.42 4.12l-.13.07a3.5 3.5 0 0 0-1.1-1.25 5 5 0 0 0-.63-2.18c.16-.2.34-.5.44-.76m-4.15-2.25a6.3 6.3 0 0 1 3.96 2.04c-.07.19-.28.6-.43.8a6 6 0 0 0-2.01-.52 8 8 0 0 0-1.83-1.68c.1-.18.2-.37.3-.64z"/><path fill="%23ffb612" d="M12.46 5.1C10.52 3.78 8.84 3.48 8.5 2.2c-.2-.76-.08-1.2.69-2.19C6.94.75 5.63 1.82 5.3 2.7c-.53 1.44.17 3.04-.52 3.18-.66.14-1.13-.93-1-1.92a10.14 10.14 0 0 0-3.7 7.82C-.06 16.08 3.16 20 8.33 20c4.56 0 8.27-3.45 8.27-7.69 0-3.91-2.21-5.86-4.15-7.2z"/><path fill="%23fff" d="M12.94 14.58a.22.22 0 0 0-.05-.18.25.25 0 0 0-.17-.09 34.8 34.8 0 0 0-7.98.25c-.66.12-1.16.36-.63 1.15.97 1.43 2.37 2.46 4.22 2.46a4.6 4.6 0 0 0 4.61-3.6z"/><path fill="%23d1d5db" d="M4.27 15.94c.18.25.38.48.59.7l1.08.32.05-.71 2.06-.16c.94-.1 1.05-.46.06-.43l-2.58.12-.04.52z"/><path fill="%23863f01" d="M12.9 7.53a4 4 0 0 0-2.03-.14c-.88.19-.34-.54.16-.74s1.42-.07 1.81.3c.39.36.67.78.05.58zM5.43 6.42a1.88 1.88 0 0 0-1.93.61c-.21.22.22.46.5.31.26-.14 1.4-.38 2.09-.23s-.06-.57-.66-.7z"/><path fill="%23462100" d="M6.44 12.08c.04-.62-.35-3.52-1.74-3.5-2.06.04-1.7 2.88-1.68 3.58.01.53.74.41.77-.1.03-.47-.19-2.56.92-2.5.62.04.89 2.13.93 2.57s.77.56.8-.05m7.12 0c.03-.61-.35-3.52-1.75-3.5-2.05.05-1.7 2.88-1.68 3.59.02.53.75.4.78-.1.03-.48-.23-2.5.88-2.44.62.04.92 2.06.96 2.5.05.44.77.57.8-.05z"/></g></svg>',
        woot_2d139: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20"><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><g transform="translate(.3 7.9)"><g transform="translate(.8 .16)"><ellipse cx="3.67" cy="3.62" fill="%23FFF" rx="3.41" ry="3.51"/><ellipse cx="3.61" cy="3.55" fill="%235C2A00" rx="2.28" ry="2.35"/><ellipse cx="5.04" cy="2.56" fill="%23FFF" rx=".75" ry=".77"/></g><g transform="translate(8.56 .16)"><ellipse cx="3.54" cy="3.62" fill="%23FFF" rx="3.41" ry="3.51"/><ellipse cx="3.6" cy="3.67" fill="%235C2A00" rx="2.36" ry="2.43"/><ellipse cx="4.89" cy="2.59" fill="%23FFF" rx=".8" ry=".83"/></g><ellipse cx="8.58" cy="8.4" fill="%235C2A00" transform="rotate(93 8.58 8.4)" rx="1.31" ry=".88"/></g></g></svg>',
        worried_f0e87: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="a" d="M2.42.7C1.44.64.52 1.72.42 3.12.32 4.52.77 5.7 1.9 5.74c1.36.06 1.87-1.06 1.97-2.46.11-1.4-.46-2.56-1.45-2.6z"/><path id="c" d="M2.42.7C1.44.64.52 1.72.42 3.12.32 4.52.77 5.7 1.9 5.74c1.36.06 1.87-1.06 1.97-2.46.11-1.4-.46-2.56-1.45-2.6z"/></defs><g fill="none" fill-rule="evenodd"><path fill="%23FFB612" d="M4.37 5.1C6.3 3.78 7.99 3.48 8.33 2.2c.2-.76.07-1.2-.7-2.19 2.26.75 3.57 1.82 3.89 2.7.53 1.44-.17 3.04.51 3.18.67.14 1.13-.93 1-1.92 2.19 1.97 3.6 4.2 3.71 7.82.14 4.3-3.08 8.22-8.25 8.22-4.56 0-8.27-3.45-8.27-7.69 0-3.91 2.2-5.86 4.15-7.2z"/><path fill="%23863F01" d="M10.78 8.23c.8.26 1.85.3 1.85.3l.03.4s-1.6.41-2.55-.25c-.98-.67-.6-1.72-.62-1.72l.4-.03s.17 1.07.89 1.3zm-4.62.01c-.69.52-1.69.6-1.69.6l-.08-.36s.75-.23 1.37-.75c.54-.45.93-1.18.93-1.18l.34.11s0 .98-.87 1.58z"/><path fill="%23662700" d="M6.34 11.87c0 .51-.33.93-.74.93-.4 0-.74-.42-.74-.93 0-.52.34-.94.74-.94.41 0 .74.42.74.94m4.8-.13c0 .51-.32.93-.73.93s-.74-.42-.74-.93c0-.52.33-.94.74-.94.4 0 .74.42.74.94"/><path fill="%234582C3" d="M13.6 4.87a.43.43 0 00-.25.22c-.73 1.6-1.42 3.58-.2 4.82.62.62 1.5.84 2.31.58.86-.28 1.42-1 1.49-1.89.12-1.82-1.66-2.99-3-3.7a.43.43 0 00-.34-.03"/><path fill="%239AC8F9" d="M13.77 5.37c1.47.78 2.72 1.75 2.63 3.12a1.6 1.6 0 01-1.12 1.42c-.58.19-1.25.08-1.77-.44-.98-1-.37-2.73.26-4.1"/><path fill="%23FFF" d="M16.05 8.87c.17-.31.14-.65-.06-.76-.2-.1-.5.06-.67.38-.17.31-.14.65.06.76.2.1.5-.06.67-.38z"/><g transform="translate(3.2 8.55)"><mask id="b" fill="%23fff"><use xlink:href="%23a"/></mask><use fill="%23FFF" xlink:href="%23a"/><path fill="%23462000" d="M1.38 1.86c.86 0 1.07.78 1.07 1.73 0 .96-.4 1.73-1.07 1.73C.54 5.32.32 4.55.32 3.6S.8 1.87 1.38 1.87z" mask="url(%23b)"/></g><g transform="translate(9 8.63)"><mask id="d" fill="%23fff"><use xlink:href="%23c"/></mask><use fill="%23FFF" xlink:href="%23c"/><path fill="%23462000" d="M1.38 1.86c.86 0 1.07.78 1.07 1.73 0 .96-.4 1.73-1.07 1.73C.54 5.32.32 4.55.32 3.6S.8 1.87 1.38 1.87z" mask="url(%23d)"/></g><path fill="%23462000" d="M10.11 17.64c-.16.03-1.1-.18-1.85-.18-.59 0-1.19.24-1.47.25-.23 0-.96-.03-.94-.63.02-.6.75-1.24 1.13-1.38 1-.38 1.8-.32 2.51-.01.71.3 1.07.6 1.28 1.2.13.37-.37.7-.66.75z"/><path fill="%23D54001" d="M7.72 17.52c.17-.04.35-.06.54-.06.75 0 1.69.2 1.85.18.13-.02.3-.1.43-.2-.2-.3-.58-.57-1.04-.71-.81-.25-1.6-.02-1.76.5a.68.68 0 00-.02.29z"/><path fill="%23D34101" d="M11.72 15.03l1.7-1.05c.09-.05.2 0 .24.1.04.1 0 .21-.08.27 0 0-1.5.93-1.7 1.04-.18.1-.43-.2-.16-.36zm.96.16l2.64-1.28c.28-.1.38.26.13.38l-2.64 1.27c-.32.13-.37-.26-.13-.37zm1.17.2l1.44-.44c.3-.07.38.3.08.4l-1.44.44c-.28.08-.4-.29-.08-.4zm-13.1-.48l1.44-.56c.3-.08.4.27.11.39l-1.45.56c-.26.1-.43-.27-.1-.4zm.6.47L4 14.11c.36-.13.43.23.13.38l-2.64 1.27c-.26.11-.42-.23-.13-.38zm1.78-.1l1.37-.67c.22-.1.37.24.13.37l-1.37.68c-.26.12-.42-.25-.13-.38z"/></g></svg>',
        zombie_8e9af: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20"><g fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M.48 10.2c.23.08 2.34-.43.9-3.3.81.35 1.32.29 1.8-.5.1 1.2 2.44 1.55 3 1 .74-.71.95-1.9-.39-3.6 3.62.5 3.01 2.17 2.48 3.75-.53 1.58-5.78 5.87-7.8 2.65z" fill="%23758E6B"/><path fill-rule="evenodd" clip-rule="evenodd" d="M6.03 6.6c.35-.26.78-.4 1.24-.4 1.12 0 2.03.85 2.03 1.9 0 1.06-.91 1.92-2.03 1.92a2.1 2.1 0 01-1.16-.34 2.1 2.1 0 01-1.51.38v.01c0 1-.75 1.8-1.68 1.8-.92 0-1.67-.8-1.67-1.8 0-.96.71-1.75 1.6-1.8v-.1c0-1.06.9-1.92 2.03-1.92.43 0 .83.13 1.15.34z" fill="%23EC84A0"/><path d="M2.77 8.7c-.36.08-.83.4-1 .87m1.68-1.83c.03-.2.28-.91 1.35-1.07L3.45 7.74z" stroke="%23FDBFCD" stroke-width=".41" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.95 6.64c-.59-.02-1.42.34-1.33 1.4m-2.53.91c0-.15.28-.9.93-.94.65-.04.78.25.86.3.3-.45 1.07-.38 1.16.26l-2.95.38zm.6-.91C4.44 7.9 3.12 7.83 3.2 9l1.5-.96zm.58-.07c.11-.28.65-.84 1.33-.6l-1.33.6zm.17-.37c-.27-.27-1.07-.47-1.32.26l1.32-.26zm-3.87 3.03c.03-.4.57-.87 1.04-.74l-1.04.74zm1.18-.27c-.07-.3-.25-1.08.74-1.38l-.74 1.38z" stroke="%23E8688B" stroke-width=".2" stroke-linecap="round" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5.06 4.03c0-.46.06-.96.25-1.44.34-.87 1.62-1.91 3.79-2.6-.76.97-.9 1.41-.73 2.18.29 1.29 1.89 1.64 3.7 3.04 1.8 1.4 3.86 3.42 3.73 7.34a7.81 7.81 0 01-8.14 7.44c-4.93-.15-7.9-4.17-7.63-8.47.04-.61.11-1.19.21-1.73.36.5.9.81 1.48.81 1.03 0 1.88-.96 1.95-2.18.18.16.37.3.59.4 1.18.53 2.6-.06 3.2-1.34.58-1.27.1-2.74-1.08-3.28-.43-.2-.89-.25-1.32-.17z" fill="%238B9B85"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5.64 10.08c-1.25-.11-2.38.95-2.47 2.41-.1 1.46.53 2.73 1.97 2.86 1.74.16 2.35-.98 2.44-2.44.09-1.46-.68-2.71-1.94-2.83z" fill="%236D8863"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5.31 9.6c-1.25.08-2.24 1.29-2.14 2.72.1 1.43.87 2.57 2.31 2.48 1.75-.1 2.2-1.3 2.1-2.73-.09-1.43-1-2.54-2.27-2.46z" fill="%23FAF6C1"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11 10.1c-1.2.43-1.87 1.9-1.44 3.3.43 1.4 1.46 2.33 2.84 1.84 1.67-.59 1.84-1.9 1.4-3.3-.43-1.4-1.59-2.25-2.8-1.83z" fill="%236D8863"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11.5 9.6c-1.26.08-2.25 1.29-2.15 2.72.1 1.43.87 2.57 2.32 2.48a2.14 2.14 0 002.12-2.08 4.7 4.7 0 000-.65c-.1-1.43-1.02-2.54-2.29-2.46z" fill="%23FAF6C1"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11.6 11.23c-.53.03-.95.58-.9 1.24.04.65.36 1.17.97 1.13.74-.05.93-.6.9-1.25-.05-.65-.44-1.16-.97-1.12zm-6.35 0c-.53.03-.95.58-.9 1.24.03.65.36 1.17.97 1.13.73-.05.93-.6.89-1.25-.04-.65-.43-1.16-.96-1.12z" fill="%2344230D"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5.75 16.54c.42-.68 1.34-1.18 3-1.17 1.67.02 2.37.57 2.64.96.27.4.6 1.71-.84 1.5-1.4-.2-2.11-.22-3.76.18-1.08.27-1.55-.66-1.04-1.47z" fill="%2337452C"/><path fill-rule="evenodd" clip-rule="evenodd" d="M6.85 18a.74.74 0 01-.04-.25c0-.61.77-1.11 1.71-1.11.95 0 1.72.5 1.72 1.1a.7.7 0 010 .05 7.8 7.8 0 00-3.39.2z" fill="%23ADD49D"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10.79 17.86c.21.12.14.46.11.73-.02.26-.1.57.18.6.29.03.4-.35.31-.7-.08-.35-.31-1.15-.85-.65l.25.02z" fill="%23FAF6C1"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2.77 15.98c.25-.13.58 0 .73.29.16.29.09.63-.16.77-.24.13-.57 0-.73-.29-.15-.29-.08-.63.16-.77zm1.13 1.05c.15-.08.33 0 .42.16.08.16.03.36-.1.43-.15.08-.33 0-.42-.16-.08-.17-.04-.36.1-.43zM11.07 7c.27-.05.53.17.59.48.05.3-.13.6-.4.64-.27.05-.54-.16-.59-.47-.05-.31.12-.6.4-.65zM12 8.16c.13 0 .24.11.24.25s-.1.25-.24.25a.25.25 0 01-.25-.25c0-.14.11-.25.25-.25z" fill="%236D8863"/><path fill-rule="evenodd" clip-rule="evenodd" d="M3.15 12.76l-.05-.45C3 10.84 4 9.6 5.3 9.53c1.3-.07 2.25 1.06 2.35 2.52v.33c-1.4.05-3.01.43-4.5.38zm6-.48c-.1-1.5.98-2.74 2.35-2.82 1.37-.08 2.37 1.08 2.48 2.59.01.15.02.3.01.45-1.76.12-3.14-.1-4.84-.22z" fill="%23838E7E"/><path fill-rule="evenodd" clip-rule="evenodd" d="M4.96 13.1a.2.2 0 00-.22-.2l-.45.02a.2.2 0 10.02.41l.45-.02a.2.2 0 00.2-.22zm6.24-.21a.2.2 0 00-.22-.2l-.45.02a.2.2 0 00.02.42l.45-.02a.2.2 0 00.2-.22z" fill="%23fff"/></g></svg>',
      };

      const defaultEmoteWidth = `
        width: 1.0625em !important; /* Prevent the override of the default width that comes from the Pepper's .emoji class */
      `;

      css += `
        .emoji--type-angel {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.angel_4e27f}');
          width: 1.625em;
        }
        .emoji--type-annoyed {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.annoyed_b07c1}');
          ${defaultEmoteWidth}
        }
        .emoji--type-blank {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.blank_822a0}');
          width: 1.25em;
        }
        .emoji--type-cheeky {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.cheeky_b10b9}');
          ${defaultEmoteWidth}
        }
        .emoji--type-confused {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.confused_36f0a}');
          width: 1.1875em;
        }
        .emoji--type-cool {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.cool_894b1}');
          width: 1.375em;
        }
        .emoji--type-cry {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.cry_b8c80}');
          ${defaultEmoteWidth}
        }
        .emoji--type-devil {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.devil_b2062}');
          width: 1.3125em;
        }
        .emoji--type-embarrassed {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.embarrassed_fa379}');
          ${defaultEmoteWidth}
        }
        .emoji--type-excited {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.excited_141fa}');
          width: 1.125em;
        }
        .emoji--type-fierce {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.fierce_30b68}');
          ${defaultEmoteWidth}
        }
        .emoji--type-flirt {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.flirt_27e52}');
          width: 1.125em;
        }
        .emoji--type-football {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.football_69030}');
          width: 1.3125em;
        }
        .emoji--type-happy {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.happy_da384}');
          ${defaultEmoteWidth}
        }
        .emoji--type-highfive {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.highfive_5ffa5}');
          width: 1.375em;
        }
        .emoji--type-horror {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.horror_566a5}');
          ${defaultEmoteWidth}
        }
        .emoji--type-kitty {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.kitty_c8091}');
          width: 1.25em;
        }
        .emoji--type-laugh {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.laugh_70618}');
          ${defaultEmoteWidth}
        }
        .emoji--type-lipstick {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.lipstick_484aa}');
          width: 1.4375em;
        }
        .emoji--type-lol {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.lol_b5c8d}');
          ${defaultEmoteWidth}
        }
        .emoji--type-love {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.love_c7110}');
          ${defaultEmoteWidth}
        }
        .emoji--type-mad {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.mad_fa9ae}');
          ${defaultEmoteWidth}
        }
        .emoji--type-nerd {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.nerd_57277}');
          ${defaultEmoteWidth}
        }
        .emoji--type-ninja {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.ninja_771d8}');
          width: 1.25em;
        }
        .emoji--type-nutella {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.nutella_474f8}');
          width: 1.625em;
        }
        .emoji--type-onion {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.onion_7ee7d}');
          ${defaultEmoteWidth}
        }
        .emoji--type-party {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.party_ae2b6}');
          width: 1.8125em;
        }
        .emoji--type-pirate {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.pirate_a6d26}');
          ${defaultEmoteWidth}
        }
        .emoji--type-police {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.police_058f2}');
          ${defaultEmoteWidth}
        }
        .emoji--type-poo {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.poo_115b2}');
          width: 1.3125em;
        }
        .emoji--type-popcorn {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.popcorn_3c9c0}');
          width: 1.5625em;
        }
        .emoji--type-relieved {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.relieved_07108}');
          width: 1.125em;
        }
        .emoji--type-sad {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.sad_46b75}');
          ${defaultEmoteWidth}
        }
        .emoji--type-shock {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.shock_db4e3}');
          ${defaultEmoteWidth}
        }
        .emoji--type-sir {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.sir_16b5b}');
          width: 1.25em;
        }
        .emoji--type-skeptical {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.skeptical_51344}');
          ${defaultEmoteWidth}
        }
        .emoji--type-smiley {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.smiley_b8bfd}');
          ${defaultEmoteWidth}
        }
        .emoji--type-strong {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.strong_676f6}');
          width: 1.5625em;
        }
        .emoji--type-thumb {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.thumb_98587}');
          width: 1.25em;
        }
        .emoji--type-tongue {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.tongue_8c79c}');
          ${defaultEmoteWidth}
        }
        .emoji--type-unicorn {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.unicorn_041db}');
          width: 1.5em;
        }
        .emoji--type-wink {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.wink_53fb6}');
          ${defaultEmoteWidth}
        }
        .emoji--type-woot {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.woot_2d139}');
          ${defaultEmoteWidth}
        }
        .emoji--type-worldcup {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.worldcup_cf32e}');
          width: 1.5em;
        }
        .emoji--type-worried {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.worried_f0e87}');
          ${defaultEmoteWidth}
        }
        .emoji--type-zombie {
          background-image: url('data:image/svg+xml,${originalPepperEmoticonsWithHashCharEncoded.zombie_8e9af}');
          width: 1em;
        }
      `;
    }

    /* Hide top deals widget */
    if (pepperTweakerConfig.improvements.hideTopDealsWidget) {
      css += `
        .listLayout .vue-portal-target, .listLayout-side .vue-portal-target,
        .js-vue3[data-vue3*="HottestWidget"] {
          display: none !important;
        }
      `;
    }

    /* Hide top bar with group & category buttons */
    if (pepperTweakerConfig.improvements.hideGroupsBar) {
      css += `
        header .subNav--light {
          display: none !important;
        }
        #subNavMenu {
          top: 57px !important;
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
      const secondaryTextColor = '#8f949b';
      // const greyButtonColor = '#8f949b';
      // const orangeColor = '#d1d5db';

      css += `
        :root {
          /* text color variables used by Pepper */
          --textNeutralPrimary: ${textColor} !important;
          --textNeutralSecondary: ${textColor} !important;
          --textTranslucentPrimary: ${textColor} !important;
          --textTranslucentSecondary: ${secondaryTextColor} !important;
          --textTranslucentSecondaryHover: ${textColor} !important;
          --textTranslucentTertiary: ${textColor} !important;
          --graphicTranslucentTertiary: ${secondaryTextColor} !important;
          --graphicTranslucentTertiaryHover: ${textColor} !important;
          --graphicTranslucentSecondary: ${secondaryTextColor} !important;

          /* background color variables used by Pepper */
          --bgBaseSecondary: ${darkBackgroundColor};
          --bgNeutralPrimary: ${lightBackgroundColor};

          /* border color variables used by Pepper */
          --borderNeutralPrimary: ${lightBorderColor};
        }
        .subNavMenu-link,
        .vote-temp--inert,
        .formList-label,
        .navMenu-label,
        .card-title,
        #threadBreadcrumbsPortal .text--color-white,
        footer .text--color-white,
        .text--color-charcoalShade,
        .comments-pagi--header .comments-pagi-pages:not(:disabled),
        .page2-center .mute--text2, .page2-subTitle2.mute--text2, .conversation-content.mute--text2, .linkGrey, .thread-userOptionLink, .cept-nav-subheadline, .user:not(.thread-user), .tabbedInterface-tab, .subNavMenu, .subNavMenu-btn, .tag, .page-label, .page-subTitle, .page2-secTitle, .userProfile-title, .userProfile-title--sub, .bg--color-inverted .text--color-white, .comments-pagination--header .pagination-next, .comments-pagination--header .pagination-page, .comments-pagination--header .pagination-previous, .conversationList-msgPreview, .thread-title, .mute--text, .text--color-charcoal, .text--color-charcoalTint, .cept-tt, .cept-description-container, /*.cept-tp,*/ .thread-username, .voucher input, .hide--bigCards1, .hide--toBigCards1 {
          color: ${textColor};
        }
        .nav {
          background-color: ${lightBackgroundColor};
        }
        .redactor button,
        .redactor button.button--disabled svg,
        .redactor button.button--disabled span,
        .button--type-primary.button--mode-brand.button--disabled,
        .button--type-secondary:not(.cept-on), .button--mode-secondary {
          color: ${secondaryTextColor} !important;
        }
        .navDropDown-trigger.button--type-primary.button--mode-white,
        .speechBubble {
          background-color: ${darkBackgroundColor};
          color: ${textColor};
        }
        .thread--type-card, .thread--type-list, .conversationList-msg--read:not(.conversationList-msg--active), .card, .threadCardLayout--card article, .threadCardLayout--card article span .threadCardLayout--card article span, .cept-comments-link, .subNavMenu-btn {
          background-color: ${darkBackgroundColor} !important;
          border-color: ${darkBorderColor};
        }
        .thread--deal, .thread--discussion {
          background-color: ${darkBackgroundColor};
          border-color: ${darkBorderColor};
          border-top: none; /* there is some problem with the top border => whole article goes up */
          border-radius: 5px;
        }
        .vote-box, .input, .inputBox, .secretCode-codeBox, .toolbar, .voucher-code {
          background-color: ${darkBackgroundColor} !important;
          border-color: ${lightBorderColor} !important;
        }
        /* MC Notifications, e.g. reindeers */
        .mc-notification .text--color-white {
          color: ${textColor} !important;
        }
        .button--type-primary.button--mode-white {
          --text-default: ${textColor};
        }
        .mc-notification-inner {
          border-color: ${textColor} !important;
        }
        .mc-background--primary,
        .mc-background--shade,
        .mc-background--shadow,
        .mc-background--grey,
        .mc-background--lvl1,
        .mc-background--lvl2,
        .mc-background--lvl3 {
          background: none;
          background-color: ${veryDarkBackgroundColor} !important;
        }
        /* END: MC Notifications */
        /* Range sliders - have to be defined separately */
        .rangeSlider::-moz-range-thumb {  /* Firefox */
          background-color: ${darkBackgroundColor} !important;
        }
        .rangeSlider::-webkit-slider-thumb {  /* Chrome, Safari, Opera */
          background-color: ${darkBackgroundColor} !important;
        }
        .rangeSlider::-ms-thumb {  /* IE - not tested */
          background-color: ${darkBackgroundColor} !important;
        }
        /* END: Range sliders */
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
        .popover--layout-s > .popover-arrow::after, .inputBox::after {
          border-bottom-color: ${orangeColor};
        }
        /* END: Arrows */
        /* Faders */
        .overflow--fade-b-r--l:after, .overflow--fade-b-r--s:after, .overflow--fade-b-r:after, .overflow--fromW3-fade-b-r--l:after, .overflow--fromW3-fade-r--l:after, .thread-title--card:after, .thread-title--list--merchant:after, .thread-title--list:after {
          background: -webkit-linear-gradient(left,hsla(0,0%,100%,0),${darkBackgroundColor} 50%,${darkBackgroundColor});
          background: linear-gradient(90deg,hsla(0,0%,100%,0),${darkBackgroundColor} 50%,${darkBackgroundColor});
          /* filter: brightness(100%) !important; */
        }
        .fadeEdge--r:after, .overflow--fade:after, .subNavMenu--lFade {
          background: -webkit-linear-gradient(left,hsla(0,0%,100%,0),${darkBackgroundColor} 80%);
          background: linear-gradient(90deg,hsla(0,0%,100%,0) 0,${darkBackgroundColor} 80%);
          filter: brightness(100%) !important;
        }
        .text--overlay:before {
          background-image: -webkit-linear-gradient(left,hsla(0,0%,100%,0),${darkBackgroundColor} 90%);
          background-image: linear-gradient(90deg,hsla(0,0%,100%,0),${darkBackgroundColor} 90%);
          filter: brightness(100%) !important;
        }
        .no-touch .carousel-list--air.carousel--isPrev:before {
          background: linear-gradient(-270deg, rgba(36, 36, 36, .98) 10%, hsla(0, 0%, 100%, 0));
        }
        .no-touch .carousel-list--air.carousel--isNext:after {
          background: linear-gradient(270deg, rgba(36, 36, 36, .98) 10%, hsla(0, 0%, 100%, 0));
        }
        /* END: Faders */
        .btn--border, .bg--off, .boxSec--fromW3:not(.thread-infos), .boxSec, .voucher-codeCopyButton, .search input, .userHtml-placeholder, .userHtml img, .popover--subNavMenu .popover-content {
          border: 1px solid ${darkBorderColor} !important;  /* need full border definition for .bg--off */
        }
        .userProfile-header-inner .bg--color-greyPanel {
          border: 1px solid ${lightBorderColor} !important;
        }
        .commentList-comment--highlighted, .comments-item-inner--edit,
        .notification-item--read,
        .bg--color-white, .carousel-list--air, .tabbedInterface-tab:hover, .tabbedInterface-tab--selected, .bg--main, .tabbedInterface-tab--horizontal, .tabbedInterface-tab--selected, .comment--selected, .comments-item--in-moderation, .comments-item-inner--active, .comments-item-inner--edit, /*.thread.cept-sale-event-thread.thread--deal,*/ .vote-btn, .search input, .text--overlay, .popover--brandAccent .popover-content, .popover--brandPrimary .popover-content, .popover--default .popover-content, .popover--menu .popover-content, .popover--red .popover-content {
          background-color: ${darkBackgroundColor} !important;
        }
        .notification-item:hover, .notification-item--read:hover {
          filter: brightness(75%);
        }
        .speechBubble:before, .speechBubble:after, .text--color-white.threadTempBadge--card, .text--color-white.threadTempBadge {
          color: ${darkBackgroundColor};
        }
        .stickyBar-top,
        .notification-item:not(.notification-item--read),
        .bg--off, .js-pagi-bottom, .js-sticky-pagi--on, .bg--color-grey, #main, .subNavMenu--menu .subNavMenu-list {
          background-color: ${lightBackgroundColor} !important;
          color: ${textColor};
        }
        .tabbedInterface-tab--transparent {
          background-color: ${lightBackgroundColor};
        }
        .comment-replies,
        .userHtml blockquote,
        .userHtml hr,
        .internalLinking-tabContent, .border--color-greyBackground, .page-divider, .popover-item, .boxSec-divB, .boxSec--fromW3, .cept-comment-link, .border--color-borderGrey, .border--color-greyTint, .staticPageHtml table, .staticPageHtml td, .staticPageHtml th {
          border-color: ${lightBorderColor};
        }
        .bg--color-charcoalTint,
        .listingProfile, .tabbedInterface-tab--primary:not(.tabbedInterface-tab--selected):hover, .navMenu-trigger, .navMenu-trigger--active, .navMenu-trigger--active:focus, .navMenu-trigger--active:hover, .navDropDown-link:focus, .navDropDown-link:hover {
          background-color: ${veryDarkBackgroundColor} !important;
        }
        .softMessages-item, .popover--modal .popover-content, .bg--fromW3-color-white, .listingProfile-header, .profileHeader, .bg--em, nav.comments-pagination {
          background-color: ${veryDarkBackgroundColor};
          color: ${textColor} !important;
        }
        .bg--color-greyPanel {
          background-color: ${veryDarkBackgroundColor};
        }
        .progressBar::before,
        .bg--color-greyTint, .thread-divider, .btn--mode-filter {
          background-color: ${textColor};
        }
        img.avatar[src*="placeholder"] {
          filter: brightness(75%);
        }
        .button--type-primary.button--mode-brand,
        .btn--mode-primary, .btn--mode-highlight, .bg--color-brandPrimary {  /* Orange Buttons/Backgrounds */
          filter: brightness(90%);
        }
        
        /* Animated badge */
        .animation--colorTransfusion {
          background-color: ${orangeColor} !important;
          filter: brightness(90%);
        }
        .animation--colorTransfusion .text--color-brandPrimary {
          color: #fff !important;
          font-weight: bold !important;
        }
        /***/

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
        .nav-logo,
        img, .badge, .btn--mode-primary-inverted, .btn--mode-primary-inverted--no-state, .btn--mode-primary-inverted--no-state:active, .btn--mode-primary-inverted--no-state:focus, .btn--mode-primary-inverted--no-state:hover, .btn--mode-primary-inverted:active, .btn--mode-primary-inverted:focus, button:active .btn--mode-primary-inverted, button:active .btn--mode-primary-inverted--no-state, button:focus .btn--mode-primary-inverted, button:focus .btn--mode-primary-inverted--no-state, button:hover .btn--mode-primary-inverted--no-state {
          filter: invert(2%) brightness(90%);
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
        /* Reactions */
        .popover--reactions .popover-content {
          background-color: ${veryDarkBackgroundColor};
          border: 1px solid ${lightBorderColor};
        }
        /* END */

        /* Buttons: coupons, comments, alerts */
        .button--type-tertiary {
          background-color: ${darkBackgroundColor} !important;
        }
        .btn--mode-boxSec,
        .btn--mode-primary-inverted,
        .btn--mode-primary-inverted--no-state {
          /* color: ${secondaryTextColor}; */
          background-color: ${darkBackgroundColor} !important;
          border: 1px solid ${lightBorderColor} !important;
        }
        .button--type-tag.button--mode-dark {
          background-color: ${lightBackgroundColor} !important;
          color: ${textColor} !important;
        }
        .radio-icon {
          background-color: var(--bgNeutralPrimary);
        }
        .footerMeta-actionSlot .btn--mode-boxSec { /* comment buttons in the grid list */
          color: ${secondaryTextColor};
          padding-left: 0.57143em !important;
          padding-right: 0.57143em !important;
        }
        .popover--dropdown .popover-content,
        .redactor,
        .redactor button,
        .button--type-primary.button--mode-brand.button--disabled,
        .button--emoji,
        .button--type-secondary,
        .btn--mode-boxSec:hover,
        .btn--mode-primary-inverted:hover,
        .btn--mode-primary-inverted--no-state:hover,
        .btn--mode-boxSec:active,
        .btn--mode-primary-inverted:active,
        .btn--mode-primary-inverted--no-state:active,
        .btn--mode-boxSec:focus,
        .btn--mode-primary-inverted:focus,
        .btn--mode-primary-inverted--no-state:focus {
          background-color: ${veryDarkBackgroundColor} !important;
          border: 1px solid ${lightBorderColor} !important;
        }
        .btn--mode-white--dark,
        .btn--mode-white--dark:hover,
        .btn--mode-white--dark:active,
        .btn--mode-white--dark:focus {
          background-color: ${veryDarkBackgroundColor} !important;
        }
        .redactor button.button--mode-brand:hover,
        .btn--mode-white--dark:hover,
        .btn--mode-white--dark:active,
        .btn--mode-white--dark:focus {
          color: ${orangeColor} !important;
        }
        .button--type-tertiary.button--mode-default:hover,
        .button--type-tertiary.button--mode-default.button--selected,
        .button--type-tertiary.button--mode-default.button--selected:hover {
          background-color: ${darkBackgroundColor} !important;
          color: ${orangeColor} !important;
        }

        /* Voting buttons */
        .vote-button {
          background-color: ${darkBackgroundColor} !important;
        }
        .vote-button:not(.vote-button--mode-selected):disabled {
          background-color: ${darkBackgroundColor} !important;
          color: ${textColor};
        }
        .vote-button.vote-button--mode-selected span:after {
          color: ${darkBackgroundColor} !important;
        }

        /* Set borders of vote box & vote buttons */
        button.vote-button--primary {
          border-width: 0 !important;
        }
        .vote-box {
          border: 1px solid ${lightBorderColor};
        }
        /* END: Voting buttons */

        /* Badges */
        .textBadge:not(.thread--expired .textBadge), /* match all elements with the "textBadge" class that don't have a parent with the "thread--expired" class */
        .textBadge--greyBackground:not(.thread--expired .textBadge--greyBackground) { /* similar as above */
          background-color: ${orangeColor} !important;
          color: ${darkestBackgroundColor} !important;
          font-weight: bold !important;
        }
        .comment-newBadge--animated {
          color: ${orangeColor} !important;
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
  // const isOperaBrowser = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

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
      const appendStyle = () => {
        if (document.head !== null) {
          document.head.insertAdjacentHTML('afterend', `<style id="pepper-tweaker-style">${css}</style>`);
        } else if (document.documentElement !== null) {
          document.documentElement.insertAdjacentHTML('beforeend', `<style id="pepper-tweaker-style">${css}</style>`);
        } else {
          setTimeout(appendStyle, 10);
        }
      }
      appendStyle();
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
      const addChangeThemeButton = (searchForm) => {
        if (searchForm !== null && searchForm instanceof HTMLElement) { // sanity
          const themeButtonDiv = document.createElement('DIV');
          themeButtonDiv.classList.add('navDropDown', 'hAlign--all-l', 'vAlign--all-m', 'space--r-3', 'hide--toW2');  // space--r-3 => right space
          const themeButtonLink = document.createElement('BUTTON');
          themeButtonLink.classList.add('navDropDown-trigger', 'overflow--visible', 'button', 'button--shape-circle', 'button--type-primary', 'button--mode-white', 'button--square');
          const themeButtonImg = document.createElement('IMG');
          themeButtonImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAArlBMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADDOkjZAAAAOXRSTlMA3fOZiRSwMxFVoU/YkfKdOwP8Q0hu63cnC4Fw9vtaclSktufqy7H+9dvljTK1JhfKEsWlD3a37i9GF/eYAAAAnklEQVQY04XQ1xLCIBBA0QU0YmKiacbee++6//9jignMMj54n5gzQ1lgyNE0G0EeMVzOC0TaWqMvTfuaxhKYHIJbIY4vIe4WNhFbHn8+4Hqy8ZZUdXGoMM2y84W8wSkukuhXdG4EkasWB4oIi++O1JoBwlgdvrMxr4y4YWyFAWNTio3PRFgH8P5iIuUEx1IOKP5e1O4T4/rXOj1jQfcNdIApApX/xhoAAAAASUVORK5CYII=';
          themeButtonImg.style.filter = 'invert(60%)';
          themeButtonLink.appendChild(themeButtonImg);
          themeButtonDiv.appendChild(themeButtonLink);
          themeButtonDiv.onclick = () => setConfig({ darkThemeEnabled: !pepperTweakerConfig.darkThemeEnabled }, true);
          searchForm.parentNode.insertBefore(themeButtonDiv, searchForm);
        }
      }

      const headerPortalObserver = new MutationObserver((allMutations, observer) => {
        allMutations.every((mutation) => {
          const searchForm = mutation.target.querySelector('form.search');
          if (searchForm !== null) {
            addChangeThemeButton(searchForm);
            observer.disconnect();
            return false;
          }
        });
      });
      headerPortalObserver.observe(document.querySelector('#header-portal, #ve-header-desktop'), { childList: true, subtree: true });
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
      svgElement.classList.add('icon', 'icon--tick', 'text--color-brandPrimary', 'checkbox-tick');
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
        dividerDiv.style.width = '682px';  // TODO: set to 100% some how...
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

      const createSupportButtons = () => {
        const wrapperDiv = document.createElement('DIV');
        wrapperDiv.classList.add('space--v-2');

        const anchorElement = document.createElement('A');
        anchorElement.href = 'https://buycoffee.to/peppertweaker';
        anchorElement.target = '_blank';

        const imageElement = document.createElement('IMG');
        imageElement.src = 'https://raw.githubusercontent.com/PepperTweaker/PepperTweaker/master/images/buycoffeeto-banner.gif';
        imageElement.style.width = '200px';

        anchorElement.appendChild(imageElement);
        wrapperDiv.appendChild(anchorElement);

        return wrapperDiv;
      };

      /* Settings Page Configuration */
      settingsPageConfig = {
        support: {
          header: 'Wsparcie projektu',
          rows: {
            buttons: {
              label: 'Wesprzyj rozwój stawiając Misiowi kawkę! :D',
              entries: {
                buyCoffeeTo: {
                  create: createSupportButtons,
                },
              },
            },
          },
        },
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
                restoreOriginalEmoticons: {
                  create: createLabeledCheckbox,
                  params: {
                    label: 'Przywróć oryginalne emotikony',
                    id: 'restore-original-emoticons',
                    checked: pepperTweakerConfig.improvements.restoreOriginalEmoticons,
                    callback: event => setConfig({ improvements: { restoreOriginalEmoticons: event.target.checked } }, false),
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
                    label: 'Ukryj pasek grup z przyciskami "Kategorie", "Kupony", "Okazje" etc.',
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
      ceneo: { name: 'Ceneo', url: 'https://www.ceneo.pl/;szukaj-', icon: 'data:image/x-icon;base64,AAABAAMAMDAAAAEACACoDgAANgAAACAgAAABAAgAqAgAAN4OAAAQEAAAAQAIAGgFAACGFwAAKAAAADAAAABgAAAAAQAIAAAAAAAACQAAAAAAAAAAAAAAAQAAAAAAAGu5+gBtufoAz+j9ANDo/QDx+P8Acrz6ANTr/QDV6/0A9vv/APf7/wB5v/oAG5P3AByT9wD8/v8AHZP3AP3+/wD+/v8AfsL6AKDS/AAilvcAI5b3AKbV/ACn1fwAKJn3ACmZ9wCu2PwAUKz5AFGs+QDV6/4AVq/5ANvu/gBdsvkAXrL5AOHx/gDi8f4AZLX5AOj0/gCLyPsAjMj7AC6c+ADu9/4AL5z4AO/3/gCRy/sANJ/4ADWf+AA2n/gAmM77ALne/QA7ovgAPKL4AMDh/QBBpfgAQqX4AGS1+gDH5P0AR6j4AGq4+gDM5/0Azef9AHG7+gDS6v0A9Pr/APX6/wAakvcA+v3/ABuS9wD7/f8A/P3/AH3B+gAflfcAIJX3ACGV9wCl1PwAJ5j3AEio+QCr1/wALJv3AE6r+QBPq/kAsdr8ALLa/ADU6v4AVK75AFWu+QC43fwA2e3+ANrt/gDf8P4AhMT7AOXz/gCJx/sA7Pb+AC2b+ACPyvsAM574AJbN+wC43f0AOaH4ADqh+ABFp/gAZ7f6AMrm/QDR6f0A0un9APL5/wBzvfoA8/n/AHS9+gB1vfoA+fz/APr8/wB6wPoAHZT3AB6U9wD+//8A////AKPT/AAkl/cAJZf3AKnW/AAqmvcAS6r5AE2q+QCu2fwAr9n8ALDZ/ABSrfkAU635ALTc/AC13PwAWrD5AN3v/gBes/kA3u/+AF+z+QBgs/kAgMP7AOPy/gDk8v4Ah8b7AIjG+wDp9f4A6vX+AOv1/gDw+P4A8fj+ADKd+ACTzPsAN6D4ADig+ACZz/sAPaP4AMLi/QBEpvgAZrb6AMfl/QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnIODEJAQEBCDHFycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnIMQkcpNYAgI4WANF1GQgxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJyDA5jbBkckD9uQ28/jj1MBWNyDHJycnJycnJycnJycnJycnJycnJycnJycnJycnIMLCaEDXR0dHR0dHR0dHR0DViUYgxycnJycnJycnJycnJycnJycnJycnJycnJycgxTOxB0dHR0dHR0dHR0dHR0dHR0A0sMcnJycnJycnJycnJycnJycnJycnJycnJyDIiLdHR0dHR0dHR0dHR0dHR0dHR0dI0LcnJycnJycnJycnJycnJycnJycnJycnILTiF0dHR0dHR0dHR0dHR0dHR0dHR0JHsMcnJycnJycnJycnJycnJycnJycnJycg4nmXR0dHR0dHR0dA+Si1ppEHR0dHR0XnJycnJycnJycnJycnJycnJycnJycnJycgwRDXR0dHR0dHRzPUV6MTJPRTM+dHRnLQxycnJycnJycnJycnJycnJycnJycnJyDl9SdHR0dHR0dHSClkALDAwLQkoffQY2DHJycnJycnJycnJycnJycnJycnJycnJyQgFDdHR0dHR0dBxjC3JycnJycnELEydGcnJycnJycnJycnJycnJycnJycnJycnJySBl0dHR0dHR0D3BCcnJycnJycnJycnFycnJycnJycnJycnJycnJycnJycnJycnIMLoR0dHR0dHR0ITEMcnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJCHT90dHR0dHR0ghNycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJACnR0dHR0dHR0JQtycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnIML3R0dHR0dHQPAEBycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJGfnR0dHR0dHQIVEJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJ3M3R0dHR0dHQoOAtycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnEXOnR0dHR0dHQkmAxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnFNPXR0dHR0dHQilQxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnEnHHR0dHR0dHRYLQxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnEnB3R0dHR0dHRXkw5ycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnF5A3R0dHR0dHRXkw5ycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnFKN3R0dHR0dHSGLQ5ycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnITMHR0dHR0dHSKYgxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJySXR0dHR0dHSPNAxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnILW3R0dHR0dHRrTwtycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJAZUN0dHR0dHRDm0BycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnIMZFx0dHR0dHR0WwtycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJxeWZ0dHR0dHR0YRRycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJyDCt0dHR0dHR0JJoLcnJycnJycnJyDAxycnJycnJycnJycnJycnJycnJycnJycnJyCxuRdHR0dHR0dGBycnJycnJycnEMLS1xcnJycnJycnJycnJycnJycnJycnJycnJycXdhdHR0dHR0dChlDAxycnJxQndqVgI1DHJycnJycnJycnJycnJycnJycnJycnJycguHa3R0dHR0dHSOWZYTcXIXVFEJdHSBGA5ycnJycnJycnJycnJycnJycnJycnJycnIUFXR0dHR0dHR0DYZVdRacBHR0dHRDjHJycnJycnJycnJycnJycnJycnJycnJycnIMMmd0dHR0dHR0dHR0dHR0dHR0dHR0XB0LcnJycnJycnJycnJycnJycnJycnJycnJyDBoedHR0dHR0dHR0dHR0dHR0dHR0dIlCcnJycnJycnJycnJycnJycnJycnJycnJycgwaAnR0dHR0dHR0dHR0dHR0dHRBUC0OcnJycnJycnJycnJycnJycnJycnJycnJycnIMYhIqdHR0dHR0dHR0dHR0Q2htGAxycnJycnJycnJycnJycnJycnJycnJycnJycnJyDEh/Eh4JdHR0dHR0RCQwPJMLcXJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnILci2DEZd4fBZeOTR2Qg5ycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycg5CQAxyRnILQAxycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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' },  // ?nocatnarrow=1
      skapiec: { name: 'Skąpiec', url: 'https://www.skapiec.pl/szukaj/w_calym_serwisie/', icon: 'data:image/x-icon;base64,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////////i772/xV35f8Vd+X/FXfl/yhtvP9zSjP/c0oz/21CKv9jNRz/YzUc/2M1HP9jNRz/Ty0V/08tFf9JNy7/GYn5/xmJ+f8Vd+X/FXfl/xZ97P8XgO//F4Dv/xeA7/8XgO//F4Dv/zCN8f+Rw/f/6PL9//////////////////////96tvb/Fn3s/xV35f8Vd+X/FXfl/z5hj/9zSjP/c0oz/2g8JP9jNRz/YzUc/2M1HP9PLRX/Ty0V/0U+P/8Zifn/GYj4/xV35f8Vd+X/FXfl/xZ97P8XgO//F4Dv/xeA7/9apfT/9fr+////////////////////////////7fX9/yyL8P8XgO//Fn3s/xV35f8Vd+X/Fnjl/2BRUv9zSjP/ckgx/2Q3Hv9jNRz/YzUc/08tFf9PLRX/Rjw6/xmJ+f8Zifn/FXfl/xV35f8Vd+X/FXfl/xZ97P8XgO//JIfw//H4/v///////////////////////////9Ll+v88jen/Fnvp/xeA7/8XgO//Fn3s/xV35f8Vd+X/IHTP/3NKM/9zSjP/bUIq/2M1HP9jNRz/Ty0V/08tFf9LNCb/GYn5/xmJ+f8Veef/FXfl/xV35f8Vd+X/FXfl/xZ97P9Xo/P//////////////////f7//7HU+v9VovP/F3vo/xV35f8Vd+X/Fnvp/xeA7/8XgO//Fn3s/xV35f8XgO//S1py/3NKM/9zSjP/Zjkg/2M1HP9PLRX/Ty0V/08tFf8egeX/GYn5/xZ96/8Vd+X/FXfl/xV35f8Vd+X/FXfl/1uk8v////////////////9usPX/F4Dv/xeA7/8XgO//FXro/xV35f8Vd+X/Fnvp/xeA7/8XgO//Fnrp/xiE8/8egeX/b0s3/3NKM/9vRC3/YzUc/08tFf9PLRX/Ty0V/ytqrP8Zifn/GIPy/xV35f8Vd+X/FXfl/xV35f8Vd+X/Po/q/////////////////26w9f8XgO//GoHv/0qc8/+cyfj/qc73/xV35f8Vd+X/Fnvp/xeA7/8Veuj/GYj4/xmJ+f9YRkH/c0oz/3NKM/9nOiH/Ty0V/08tFf9PLRX/Pkte/xmJ+f8ZiPj/FXnn/xV35f8Vd+X/FXfl/xV35f8XeOX/6PL8/////////////f7//+Du/f/2+v7/////////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' },
      aliexpress: { name: 'Aliexpress', url: 'https://www.aliexpress.com/wholesale?SearchText=', icon: 'data:image/x-icon;base64,AAABAAEAICAAAAEAIACoEAAAFgAAACgAAAAgAAAAQAAAAAEAIAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQu5kAELua3BC7m8QQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELubxBC7mtwQu5kAAAAAAAAAAAAAAAAAELuZ0BC7m/QQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/QQu5nQAAAAABC7mQAQu5v0ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/QQu5kAELua3BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7mtwQu5vEELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELubxBC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BS/m/yVJ6f89Xuv/PV7r/yVJ6f8FL+b/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/MFPq/5ys9f/p7fz//v7+/////////////v7+/+nt/P+crPX/MFPq/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/DTbm/5eo9P/8/P7////////////////////////////////////////////8/P7/l6j0/w025v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/xY95//K0/n////////////6+/7/sL33/2uE8P9JaOz/SWjs/2uE8P+wvff/+vv+////////////ytP5/xY95/8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8JMub/w835////////////v8r4/yhM6f8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8oTOn/v8r4////////////w835/wky5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/4CV8v///////////6a19v8IMeb/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8IMeb/prX2////////////gJXy/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8YP+j/9PX9///////P1/r/CjPm/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8KM+b/z9f6///////09f3/GD/o/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/3SL8f///////v7+/0Ni7P8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v9DYuz//v7+//////90i/H/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/vMf4///////a4Pv/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v/a4Pv//////7zH+P8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v/p7Pz//////56u9f8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/56u9f//////6ez8/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BjDm//r7/v//////hZny/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/hZny///////6+/7/BjDm/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/qrj2/+vu/f88XOv/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v88XOv/6+/9/6m49v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/Bi/m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8GL+b/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wMv5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8DL+b/Az7p/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wM+6f8CYPH/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/AmDx/wCR/f8DOej/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wM56P8Akf3/AJn//wCF+v8DOej/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8ELub/BC7m/wQu5v8DOej/AIX6/wCZ//8Amf/xAJn//wCR/f8BYvL/A0Dq/wMy5/8DMeb/AzHm/wMx5v8DMeb/AzHm/wMx5v8DMeb/AzHm/wMx5v8DMeb/AzHm/wMx5v8DMeb/AzHm/wMx5v8DMeb/AzHm/wMx5v8DMeb/AzHm/wMy5/8DQOr/AWLy/wCR/f8Amf//AJn/8QCZ/rcAmf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf+3AJn/QACZ//0Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//QCZ/0AAAAAAAJn/dACZ//0Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//0Amf90AAAAAAAAAAAAAAAAAJn/QACZ/7cAmf7xAJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ//8Amf//AJn//wCZ/vEAmf+3AJn/QAAAAAAAAAAA4AAAB8AAAAOAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAABwAAAA+AAAAc=' },
      banggood: { name: 'Banggood', url: 'https://www.banggood.com/search/$$.html', icon: 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAASduzaEnbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8SduzaEnbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/hJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xZ47P8Xeez/F3ns/xV47P8Qdez/EXbs/xJ27P8PdOz/FHfs/xZ47P8Qdez/EXXs/xJ27P8Sduz/EXbs/xx87f+ZxPf/vNj6/7rX+v+31fn/eLH0/xt77f8Xeez/Zqfz/7LS+f+51/n/hrn1/yqE7v8Rdez/Enbs/xF17P8hfu3/0+X7/7zY+v9wrPP/m8X3/+/2/v9ipPL/aKjz/+71/v+v0fn/mcT3/+Lu/f+w0fn/HXzt/xF27P8Rdez/IX7t/9Tm/P+IuvX/Bm/r/yeC7v/d6/z/jb32/8Hb+v+v0fn/GHrt/xl67f9wrPT/7PT9/0WT8P8PdOz/EXXs/yF+7f/S5fv/yN/7/4u89v+x0vn/yeD7/1mf8v/e7Pz/drD0/xF27P+Pvvb/zuL7/+jy/f9RmvH/DnTs/xF17P8hfu3/0uX7/8jf+/+MvPb/xN36/7PT+f87ju//3uz8/3ew9P8OdOz/NIrv/0aU8P9OmfH/I4Dt/xF17P8Rdez/IX7t/9Tm/P+Ju/b/CHDr/1Wd8f/t9f7/Vp3x/7rX+f+61/n/J4Lu/xl67f94sfT/v9r6/zOJ7/8Qdez/EXXs/yF+7f/S5fv/1ef8/6XL+P/S5fv/2On8/zGI7/9TnPH/4e79/9Xm/P/K4Pv/7fX+/5XC9/8Yeu3/EXbs/xF27P8Zeu3/ca30/4y99v+Nvfb/gbb1/0CQ8P8Sduz/Enbs/z+Q8P9+tPX/hrn1/1ad8f8ae+3/EXXs/xJ27P8Sduz/Enbs/w907P8PdOz/D3Ts/w507P8Qdez/Enbs/xJ27P8Qdez/DnTs/w507P8PdOz/EXbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8SduzaEnbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8Sduz/Enbs/xJ27P8SduzaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==' },
      joybuy: { name: 'Joybuy', url: 'https://www.joybuy.com/search?keywords=', icon: 'data:image/x-icon;base64,AAABAAkAMDAQAAEABABoBgAAlgAAACAgEAABAAQA6AIAAP4GAAAQEBAAAQAEACgBAADmCQAAMDAAAAEACACoDgAADgsAACAgAAABAAgAqAgAALYZAAAQEAAAAQAIAGgFAABeIgAAMDAAAAEAIACoJQAAxicAACAgAAABACAAqBAAAG5NAAAQEAAAAQAgAGgEAAAWXgAAKAAAADAAAABgAAAAAQAEAAAAAACABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIAAAACAgACAAAAAgACAAICAAACAgIAAwMDAAAAA/wAA/wAAAP//AP8AAAD/AP8A//8AAP///wCRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGVl5WXlZeVl5WXlZeVl5WXlZeVl5WXlZkZkZl5mVmZeZlZmXmZWZl5mVmZeZlZmXmXlZeRWTlZkVk5WZFZOVmRWTlZkVk5WRmRk5kZl5k5WTmVk1mTlZNZk5WTWZOVk5UZWVlZeRlZOVlZOZeVmTmXlZk5l5WZOVmXmTmXmVmVmZeZWRmRlZWZGXlZGZl5WZORl5eXl5d5eVkZeYeYeYl3l5eXlZWRlZWXlXiIiId5eTl5eHiIiIiIiJiZeTkZeZmVl5iIiIiIl5WZeIiIiIiIiIiJeVl5kXkZeYiPj4iIiXl5iP///4//j4iImJlZWZGXl5iIiIiIiJeZePj4iIiIiIiIh3l5k1mZWXmJiI/4iIl5iPiIiYmIiIiIiHl5WZEZeZeY2IiPiI2VeP+IiXeYmIj/+IeXmXmVl5WXmYiIiIiZiPiImJl5iYiIiIiZeRmTmZeZeZiI+IiXmPiIl5WVl52I+IiJWVmVlZlZl5eIj4iZiPiI2XmXmXmIj4iJl5kZGXkXmVmIiIh5iPiJiZWZWZeYiPiHmVmXmRmZWXmIj4iVePiIl5OVl5l4eI+JeXmRl5U5GXmHiPiZiPiIeVlZOVmXePiIlZmVkZlZeZd4j4h5iPiHeXmZWZeYmPiNl5cZeVk5lZiYiPiZePiIl5l5GTl5iI+Hl5mVmTlZWTmIj4iViPiIl5WRl5WXmPiIl5GTlZWZOViYj4iXmPiIl5lZeZl5iI+JiZeVmRl5WZeIiPiViPiInZOZkVl5iI+Il5mRl5kZl5mHj4iZiPiIl5WXmXl5iI+JeVkZeVl5GXmIiPh5iPiIl5kZWRl4mPiIl5WVmRmVlZiYiP2ZiPiIl5eVk5eYiP+JWZmTlZeRk5eIj4h5ePiNeZWTlZmIiPiJl5WVk5GXmVmJ+PiZiPiImJkZWXeIiPjXmVkZWVmZWXmIj4h5iPiHeVOXmJiIiIh5eRmXmZcZeZiYj4iZePiIl5l5h4iI+IiXmXmZF5lZlZeIiPiXePiIiYmHeIiPiImJlZEVmRmXkZeYj4iZiP+IiIiIiIiIjZeVkZmZeVORl5iIiPhZiI//+PiI+PiIiXmXmXkZGZlZWZWYiIiVmPiI+Pj4+IiJiZeZWRmXlZeZOXl5jYl5iYiIiIiIjYmJeXlZOVmRk5GVmVl5eXmVmJiYl52Xl5eVlZkZWTmVlZWTlZl5eYl5l5eVeXmJeZl5l5WTmVkZeZOVk5eZeZeZeXl5l5eZeXmVmRmVlZOZlZWZWZlZl5lZlZlZeZWXmVl5F5eZOZVTkZl5lxl5WVk5WXmXlZl5lZkZmZGVlZmZWXkZGVmRmTlZOZWZmXmRk5eVNZWTk5UZeZGXmTlZeVmVlZOVGRlZWVmZmXmVlZmVkZeZWVmTkZWZOZWTlZeTmRlxWZGXmXmRl5lZGTWVlZOVlZGVmXmVl5WZl5WZGRmXmVkZeZkZk5WTkZeZeZGRmRk5WRk1l5UZWRl5lZeXlZkZWZlZGVl5WXlZGXmZWZEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAIAAAAEAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////AAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEF/w0KAgH/////CwUBAQEBAgYK/woB/woFCAz/BgEBAQEBAQsNAf8IAQECDAwBAQEBAQEI/wH/CAEBAQf/BAEBAQEBCP8B/wgBAQEF/wUBAQEBAQj/Af8IAQEBBv8FAQEBAQEI/wH/CAEBAQv/AQEBAQEBCP8B/wgBBAv/CQEBAQEBAQj/Af////8NCAEBAQEBAQEDBQEFBQUFAgEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAADAAAABgAAAAAQAgAAAAAACAJQAAAAAAAAAAAAAAAAAAAAAAACIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8mGcn/Kh7K/y4iy/86Ls7/RzzR/1NJ1P9WTNX/VUvU/1RJ1P9QRtP/S0DS/0U60P8+M87/NCjM/yseyv8kGMj/IxfI/yIVyP8mGcn/NyvN/0g90f9XTdX/V03V/1dN1f9XTdX/V03V/1dN1f9XTdX/V03V/1dN1f9XTdX/U0jU/01D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yP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP88Mc7/Z17Z/5KL5P+0sOz/zcrz/+fl+f/d2/b/mZPl/1VL1P8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IxfI/yYZyP8oHMn/RTrQ/3Bo2/+cl+b/vLju/8/N8//j4fj/2Nb1/5yX5v9gV9f/MibM/ywgyv8nGsn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP86Ls7/YFfX/4eA4f+qper/ycXx/+jm+f/h3/f/m5bm/1ZM1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yMXyP8kGMj/Oi/O/1xT1v9+d9//oJrn/8G+7//j4fj/4uD3/6ei6f9tZNr/PjPO/zQpzP8qHsr/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/MibM/0tB0v9lXNn/iYLh/7ax7f/i4fj/6ej5/7Cr6/93b93/SD7R/zswzv8tIcr/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/MCTL/0c80f9eVdf/gXrg/7Gt6//h3/f/6uj5/7Ku6/96c97/TEPS/z0yzv8vIsv/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/LiLL/0I30P9WTdX/enLe/6yo6v/f3ff/6un5/7Sw7P99dt7/UEfT/0A1z/8wJMv/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/LSDK/z4zz/9QR9P/dGzc/6ik6f/d3Pb/6+n6/7Wy7P+Aet//VEvU/0I40P8xJcv/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/LiHL/0E2z/9UStT/d3Dd/6um6v/e3ff/6+n6/7Wy7P+Aet//VEvU/0I40P8xJcv/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/LiLL/0M40P9YTtX/e3Pe/62o6v/f3ff/6+n6/7Wy7P+Aet//VEvU/0I40P8xJcv/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/LyPL/0U60P9bUtb/f3ff/6+r6//g3vf/6+n6/7Wy7P+Aet//VEvU/0I40P8xJcv/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/NSnM/1NJ1P9yadv/lY/k/7257v/l5Pj/6Of5/66p6v9za9z/RDnQ/zgtzf8sIMr/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/Oi7O/2FY1/+IgeH/q6fq/8vI8v/r6vr/5uX5/6ah6f9mXdn/NCjM/y0hy/8nGsn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/PzTP/29m2/+emef/wr7w/9nX9f/w7/v/5OP4/56Z5/9YTtX/JBfI/yMWyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/JRjI/ygcyf8sIMr/NCnM/z4zz/9IPtH/Zl3Z/4+I4/+4tO3/0M7z/9jV9f/f3ff/zMny/46I4/9QRtP/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/KBzJ/zAky/84Lc3/SkDS/19W1/91bdz/kYvj/7Kt7P/T0PT/3tz2/9TS9P/KyPL/sa3r/3113v9JPtH/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//6+v3/19T1/7Sv7P+RiuT/bWTb/0k/0v8mGcn/LCDK/zgtzf9EOtD/YFfX/4B53/+hnOf/vLnu/9XS9P/t7Pr/7Ov6/9HO8/+2su3/lZDk/2tj2v9BNs//IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//7+/7/4N73/8bC8f+rpur/kInj/3Vt3P9aUNb/X1bX/2lh2f9za9z/iYPh/6Oe6P+9ue7/zcry/9bU9f/f3ff/1NL0/7Sw7P+UjuT/dG3c/1ZN1f84Lc3/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//9/P7/7ez6/97b9v/Oy/P/vrvv/6+q6/+fmuf/op3o/6ij6f+uqer/ubXt/8bD8f/T0fT/1NH0/8zJ8v/FwfD/sKvr/4+I4/9tZdr/UkjU/0A1z/8vIsv/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP84LM3/W1HW/3933/+inOj/xcLw/+jn+f/k4vj/nZjm/1dN1f8zJ8z/enLe/8G97//+/v7/+vn9//b1/P/x8Pv/7ez6/+nn+f/l4/j/5eT4/+fm+f/p5/n/6ej5/+no+v/q6Pr/29j2/8K+8P+qpOr/jIXi/2lg2v9GO9H/LyLL/yodyv8lGMj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP80KMz/U0jU/3Fo2/+PiOP/rajq/8vI8v/HxPH/i4Ti/09E0/8xJMv/bWTa/6mk6f/d2/b/3dv2/93b9v/d2/b/3dv2/93b9v/d2/b/3dv2/93b9v/d2/b/2df1/9LQ9P/MyfL/urbu/6Gb5/+HgOH/bGPa/1BF0/8zJ8z/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8vI8v/RTrQ/1pQ1v9wZ9v/hX7h/5uV5v+YkuX/bWXa/0I30P8sIMr/V07V/4J74P+opOn/qKTp/6ik6f+opOn/qKTp/6ik6f+opOn/qKTp/6ik6f+opOn/oZzn/5iT5f+QieP/gXrf/3Bo2/9fVtf/TkTT/z0yzv8sIMr/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8qHcr/NyvN/0Q50P9RR9P/XlXX/2tj2v9pYdr/T0XT/zUpzP8oG8n/QjfQ/1xT1v9zbNz/c2zc/3Ns3P9zbNz/c2zc/3Ns3P9zbNz/c2zc/3Ns3P9zbNz/amLa/19V1/9TSdT/ST7R/0A1z/84LM3/MCTL/yseyv8lGMj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8mGcn/LiHL/zUpzP89Mc7/RDnQ/0tB0v9KQNL/OzDO/y0gyv8lGMj/NCjM/0M40P9QRtP/UEbT/1BG0/9QRtP/UEbT/1BG0/9QRtP/UEbT/1BG0/9QRtP/Rz3R/zwxzv8xJsv/Kx/K/ycbyf8jF8j/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8kGMj/KRzJ/y4hy/8yJsz/NyvN/zswzv87L87/MibM/ygcyf8kF8j/LSHK/zYrzf8+M8//PjPP/z4zz/8+M8//PjPP/z4zz/8+M8//PjPP/z4zz/8+M8//OS7N/zImzP8rH8r/JxvJ/yUYyP8jFsj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8jFsj/JBjI/yYZyf8oG8n/Kh3K/ysfyv8rH8r/KBvJ/yQXyP8iFcj/JhnJ/ykdyv8sIMr/LCDK/ywgyv8sIMr/LCDK/ywgyv8sIMr/LCDK/ywgyv8sIMr/Kx7K/ygbyf8lGcj/JBfI/yMWyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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z/8iFcj/IhXI/yIVyP8iFcj/LSHK/1FH1P9+dt//xcLw/+/u+/+ZlOX/TELS/zYrzf8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/01D0/+De+D/uLTt/+7t+v+1sOz/Sj/S/2Rb2P/QzfP/4N/3/6um6v92bd3/QDTP/yIVyP8iFcj/IhXI/yIVyP8rHsr/SD7R/3Jq3P+/vO//7+77/52Y5v9SSdT/OS7N/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/TUPT/4N74P+4tO3/7u36/7Ww7P9KP9L/ZFvY/9DN8//g3/f/q6bq/3Zt3f9ANM//IhXI/yIVyP8iFcj/IhXI/yoeyv9HPNH/cGjb/7+77//v7/v/n5rn/1VM1f86L87/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP9NQ9P/g3vg/7i07f/u7fr/tbDs/0o/0v9kW9j/0M3z/+Df9/+rpur/dm3d/0A0z/8iFcj/IhXI/yIVyP8iFcj/Kx/K/0tB0v92btz/wb7v/+/v+/+fmuf/VUzV/zovzv8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/01D0/+De+D/uLTt/+7t+v+1sOz/Sj/S/2Rb2P/QzfP/4N/3/6um6v92bd3/QDTP/yIVyP8iFcj/IhXI/yIVyP8vI8v/WlHW/4uE4v/Lx/L/7u36/5eS5f9JPtH/NCnM/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/TUPT/4N74P+4tO3/7u36/7Ww7P9KP9L/ZFvY/9DN8//g3/f/q6bq/3Zt3f9ANM//IhXI/yIVyP8iFcj/IhXI/zUpzP90bNz/rqnr/9rY9v/s6/r/iIHh/zAky/8oHMn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP9NQ9P/g3vg/7i07f/u7fr/tbDs/0o/0v9kW9j/0M3z/+Df9/+rpur/dm3d/0A0z/8jFsj/KBvJ/y4iy/86Ls7/VkzV/5eR5f/MyfL/3dv2/9jW9f93b93/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/01D0/+De+D/uLTt/+7t+v+1sOz/Sj/S/2Rb2P/QzfP/4N/3/6um6v92bd3/QDTP/ygbyf81Ksz/TELS/3Jq2/+alOb/x8Tx/+Ti+P/Ny/L/ranq/2Na2P8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/TUPT/4N74P+4tO3/7u36/7Ww7P9KP9L/ZFvY/9DN8//m5Pj/urbu/46I4/9iWdj/UUfT/2FY1/97dN7/pqHp/8nG8f/c2vb/3t33/66q6/9+d9//TULS/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP9NQ9P/g3vg/7i07f/u7fr/tbDs/0o/0v9kW9j/0M3z//X0/P/j4fj/0c7z/7+77/+4tO3/vrvu/8jE8f/V0/T/2Nb1/8TA8P+oo+n/dW3c/0c80f8zJ8z/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/0g90f94cN3/p6Lp/9fU9f+kn+j/RTrQ/11T1v+8uO7/5eT4/+Xk+P/l5Pj/5eT4/+Xk+P/l5Pj/4uD4/9nX9f/Hw/H/npjn/3Rs3P9HPNH/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/OC3N/1VK1P9waNv/jIbi/25m2/82K83/RDrQ/3x13v+Vj+T/lY/k/5WP5P+Vj+T/lY/k/5WP5P+PieP/gHnf/29n2/9aUNb/RTrQ/zElzP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8rH8r/NyvN/0M40P9ORNP/QjfQ/yoeyv8wJMv/SD3R/1JI1P9SSNT/UkjU/1JI1P9SSNT/UkjU/0tB0v86L83/LCDK/yYZyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yYZyf8rH8r/MCTL/zYqzf8wJMv/JRnJ/ygcyf8zJ8z/NyzN/zcszf83LM3/NyzN/zcszf83LM3/NCnM/ywgyv8mGsn/JBfI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAEAAAACAAAAABACAAAAAAAEAEAAAAAAAAAAAAAAAAAAAAAAAAIhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/1lQ1v//////8fD8/6yn6v8wJMv/IhXI//////////////////////+6tu7/WVDW/yIVyP8iFcj/IhXI/yIVyP8wJMv/Z17Z/6yn6v//////rKfq/yIVyP//////rKfq/1lQ1v+RiuT/4+L4//////9nXtn/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/urbu//Hw/P8iFcj//////5GK5P8iFcj/IhXI/zAky//j4vj/4+L4/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/5GK5P//////IhXI//////+RiuT/IhXI/yIVyP8iFcj/dW3d//////9LQdL/IhXI/yIVyP8iFcj/IhXI/yIVyP+RiuT//////yIVyP//////kYrk/yIVyP8iFcj/IhXI/1lQ1v//////WVDW/yIVyP8iFcj/IhXI/yIVyP8iFcj/kYrk//////8iFcj//////5GK5P8iFcj/IhXI/yIVyP9nXtn//////1lQ1v8iFcj/IhXI/yIVyP8iFcj/IhXI/5GK5P//////IhXI//////+RiuT/IhXI/yIVyP8iFcj/urbu//////8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP+RiuT//////yIVyP//////kYrk/yIVyP9LQdL/urbu//////+emef/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/kYrk//////8iFcj///////////////////////Hw/P+RiuT/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/z4yz/9ZUNb/IhXI/1lQ1v9ZUNb/WVDW/1lQ1v8wJMv/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/yIVyP8iFcj/IhXI/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' },
      amazonDe: { name: 'Amazon.de', url: 'https://www.amazon.de/s?k=', icon: 'data:image/x-icon;base64,AAABAAQAMDAAAAEAIACoJQAARgAAACAgAAABACAAqBAAAO4lAAAYGAAAAQAgAIgJAACWNgAAEBAAAAEAIABoBAAAHkAAACgAAAAwAAAAYAAAAAEAIAAAAAAAgCUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///0X///+Z////zP////P////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////w////zP///5P///8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8k////wP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////t////x4AAAAAAAAAAAAAAAAAAAAAAAAAAP///0L////z///////////////////////////////////////////////////////////////////////////X7///u+T//5DV//+R1f//csr//1C+//+Cz///kdX//5/Z///L6v//8vr//////////////////////////////////////////////////////////////////////////////////////+3///85AAAAAAAAAAAAAAAA////Lf////D///////////////////////////////////////////////////////////////+85f//csr//xOt//8AqP//AKj//wCn//8Ap///AKf+/wCn//8AqP//AKf//wCn//8Ap///AKj//z64//+Q1f//2PD////////////////////////////////////////////////////////////////////////////q////JAAAAAAAAAAA////zP/////////////////////////////////////////////////////y+v//kNX//xOs//8Ap///AKf//wCo//8Ap///AKf//wCo//8AqP//AKf//wCn/v8Ap///AKj//wCn//8AqP//AKf//wCn//8Ap///AKf//z64//+u4P//////////////////////////////////////////////////////////////////////vQAAAAD///9R////////////////////////////////////////////////8vr//5HV//8TrP//AKj//wCo//8AqP//AKj//wCo//8Ap///AKf//wCn//8AqP//AKf//wCo//8AqP//AKj//wCn//8Ap/7/AKf//wCo//8AqP//AKf//wCo//8Ap///KbL//67g////////////////////////5fT//////////////////////////////////////0L///+l//////////////////////////////////////////+75P//E63//wCn//8Ap///AKf//wCn/v8AqP//AKf//wCo//8psv//UL///4LQ//+R1f//kNX//5DV//+Q1f//kNX//5HV//9hw///UL7//wCo//8Ap/7/AKj//wCn//8Ap///AKj//wCn//9Qvv//5vX/////////////Ub///5DV/////////////////////////////////5b////q////////////////////////////////8vr//3LK//8AqP//AKf//wCn//8AqP//AKj//1C///+R1f//y+r////////////////////////////////////////////////////////////////////////Y7///rd///3LJ//8Trf//AKf+/wCn//8AqP//E63//7zl////////n9r//wCo///l9P///////////////////////////9v////////////////////////////////Y7///Prj//wCn//8Ap///AKf+/1C+//+t3///8vr/////////////////////////////////////////////////////////////////////////////////////////////////////////////vOX//3LK//8Ap///AKf//wCo//+t3///2O///wCn//9zyv////////////////////////////n//////////////////////////9jw//8Trf//AKf//wCn//9yyf//5fT////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////y+v//kNX//xOt//9hw////////xOt//8Trf//////////////////////////////////////////////////u+T//xOt//8AqP//csn//+X0/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////1G///8Ap///5vX////////////////////////////////////////Y7///AKj//1C+///l9f///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9jv//8Ap///Ub///2HD//+Q1f//csr//wCn//8Ap///y+r////////////////////////////////////////Y8P//ruD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////L6v//YsP//wCn//8Ap///AKj//wCo//8Ap///2PD///////////////////////////////////////////////////////////////////////////////////////////////////Pz8/+ioqL/VlZU/x0dG/8FBQT/BQUD/x0dHP9WVlX/hoaE/9jY2P////////////////////////////////++vr7/VlZV/6Kiov/////////////////////////////////K6f//yun//8rq///l9P//////////////////////////////////////////////////////////////////////////////////////////////////oqKi/x0dHP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/BQUE/wUFBP9WVlT/5ubm/////////////////7Cwr/8FBQT/BQUE/wUFBP92dnb///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+GhoX/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/BQUE/wQEA/8FBQT/BQUD/wUFA/8FBQT/HR0c/7Cwr///////2dnZ/wUFBP8FBQT/BQUE/wUFBP8FBQT/Z2dm//Ly8v///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////729vf8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/BQUE/wUFBP8FBQP/BQUD/wUFBP8FBQT/BQUE/wUFBP+ioqL/MjIw/wUFBP8FBQT/BQUD/wUFA/8FBQT/BQUE/0REQ//y8vL//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////zExMP8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP8dHRv/////////////////////////////////////////////////////////////////////////////////////////////////////////////////2dnZ/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8dHRz/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQP/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP8yMjD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////lJST/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/HR0c/8zMzP///////////8zMzP8xMTD/BQUE/wUFBP8FBQT/BQUD/wUFA/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP/MzMz/////////////////////////////////////////////////////////////////////////////////////////////////////////////////hoaF/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/zMzM///////////////////////y8vL/HR0c/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/BQUE/4aGhP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VlZV/wUFBP8EBAP/BQUD/wUFA/8FBQT/BQUE/wUFBP9FRUT/////////////////////////////////sLCv/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/+Xl5f//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ZmZl/wUFA/8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP9VVVT//////////////////////////////////////zExMP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VlZV////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////lJST/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP9WVlX//////////////////////////////////////3Z2dv8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VlZV////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////sbGw/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8dHRz//////////////////////////////////////5SUk/8FBQP/BQUE/wUFA/8FBQT/BQUE/wUFBP8FBQT/VlZU////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8vLy/wUFA/8FBQP/BQUD/wUFBP8FBQT/BQUE/wUFBP8FBQT/oqKi/////////////////////////////////5SUk/8FBQP/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQP/VlZV/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////3Z2dv8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/HR0c/729vf///////////////////////////83Nzf8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VlZV/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+bm5v8dHRz/BQUD/wUFA/8FBQT/BQUE/wUFBP8EBAP/BQUE/wUFBP9WVlX/vb29//Pz8////////////83Nzf8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/VlZV//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////++vr7/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VlZU/0REQ/8FBQT/BQUE/wUFBP8FBQP/BQUE/wUFBP8FBQT/VVVU////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////zMzM/x0dG/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQP/VVVU//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Ly8v92dnb/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VlZV////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////5ubm/6Kiov9VVVT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/VlZV/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9nZ2f/MzMz/lJST/5SUk/9WVlT/VlZV/zExMP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VlZV/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8zMzP8FBQP/BQUE/wUFA/8FBQT/BAQD/wUFBP8FBQT/VlZV////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8/Pz/8zMzP/MzMz/lJST/5SUk//Z2dn//////////////////////////////////////76+vv8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/VlZV/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////5WVk/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP9nZ2b//////////////////////////////////////5SUk/8FBQT/BQUE/wUFA/8FBQT/BQUE/wUFBP8FBQT/dnZ2/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////1ZWVP8FBQT/BQUE/wUFBP8FBQT/BQUD/wUFA/8dHRz/8/Pz/////////////////////////////////3Z2dv8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/lJST/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////6Ghof8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/dnZ2////////////////////////////2dnZ/x0dHP8FBQT/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/lJST/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+bm5v8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/BAQD/zExMP+xsbD/zMzM/8zMzP+UlJP/HR0c/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/zMzM//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////92dnb/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8dHRv///////////////////////////////////////////////////////////////////////////n////t///////////////////////////////////////////////////////////m5ub/Hh4c/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wQEA/8FBQP/BQUD/wUFBP+UlJP//////////////////////////////////////////////////////////////////////////97///+o////////////////////////////////////////////////////////////////2dnZ/x0dG/8FBQT/BQUE/wUFA/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQP/BQUE/0VFRP/z8/P//////////////////////////////////////////////////////////////////////////5b///9U/////////////////////////////////////////////////////////////////////9nZ2f8xMTD/BQUE/wUFBP8FBQP/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/VVVU//Ly8v///////////////////////////////////////////////////////////////////////////////0L///8D////z///////////////////////////////////////////////////////////////////////////lZWU/zExMP8FBQT/BQUD/wUFA/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/BQUD/zExMP+xsbD/////////////////////////////////////////////////////////////////////////////////////wwAAAAAAAAAA////MP////b////////////////////////////////////////////////////////////////////////////////Z2dn/lJST/1ZWVf9WVlX/BAQD/wUFBP8FBQT/RUVD/1ZWVf+UlJP/zMzM///////////////////////////////////////////////////////////////////////////////////////////w////JwAAAAAAAAAAAAAAAP///0v////z//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////D///8/AAAAAAAAAAAAAAAAAAAAAAAAAAD///8t////yf//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////w////yQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///0v///+f////z///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////zP///5n///9FAAAAAAAAAAAAAAAAAAAAAAAAAAD4AAAAAB8AAOAAAAAABwAAwAAAAAADAACAAAAAAAEAAIAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAgAAAAAABAADAAAAAAAMAAOAAAAAABwAA+AAAAAAfAAAoAAAAIAAAAEAAAAABACAAAAAAAIAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////Uf///5/////S///////////////////////////////////////////////////////////////////////////////////////////////////////////////P////nP///0gAAAAAAAAAAAAAAAAAAAAA////GP///7H//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////6X///8SAAAAAP///wb////P////////////////////////////////////////////////5fX//67g//+R1f//UL7//1C+//9Rv///YsT//5DU//+85f//8vr//////////////////////////////////////////////////////8P///8D////df//////////////////////////////////////////ruD//z24//8AqP//AKf//wCo//8Ap///AKj//wCo//8Ap/7/AKf//wCn//8AqP//csr//8vq/////////////////////////////////////////////////2b////S////////////////////////////////y+r//ymy//8Ap///AKj//wCo//8Ap///AKf//wCn//8Ap///AKj//wCn//8Ap///AKj//wCo//8AqP//AKj//1C////Y8P///////8rq///Y7///////////////////////w/////z/////////////////////8vr//3LJ//8AqP//AKf//wCn/v9ixP//kNT//8vq///y+v////////////////////////L6///L6v//n9r//2LE//8Trf//AKf//wCo//+u4P//vOX//z65///////////////////////w//////////////////////L6//8+uP//AKf//1C+//+t3///8/r///////////////////////////////////////////////////////////////////////+85f//UL7//wCo///Y7///AKf//8rp///////////////////////////////////Y7///E63//1C+///L6v////////////////////////////////////////////////////////////////////////////////////////P7///L6v//5fT///L6//8ps///kNT//////////////////////////////////5DU//+t3///////////////////////////////////////////////////////////////////////////////////////////////////5fX//1C+//8AqP//AKf//wCn//+Q1f//////////////////////////////////////////////////////////////////8vLy/5SUk/9FRUT/BQUE/wQEA/8yMjD/Z2dm/8zMzP////////////////+GhoX/Z2dm//Lz8////////////+X0///L6v//yun///L6//////////////////////////////////////////////////////////////Ly8v9FRUT/BQUE/wUFBP8FBQT/BQUE/wQEA/8FBQT/BQUD/3Z2dv/z8/P/dnZ2/wUFBP8FBQP/MTEw/9nZ2f//////////////////////////////////////////////////////////////////////////////////////VlZV/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/zIyMP8FBQT/BQUE/wUFBP8FBQT/HR0c/9nZ2f///////////////////////////////////////////////////////////////////////////+bm5v8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8xMTD/HR0c/wUFA/8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFA/8FBQT/lJST////////////////////////////////////////////////////////////////////////////vb29/wUFBP8EBAP/BQUE/wUFBP8FBQT/dnZ2////////////oqKi/wUFBP8EBAP/BQUE/wUFBP8FBQP/BQUE/zIyMf/y8vL///////////////////////////////////////////////////////////////////////////+UlJP/BQUE/wUFBP8FBQT/BQUE/wUFBP/y8vL/////////////////Z2dm/wUFBP8FBQT/BQUE/wUFBP8FBQT/sbGw/////////////////////////////////////////////////////////////////////////////////7GxsP8FBQT/BQUD/wUFBP8FBQT/BQUD//////////////////////+9vb3/BQUE/wUFBP8FBQT/BQUE/wUFBP/m5ub/////////////////////////////////////////////////////////////////////////////////2dnZ/wUFBP8FBQT/BQUE/wUFBP8FBQT/zMzM/////////////////+bm5v8FBQT/BQUE/wUFA/8FBQT/BQUD////////////////////////////////////////////////////////////////////////////////////////////MTEw/wUFBP8FBQT/BQUE/wUFBP9FRUT/5eXl/////////////////wUFBP8FBQT/BQUE/wUFBP8FBQT////////////////////////////////////////////////////////////////////////////////////////////MzMz/BQUE/wUFA/8FBQT/BQUD/wUFBP8FBQT/dnZ2/5SUk/+9vb3/BQUE/wUFBP8FBQT/BQUE/wUFA/////////////////////////////////////////////////////////////////////////////////////////////////+wsK//HR0c/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE///////////////////////////////////////////////////////////////////////////////////////////////////////m5ub/hoaF/zIyMP8FBQT/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/BQUE/wUFBP8FBQP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+bm5v/MzMz/lJST/5SUk/9WVlX/BQUE/wQEA/8FBQT/BQUE/wUFA//////////////////////////////////////////////////////////////////////////////////////////////////y8vL/zMzM/8zMzP/Nzc3///////////////////////////8FBQT/BQUE/wUFBP8FBQT/BQUD////////////////////////////////////////////////////////////////////////////////////////////Z2dm/wUFBP8FBQT/BQUE/wUFBP/y8vL/////////////////2dnZ/wUFA/8FBQP/BQUD/wUFBP8FBQT///////////////////////////////////////////////////////////////////////////////////////////9mZmX/BQUE/wUFBP8FBQT/BQUE/3Z2dv////////////////92dnb/BQUE/wUFBP8FBQT/BQUE/wUFBP///////////////////////////////////////////////////////////////////////////////////////////7CwsP8FBQT/BQUE/wUFBP8FBQT/BQUE/zIyMP9WVlX/RUVE/wUFBP8FBQT/BQUE/wUFBP8FBQT/RUVD/////////////////////////////////////////////////////////////////////////////////////////////////1ZWVf8FBQT/BQUE/wUFBP8EBAP/BQUD/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP+wsK/////////////////////////////////////////////////2////2///////////////////////////////////////////8vLy/0VFRP8FBQP/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/dnZ2/////////////////////////////////////////////////////8z///9+/////////////////////////////////////////////////////7Cwr/9FRUT/BQUE/wUFBP8FBQT/BQUD/wUFBP8FBQT/RUVE/7Cwr///////////////////////////////////////////////////////////b////wz////b///////////////////////////////////////////////////////////y8vL/zMzM/8zMzP/MzMz/zc3N/+bm5v///////////////////////////////////////////////////////////////9L///8GAAAAAP///yf////b///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////S////HgAAAAAAAAAAAAAAAP///wz///94////2P/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////S////cv///wkAAAAAAAAAAOAAAAeAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAHAAAADKAAAABgAAAAwAAAAAQAgAAAAAABgCQAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8G////hP///9v/////////////////////////////////////////////////////////////////////////////////////////2////4T///8GAAAAAP///wz////P///////////////////////////y+v//vOX//5DV//+C0P//YsT//5DU//+u4P//5fT////////////////////////////////////////////G////Cf///4T/////////////////////8vr//3LK//8Trf//AKj//wCn//8Ap///AKf+/wCo//8AqP//AKf//1C+///K6v//////////////////////////////////////e////9v///////////////+u4P//E6z//wCn//8AqP//AKf//wCo//8Ap///AKf//wCo//8AqP//AKf//wCo//8Ap///kNX/////////////kdX//9jw////////////z/////D//////////4LP//8Ap///AKf//wCo//8qs///csr//5DV///K6f//y+r//8rq///L6v//n9n//3LK//8TrP//AKf//5/a////////kNX//1C+////////////7f////D/////kdX//wCo//8AqP//csn//9jw///////////////////////////////////////////////////y+v//n9r//4LQ////////yun//wCn///l9P//////8P////DK6v//AKf//1C+///l9P//////////////////////////////////////////////////////////////////////////////////yun//wCn//+85f//////8P////Aps///kNX///////////////////////////////////////////////////////////////////////+g2v//KrP//2LE//+Q1P//csr//wCn//+R1f//////8P////C75P////////////////////////////+xsbD/VlZV/1VVVP9WVlX/oaGh//Ly8v/y8vL/dnZ2/7Cwr///////vOT//2HD//8Ap///AKj//wCn/v+85f//////8P////D//////////////////////////4aGhf8EBAP/BQUD/wUFBP8EBAP/BQUD/0VFRP9nZ2b/BQUE/wUFBP92dnb/////////////////2O///+b1////////////8P////D/////////////////////8vLy/wUFBP8FBQT/BQUE/wUFA/9EREP/HR0b/wUFBP8FBQT/BQUD/wUFBP8FBQT/////////////////////////////////////8P////D/////////////////////zMzM/wUFBP8FBQT/BQUE/3Z2dv//////8vLy/x0dHP8FBQT/BQUE/wUFBP+UlJP/////////////////////////////////////8P////D/////////////////////zc3N/wUFBP8FBQT/BQUE/5SUk////////////4aGhf8FBQT/BQUE/wUFBP/MzMz/////////////////////////////////////8P////D//////////////////////////x0dG/8FBQT/BQUE/0VFQ//z8/P//////76+vv8FBQT/BQUE/wUFBP/Nzc3/////////////////////////////////////8P////D//////////////////////////7CwsP8FBQP/BQUE/wUFBP8dHRv/dnZ2/3Z2dv8FBQP/BQUE/wUFBP/MzMz/////////////////////////////////////8P////D///////////////////////////////++vr7/MTEw/wUFBP8FBQP/BQUD/wUFBP8FBQT/BQUE/wUFBP/MzMz/////////////////////////////////////8P////D//////////////////////////////////////////+Xl5f/MzMz/lJST/3Z2dv8FBQT/BQUE/wUFBP/MzMz/////////////////////////////////////8P////D//////////////////////////4aGhf9WVlX/HR0b/729vf///////////7Cwr/8FBQP/BQUE/wUFBP/MzMz/////////////////////////////////////8P////D//////////////////////////2ZmZf8FBQT/BQUE/x0dHP++vr7/zMzM/0VFRP8FBQT/BQUE/wUFBP/y8vL/////////////////////////////////////8P////D//////////////////////////8zMzP8FBQT/BQUE/wUFBP8FBQT/BQUE/wUFBP8FBQT/BQUD/1ZWVP/29vb/////////////////////////////////////7f///9X///////////////////////////////+wsK//HR0c/wUFBP8FBQT/BQUE/wUFBP8FBQT/MTEw/9vb2//6+vr/////////////////////////////////////z////3v/////////////////////////////////////8vLy/76+vv+UlJP/lJST/5SUk/++vr7/////////////////////////////////////////////////////df///wn////D//////////////////////////////////////////////////////////////////////////////////////////////////////////////+9////BgAAAAD///8D////df///9L/////////////////////////////////////////////////////////////////////////////////////////z////3X///8DAAAAAIAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAABACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAAAAAAAAAAAAAAAAAAAAAAAD///8G////lv////b/////////////////////////////////////////////////////////9v///5b///8G////iv/////////////////////Y7///n9r//5DV//+Q1P//vOT/////////////////////////////////iv///+f//////////8vq//9Qvv//AKj//wCn//8Ap///AKf+/wCn//8ps///u+T////////y+v//8vr//////+f////w/////67g//8AqP//AKj//z24//+C0P//kNX//5DU//+R1f//UL7//wCn//+u4P//vOX//4LQ///////w////8Lzl//8AqP//csn//+bz///////////////////////////////////l9P//rd///9jv//8Trf//////8P////Aqs///2O//////////////////////////////////////////////Ur7//3LK//+C0P//AKf///////D////w5vX/////////////zMzM/x0dG/8FBQT/HR0b/5SUk/9WVlT/RUVD/+fu8/+i2P7/csr//3LK///////w////8P///////////////zExMP8FBQT/BQUE/0VFRP8FBQP/BQUE/wUFBP+UlJP/////////////////////8P////D///////////////8FBQT/BQUE/4aGhP//////ZmZl/wUFBP8FBQT/8vLy//////////////////////D////w////////////////VlZV/wUFBP8yMjD/5ubm/5SUk/8FBQT/BQUE///////////////////////////w////8P///////////////9nZ2f8yMjD/BQUE/wUFBP8FBQT/BQUE/wUFBP//////////////////////////8P////D////////////////m5ub/zMzM/729vf+wsK//VlZV/wUFBP8FBQT///////////////////////////D////w////////////////Z2dm/wUFBP9FRUT/2NjY/2dnZv8FBQT/HR0c///////////////////////////w////5////////////////8zMzP8FBQP/BQUE/wUFBP8FBQT/BQUE/3Z2dv//////////////////////////5////4f/////////////////////2dnZ/3Z2dv9VVVT/VlZV/6Kiov///////////////////////////////4r///8G////jf///+T/////////////////////////////////////////////////////////5P///43///8GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==' },
      ebay: { name: 'eBay', url: 'https://www.ebay.com/sch/i.html?_nkw=', icon: 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP84MuX/ODLl/zgy5f84MuX/0mQA/9JkAP/SZAD/0mQA/wKv9f8Cr/X/Aq/1/wKv9f8XuIb/F7iG/xe4hv8XuIb/ODLl/zgy5f84MuX/ODLl/9JkAP/SZAD/0mQA/9JkAP8Cr/X/Aq/1/wKv9f8Cr/X/F7iG/xe4hv8XuIb/F7iG/zgy5f84MuX/ODLl/zgy5f/SZAD/0mQA/9JkAP/SZAD/Aq/1/wKv9f8Cr/X/Aq/1/xe4hv8XuIb/F7iG/xe4hv84MuX/ODLl/zgy5f84MuX/0mQA/9JkAP/SZAD/0mQA/wKv9f8Cr/X/Aq/1/wKv9f8XuIb/F7iG/xe4hv8XuIb/ODLl/zgy5f84MuX/ODLl/9JkAP/SZAD/0mQA/9JkAP8Cr/X/Aq/1/wKv9f8Cr/X/F7iG/xe4hv8XuIb/F7iG/zgy5f84MuX/ODLl/zgy5f/SZAD/0mQA/9JkAP/SZAD/Aq/1/wKv9f8Cr/X/Aq/1/xe4hv8XuIb/F7iG/xe4hv84MuX/ODLl/zgy5f84MuX/0mQA/9JkAP/SZAD/0mQA/wKv9f8Cr/X/Aq/1/wKv9f8XuIb/F7iG/xe4hv8XuIb/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAAAAAAAAAAAAAAAAAAAAAAA8wAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAPMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAK4AAABsAAAAAAAAAAAAAAAAAAAAAAAAAG8AAACuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkAAAA6gAAAGkAAAAMAAAADAAAAGkAAADqAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcAAAC3AAAA8wAAAPMAAAC3AAAAJwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAFAAAAAAAAD4QQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA888AUPPPAFDwD///+B8AAA==' },
      allegro: { name: 'Allegro', url: 'https://allegro.pl/listing?string=', icon: 'data:image/x-icon;base64,AAABAAEAMDAAAAEAIACoJQAAFgAAACgAAAAwAAAAYAAAAAEAIAAAAAAAACQAABMLAAATCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWP8aAFv/cABb/6YAWv/ZAFr/7gBa//AAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//kAWv9jAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFv/NQBa/7UAWv/8AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABd/wsAWv+cAFr//QBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFX/BgBa/7YAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFr/pwBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWf9CAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWv/LAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr/2wBa/40AWv9pAFr/ZgBa/2YAWv9mAFr/ZgBa/2YAWv9mAFr/ZgBa/2YAWv9mAFn/ZwBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABY/yAAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//UAWv9jAID/AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABZ/2oAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//QBa/0EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABZ/4YAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr/qgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABb/5UAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFv/awAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABa/5cAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFv/aAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABa/4UAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr/ngAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABb/18AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr/9QBY/xoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABX/yMAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa/8MAYv8NAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWv/GAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv/VAFr/SgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/AgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW/9MAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa/+MAWv+hAFv/gQBa/24AWv9mAFr/ZgBa/2YAWv9mAFr/ZgBa/2YAWv9mAFn/ZwBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFr/pwBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF3/CwBa/8YAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABd/wsAW/+pAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFv/VwBa/94AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABV/wMAXP9OAFv/tABa//sAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABV/wwAW/9GAFr/gABb/6YAWv/GAFr/2gBa/90AWv/dAFr/3QBa/90AWv/dAFr/3QBa/90AWv/dAFr/3QBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAED/BABa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AW/+BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFz/GQBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv9xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFz/TgBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWP9LAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFr/XgBa/6cAXf8sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8BAFr/uwBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AXf8WAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFv/yABa//8AWv/8AFr/ngBd/ywAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWf91AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa/94AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFr/1wBa//8AWv//AFr//wBa//8AWf/CAFr/bgBX/yMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFr/HwBa/5sAWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa/4UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFv/5wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv/rAFr/uwBZ/6AAWv+NAFr/lABa/6QAWf/QAFr//QBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//ABe/x4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFr/9wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFn/oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYP8IAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv/jAFX/FQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZv8FAFr/2QBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa/+kAWv8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGb/BQBa/2MAWv/dAFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr/wABd/yEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZv8FAFr/UgBa/6gAWv/0AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//wBa//8AWv//AFr//QBa/7sAW/9MAAD/AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZv8KAFr/RwBa/3oAWv+sAFn/0wBa/+IAWv/yAFr/+wBa/+kAWv/XAFr/wQBZ/4wAW/9RAFn/FwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////8AAP///////wAA////////AAD///////8AAP///////wAA////////AAD//gAAAP8AAP/4AAAA/wAA/+AAAAD/AAD/wAAAAP8AAP/AAAAA/wAA/4AAAAD/AAD/gAAAAP8AAP8AD/4A/wAA/wA//gD/AAD/AH/+AP8AAP8Af/4A/wAA/wB//gD/AAD/AH/+AP8AAP8AP/4A/wAA/wAf/gD/AAD/gA/+AP8AAP+AAAAA/wAA/8AAAAD/AAD/wAAAAP8AAP/gAAAA/wAA//gAAAD/AAD//AAAAP8AAP//gAAA/wAA/////gD/AAD////+AP8AAP////4A/wAA//j//AD/AAD/+D/8Af8AAP/4B/AB/wAA//gAAAH/AAD/+AAAA/8AAP/wAAAD/wAA//AAAAf/AAD/+AAAD/8AAP/+AAAf/wAA///AAP//AAD///////8AAP///////wAA////////AAD///////8AAP///////wAA////////AAA=' },
      olx: { name: 'OLX', url: 'https://www.olx.pl/oferty/q-', icon: 'data:image/x-icon;base64,AAABAAIAEBAAAAEAIABoBAAAJgAAACAgAAABACAAqBAAAI4EAAAoAAAAEAAAACAAAAABACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////AP///wD///8A////AP///zD///+W////1v////L////y////1v///5r///8y////AP///wD///8A////AP///wD///8A////CP///5T//////////////////////////////////////////////5j///8K////AP///wD///8A////Bv///8D/////////////////////////////////////////////////////////yP///wj///8A////AP///5T///////////////////////////////////////////////////////////////////+c////AP///yz///////////Xt8f////////////////////////////X4/v/x9v7//////+vx/f+uyfr/6/L9/////zT///+U8+ru/5dDaP+OL1r/lkFn//Lo7f////////////////92pPb/WZL0//////9imPX/EWLv/52/+P////+c////1KZbff+pYoL//////6tmhf+kWHr/5/bz/8Tp4P/F6eH/fq/s/xdn8f+ZvPj/JG/x/06L9P//////////3Pz6+/KGIU//2LjH///////au8n/lSRV/23LtP8lr47/IK2M/4zXu/96pfj/JXDx/ytz8f/i7P3///////////T9/PzyhyRR/9Wywv//////17bF/5YnWP930Lr/U8Cm//T7+f/7/f3/0uH8/x5r8P9Uj/T////////////////0////1LR1kv+aSGz/8ebr/5xLb/+7dpX/e9TC/1XBp////////////1aQ9P9WkPT/Pn3y/6TD+f//////////3P///5T79/n/sHKM/4wtWf+vcIr/+vb4/2/JtP9Sv6b//////+fv/f8lbPD/4uz9/+Tt/f8tbfD/7PP9/////5z///8q//////////////////////////+j3c//itPB////////////////////////////9vn+//39//////8y////AP///5L///////////////////////////////////////////////////////////////////+a////AP///wD///8E////vv/////////////////////////////////////////////////////////E////CP///wD///8A////AP///wb///+S//////////////////////////////////////////////+W////CP///wD///8A////AP///wD///8A////AP///y7///+U////1P////L////0////1v///5j///8w////AP///wD///8A////APgfAADgBwAAwAMAAIABAACAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAEAAIABAADAAwAA4AcAAPgfAAAoAAAAIAAAAEAAAAABACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///xD///9Y////lP///8L////c////6v///+r////c////xP///5j///9c////Fv///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///yb///+W////8P/////////////////////////////////////////////////////////0////nP///yz///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///+E/////////////////////////////////////////////////////////////////////////////////////////4z///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8a////yP///////////////////////////////////////////////////////////////////////////////////////////////////9L///8i////AP///wD///8A////AP///wD///8A////AP///wD///8A////JP///+r///////////////////////////////////////////////////////////////////////////////////////////////////////////////T///8w////AP///wD///8A////AP///wD///8A////AP///xL////u//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////j///8e////AP///wD///8A////AP///wD///8A////0P///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////97///8A////AP///wD///8A////AP///37//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////5D///8A////AP///wD///8W/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////yL///8A////AP///5b/////////////////////7N3k/+zc4////////////////////////////////////////////////////////////9nm/P/I2/z//////////////////////6/K+v9AgfP/eqf3/7fQ+v/5+///////qP///wD///8I////9v//////////27zK/5xKb/98D0H/fA5A/5tIbv/YuMf////////////////////////////////////////////7/P//OX3y/wZb7//w9f7////////////u9P7/G2rw/wZc7/8AVe7/DF/w/+jw/f//////////Ev///1D//////////9Grvf94Bzv/cAAv/59QdP+hUnb/cQAx/3cFOf/Oprj//////////////////////////////////////6LB+f8CWe//C1/v/2OZ9f///////////3yp9/8GXO//OX3y/wZb7/+Er/f//v////////////9g////kv/////t3uX/ghlJ/3UBNv+ua4n///////////+xcI3/dQI2/4AWRv/m197/////////////////////////////////y9P//wVZ8v8pdPD/Blzv/8rc+//7/P//GGfw/y528v8TZPD/QoPz/////////////////////6L////A/////7Z4lf9zADT/jCxX//jz9f////////////v4+f+OMFv/cgAz/7p2lP/+////o97Q/4TSwP+P1sX/kNbF/4bTwf+06sz/dqjz/w5e9f8ibvH/RoXz/1uT9f8fbPH/LHXy/xBi8P/W5P3/////////////////////zv///97+/v7/m0Zt/3UCN/+rZYX//////////////////////69ti/91ATb/uU56/8nq4/8NsIn/EqiF/xWphv8MpoL/AqJ8/xCte//y/+j/hKX//wpe7/8ncfH/HWvx/zp+8v8EWu//jrX4///////////////////////////k////7Pbv8/+SN2H/dwU5/7p/mv//////////////////////vISe/3gHOv+vPGz/s8/K/yzDnf86t5n/NbWX/z64nP81tZf/NrSZ//r/8f//////XJT1/x9s8f8yePL/HWrx/1KN9P////////////////////////////////D////s+fT2/5M6Y/92BDj/tnqV//////////////////////+6gJv/dwU5/7A/bv+61dD/L8Kd/xqrif+B0b7/6/j1/+n39P/z+vn//f7////////X5fz/EWPw/y118v8MX/D/zd78////////////////////////////////8P///97/////oVN2/3QANf+hU3f//////////////////////6Zbff90ADT/v1uF/8v06v8otpT/EKiE/6Pdz////////////////////////////3Oj9v8XZ/D/I27x/w9i8P9qnfb////////////////////////////////k////wP/////JnLD/dAA1/4IZSf/iy9X////////////m0dv/gxtL/3MANP/oo77/2f///yOtjv8UqYb/l9nJ///////////////////////X5Pz/GGfw/x5r8f8/gfP/NHny/wBQ7v+hwvn//////////////////////////87///+Q//////z5+v+YQWn/bgAs/5Y/Z//jzNf/5M7Y/5lDav9uACz/lTxl///8///N9+7/I62O/xSphv+X2cn//////////////////////2md9f8BWO//GGfw/+bv/f/H2vv/AFLu/xBh7//i7P3/////////////////////oP///1D//////////+/i6P+VPGX/bQAq/3UCN/92Azj/bAAp/5M5Yv/t3uX//////8Hn3f8jro7/FKmG/5XYyP/////////////////J3Pv/AFbu/wBN7f+NtPj///////////+TuPj/AEDs/zt/8v/x9v7///////////////9g////CP////b///////////z6+//Ekqn/pFh7/6RXev/CkKf/+/f5////////////vebd/x6si/8SqIX/j9bF/////////////////9Xk/P8wd/L/ZJn1//////////////////////95p/b/AFDu/8TY+////////////////xD///8A////lP/////////////////////////////////////////////////////K6+P/DKaC/wCcdP+V2Mj////////////////////////////////////////////////////////////e6f3/9/r///////////+m////AP///wD///8U//////////////////////////////////////////////////////3+/v+65tv/p9/S/+759v///////////////////////////////////////////////////////////////////////////////yD///8A////AP///wD///98//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+O////AP///wD///8A////AP///wD////O////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////2v///wD///8A////AP///wD///8A////AP///xD////s//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////T///8a////AP///wD///8A////AP///wD///8A////AP///yD////o///////////////////////////////////////////////////////////////////////////////////////////////////////////////y////LP///wD///8A////AP///wD///8A////AP///wD///8A////AP///xb////E////////////////////////////////////////////////////////////////////////////////////////////////////zv///yD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///+A/////P///////////////////////////////////////////////////////////////////////////////////4j///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8i////kv///+z/////////////////////////////////////////////////////////8P///5j///8o////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////Dv///1T///+Q////wP///97////u////7v///+D////C////lP///1r///8S////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP/wD///gAH//gAAf/wAAD/4AAAf8AAAD+AAAAfgAAADwAAAA4AAAAGAAAABgAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAYAAAAGAAAABwAAAA+AAAAPgAAAH8AAAD/gAAB/8AAA//gAAf/+AAf//8A//' },
      ggdeals: { name: 'GG.deals', url: 'https://gg.deals/games/?title=', icon: 'data:image/png;base64,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' },
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
        searchLink.style.borderRadius = '5px';
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
        const searchButton = createSearchButton(searchEngine.google, searchQuery, { label: 'Szukaj przez Google' });
        searchButton.querySelector('a')?.classList.add('button--type-secondary');
        searchButton.style.cssFloat = 'right';
        searchButton.classList.remove(...searchButton.classList); // remove all classes from wrapper, because they messing up the alignment
        searchSubheadline.parentNode.insertBefore(searchButton, searchSubheadline);
      }
    }
    /*** END: Search Page ***/

    const DEFAULT_NOTIFICATION_SOUND = new Audio('data:audio/mp3;base64,//uQxAAD1OIO7gMZGcKPwZ+AYZpA7RBmA5O47GEEOYg3iMP3D0HtjILAa0zAAETfggm0OeDhZNMwhHfTMswgQIQ/yE+ensIOxOocBhd/tBBC9wxD3viM8XzwGFshzwAq9MBAjOen3u7YgFpth4DC6hntkCaZ5OPe9iGbaZigcLTaLPJk0+eTt7iSaexHc9MmTJ0QTaIcncIXsSLnwlJTuQKGJuWL3WQZTu7u91wKGIKGFjzI/IFA4AUDwgwtZO2Iq6yf1nhE4Dyjypco/Ch6zuRUkYBRIkf02S25hAEcoqTSBGj5POh9U501UYCYdjnHAhchkjG7EINUF2s2U0zm9lM2ET1pF82ZgxrsNuCIjwxIETSs+ZTJH8/pGqKmp8rs7CyrZI2dSKrjMgx4IdEzm5RjdkTyja4MgveQDGGHIa1y5K15Socc75cStd0snVw2EyiB+nbuJyicfpkdJ0rEpEScNJy0lzxp2kKAxk2xTpYwZZPPpGTyeokzuiUXWoEyiTMStqSZ3Hkz7NTiqE2Xt8klRoHjSc8XjOkE0RiTuk1T//uSxCCD1fIK/AMk3wrAwF+ChpABa6UX8szDpsMlJpQXkvDo3DdUlGTaFe10JY9JWMyGadtpLG96Po3sbizXqaOUV2JyZT8aIBSwaTQlThOu0uhSf3ZozGUrRwuGoGiG0cE5ImmwBES4SJkbw28tYElSNsbb2aO6M7lwxIFfTcvSibIxZgzJRIKwSMGQUBConfZar0zk86eZmTeZkuzU+6WS2C6jGsyItSio2hilITySqbMSiqxIiQJRVRbOKa7oPRR12k0kOymcb6CCDcbknU2CbJwqLTCPdRaOrvs8ZjqsSZqCzUnKtciZRIjkkM9QNzfBC9J+bs4MtnpQVg+k0kZalCzTB400ebd7vaVp0Ve03CtxI0+bSs+clKDLBam4JMDNLztFPC7SW4n4qugdVYbWIKUAgAAAC/UvxQAOo4IO53ecMHQ2eZXLMnsSaXg5bGiithlyaNwgwT6ePS6ZrT4sGdqIodjR08gqRSETYkYcwSY7XKveTlNMS+xDs+/EfydeAMdS+KTfbVJbqz8+zR+KGvEIAywlsxKZ25YoatJdp//7ksQ3ACLWLv65zIADPKgmtzmAAJTnSu3Fm3b+zQUdmhuXLE7eyy7Xuc+UzrtyXk5P2KSIYV49jDN2pNXcabtmepYtSWrV6tnGYxLqtNVgO3zUP26lepDU1VytfP2LFBNU1rKajtPSxq1Le0tJK5TSahD+0b8RDN5Kefv53r8Yuz2GVFh9SliFNduTVycvzcS//////oZXP2LOscK03M6jG6fmpqj//////kNSvMQ/fpp+DZdTSyhilLa+3NEAAJBgQAAMmgYCt/aQAQeGRhMDhkFlkYEF5kUGGMA8YzAZwIIgIOHqAom2YkFRdUwUCSYKhAifECND5itkAw6tLk5KQOGWqheCWPXBkNpXgbDyYEJQU11IfJBk1YjLVB4XLJRSzVPfh16JVfpn5dll7K3HvvpFWLT1LampTW/D91mvzcP1nmUwbTG8stZncam/JQrh/9YROH+fnK3/n6Wluf+WVPv/3llr/vXrt/u/p5p+I9FbWFNZq4War/dy3v//O58M2cbYsYJlEVi97akAABRpIcwHAJzAZBYMBMBUEA3GCqH/+5LECoMVFTMifeoAAxWmow3t0ThYboARBiDBVmCsBiAgZgSBgSAPAYEUwMQAi5QFAFWKhxASFCgQKAh+EfitRpIitiCkFHaTQuY3KYN6gYLqB3AoDREaKIxw7i8o2UmzqpJpHTVTol0MSlcybS0ku1l0uYkBDkQERxR0SZLyS+rui/W/V3nEUc4RMtM70fMkEkWRWpaLrW943C841e6FCmpz14UTci5YhACaLRTAaAcMGsBAwMgOjB9BVMU58A9WB+TD6AoEYMZgcgGgAeMhZh5aHgZkZgAk77FQdBAkETigZXDvwl4YF3Ka2OpT7piKVDVhIVfigKlbclaGCSlRkYGLVsaG6S3NUgBgw7lKspM5M0Dt5vdFNeWh6AzBUFN42CfM1Eqj6CkjXSUkk9OtkajB1JoF0TylOoorYzL7rMmZ1LWiZqux1FiseQCDRQHQQBAug9NTwjQp4sYFibxaFBRabWHWacKmakGtruhAEE4qCUYGoCpgGAnGBeH2Yj3Ch0DFtmDUFgayYmKmJkwwaOxGikKeE8YcJ04gGgQKVJfI//uSxBoDV+UzFC9uh9tbu+HB/Y453up34v393Kaan+0sACs2DzEQmDLI/HBSAwCoSJgWjQ8WnWcW5vY3JsDCAxtsio3W5qxKlQpn2MKJ1bGSzAoiMgFtQCmIgtTmM5staD6t3UpSValHKC8oJLo7aC1Xsggtq0WUzl1b6/vD9bDKNfmwJXn6v+y7/hdb/soE5NV9tLa2MYceSIJUvCOkTZgCwBaMgGgBAVQYBQGACAlIAWSDFJRMswD0D+MARARTALwAcHARI0CTiwJO3aFGAjgACwwNACDAcAAlW2JRNujkV71DcpqWbl0crvoFrMzIleJoMugyal/MNYUz77w1WpJZe7hUoDBySBvm687yn5urM3O497nW3a7e1H2kGIwwOAIfjGHbHfoPwRHMlcx2FMRGjxnHYzQCKFwXw11MrYSa4qyIMP7EDrSkWN0WSxBBvkgsmc022aE5tTW23UsPtGIwg7qYc5rSLUnzLSMF7sw7iiU+63yaIAUTAAAHBoERgCAVmCCDAYJwXZkD82H7GZeYdISBlAiYGAGWEZqcuAtYvv/7ksQVgBg9dRJPbmfLGSLkMe5oyDNg44iKS4CK3nxhENPVjKeW7ssj1zvcAswgabAUEOSThEBYh3GR9JAzIkX6Jg5TXZGAsc0QSdNBakTrKnaj55aSzqCRVAaEFcEuYGC1HEkWoUnMlLd6LqdJZ52U5srIbZzKivdC1Toqo119lJUqkWZqTodTpudmDTOpl2Mw9n/0gOqP1kYIUXvx/jffFuT8ci/XNZDGsRoAAKAcAApmmwYKgCmBKAOYCQEphqmQHD2ECYEISBmYWm+owcQNxhIjgIAbGaZssHEElw4GWnFg6Ni/TGlQcbSnMSdNupDnJsb5985rShjCQkQC4FJNOUWZQ4+89Ylc1Dl1/LHKtPncljczCEjLEELFzve4C+Ke/fqY591UsbpMbfcOZ09u7G7eqqL7e/v/1hzPP7GeeXPypL1PYr0/f5re8MO/n+v5zD/5d7hY7UlEsAZ9VRULFjkVotdLPe9YqdIOLdtDDvWqARrohAPMDkFgwQwJwgIExizNz6RDQMO0AcwCAYTBXBgN8ARswkAgzngCx48GKLD/+5LEF4MaOR8YL2dLkyOkIont0Xmxz9hnhnJuCXEe4xTDRwIrhESbdB1mMnMZMIpMcwMCk7qD66CVH2BW5N8z5czJqKGpdEspc6SgSMQi8AdizxNaI+sHrVzKXbq8xyrXKbtLr7sphl/oe7rMYEy+9lV5PXJVLu4473+sccdX+1v/nOY6+/l3PPLDXOZWO7qzv47bE3uGd3EEQK9I9EimitA2J4bIck+ipD389YL3dDnA70uJXrasgBQXgKgXlASBgLgxmD8E8YztXp91lKGMmGiYNoTRhdo0GhmiCJAVG+D5QXomlByHAJbMRiKYy5UlkkmauFH3pVmGguAYu3J2pbTkgkEAS0YNnoelK6X0frOxfpo13bYiYWIbIBsCWC6YpBgQ1UkxdWtbJKRUijSWzrMUkHGyHjQTmBXqTZAvIrc9c86kHWmkg96SCc8UVrSXRdT3sPxVU0xu8krx0/3UHxu9x7B/bY3XOf3c3iDLbvn9HWfpRP/JLRdzPP+X9pS9FAAAATGBADJbYVBLMCYMgwadnTajLuFAuTBsCKMNUYk5//uSxBCDV20VFG9uDcrSouKJ7NVx8RMjDHBVEhTBIDctYDitpDXjBQCclPI5K2wbplHB4WrT8/hTUw6EJ4Nqzx/XQiSoociuGPcv5qJFAcQ0AsexqzWqoZzue+1czqlWWtNJaZ9SqRk6g1g0l2OH06C00q1Ipv3qW62a6b+mqihpvW8sRFf8TCRLMZadpZ0+7yK7Wm5utOM5/FU9P43u71m3PwHf+5H2pUkU0VtnjOYBaYwAAEQCA8FAPzA5DaMNjQs23C0jE0CFMSgHkwvkTTLgQ0MKoGc9LAIeX+ZE7TxE2sIgvF/Jxg9D2Vq126r/d1pZRMK1iTzdFFpmW2KSzyRxiaCgKAijhPZNGqTCCB9knMUkE1I1VOpbpKZnSQE9E4pJRhUugzK6KaSq11qq2quzuujr1uqWGyMmqSSQvdcZlB/bWYD3qRYR6lyZvp5NisBL3v+rdeWt/nu23W/hNSNKvVogJAL/AAAcAgLGAwAmYKINxilRBnd8MUYTgJpgVgYmHEHccWwVJiMA2EQH40A6lkNAUvez1YWJzG687lVnJP/7ksQfAxUtFxZPLHxCeBYjDr1AAKt+tHa+Wd+eXrGscPose4873ve7tpsiMGIeAjv8y60/+44a+q5mW2+Y+Djj0NJ4lXtqDDlHbR+vO2hnd9muzLCXe/+ZUirgkG2UEVSaCsw429FyHommNbWXhR0wKpl5E8ZcAEXLoUsKMHRRYoBAABgDgBiIAowDgEjBAAyMFkNUwc0BTs4BiMYQU4w2wmTFgQaMR83kxSwSTBtBJMAUAIDAELIdGCQ4I3KqBdNS0bHh1kKgXjzmaYtZFx8DMETMj5OE2YLTqUsh5AwtmAtEAUdiD01GA2T/3stbO6lvrZmeYnj4y7FWie5zxAlTPO8M3F6jbwO6rPi1tKm9dmpbHWp6uYZxfFrLq2WKAAAREAgGAAEAAAAAAAnjAolFomASMBQSDMJpDtonTZMwDnQnDdIIzdREzcEUwMNbDDBIDQwHzhDaj4x+htHQRDMLiAb5awGtlmRw4DcAYHk2HRgbpHIGsxoBs4mB+a2UF1YgQbYnQDLotAweoAN4D0DuMPrF6F1zYBgmAsBgMJAYDFj/+5LEQYAmCh0tudqAAp2zqOu3MAAEDxgYRRIGuIIBmFogawYYGTVYV6CrgDAgLHD4zAsZFAM6BcDUQ5AzmAAM3DoDHgmAxWUf6I9lUg5XOk+AEawOiQIDOALAsQwLCYLDQUAf/RLxEBYC+XCo5cBQXAMB0DHotAsbQuWGRw/UBASBQIf/QWmV0E3vhyoN5gMLAgLQhAUcQgcWQQQni7//3//zAdxVPjvYnzMwWicWYjn/////////5XKialLUmX3NZNgAAAAAAI7qqRWBS+BBCbGfCYCIRYJKgiSDABBiyRgIQY+4GuzJjAWDgELhhQQXuFSJ4niiMqMyOUViKjoIeTpKETGVFzGJSIsRYYwnyAigSXICQVFkikZmpsdLpdLpdUTQ5xFSdNTEipOmqBFi6gkbPRPB8IH9oCnRSpVSIsTxsPq11JPzIvJaNJH3WYo1omKLL/Wii2n/ooooot//t//////RKr//RQAABOMR0AKyyIHAEKMAwEGS2LS04RbOl6C14CBhhNCnwZAYpA5aReCmZMGIAala9tHrBcQ2GvdU//uSxBwDE3mdOG4+kYJmM6ZN01cIOne4hdgAB0z9fas23HkgVf0co172xTUSHi2L7zF3nFqQWAt5ZAdDOFoY2VmDsgK+3sdSVr9JJf5lzI2as49SS1nlLdYj0+tkroosbGSTHUzAyKyZijWkbThukjQ/////+bf/rIAALwliTg0ASZyd5gKfRmODY8D4QCwJHgCDmgGckvkYXFaf1E4Ci9DAPTnQ8eyIxC/PS61hhiIwJrQ1D0uq2rPKs2DANnqa/tsWaXiSQsdSU4ayTdPFZ5O1Baj48BEGgYrYQCgOE4kkWnYwDiE3QXUdRq7LUpW3WZ9Tr/0GVSOCEyHQ1ILXRotcwP1vcxWgt0P/////rKn/5ZUwAAAAQAoMmZX4YQxMITwN0QTEgGWCMHQYNkwAMFwDRkEAWgUnjyfFzE8OkMWTBAEhA7LOk2Vupbt/LmIoxcqZZ3uV9zAMHoaoOyizYqTVutjjH7msbsxcmZm/nnT8r3v1zmGFipStyLvGy1IOUXGh21jrRaupzm/+7xpnVEZ7WaPXqpMj3VGTuZIwnm6tq//7ksRHgRPtzS1O7VHCgjmlZd2qOBzPbSnp9+Z/////xv///+SkAIAHlLHY0ylJADCUcRgI3UIDEQE6YNksKAKKgGYBBwYVtycv9gYpiWYHAoAgEAQLjRMIwz0tprGVXKUBYYa1e13PndXYcAQ+1D41Zt5bv2t2piG4rXpal3/v932/zP+X9dsUuGo4oetw5IxGkNqFul7h0GAUr13e+XeO16sc2ppugleQsjGmIrsx6qqgMO9r29WpV9f/X/////xY////LgAHjb4ugnWDAAjAXD9Me0EADAFjQBJgQATjRpJgLADlmDAdAHGhADa+HtMKQCQwJwDzC8EUCftbjmFmc3Jq04BlpYS+9av3+copeAssnsYbprcu1S65Ec5Byl5nzKtzWXbvd8y1/d5zEbYAQPAyOxgv0Rpoi7HQbPlJT1VslS0dTK9cn0NNjdl7UtmMlxpodbeq+r/rb//////qKf///5oQAGlaSrAJHigAMC5846VAENwMJiBVGQFGlCBQEYWEpmF9G0aVqYZYFBMBCh8BAFQUDEhU7Mutam6uFOH/+5LEbgGUBc0oT2KvwnWzZOXPVbBAJVf1u9yyoq1V4AKBJAURuU1uzct1ZnGvIiImS7pueNUFKdk6kkzOYnzEcoLngMUp8BggjNGpeRPrBEDCK/WtV+1C/1kym9JSe9FqSnTXWLl7VfVb1f///////lj/b2/+uhQAAAAAAA7RW4ikkuxoKIiYhBAzlFIwJBoHPmDgGCgBjIRCJETRa/gsFZAADNEShobVOCXZ03SRLwCBCcjyqDnEDIugVGPJkimeebIpIrMDRBtCkeU6lqXdmrmZwdYuEC/QWGWnQVhsRl/v/aGhuf/Axp2QaS+/fFvSNACTIDDqBZK/bev//7f/lkCRqiYknKDQBDAmGhMd4DQFAohAEpYCxMH8LYLgBmAQAkYDIHphCDEGvEluYYAKxgUgRmNHmQKC88eBwx8ZnJyVbkhgUyLFPz6tWmlcxfCBrO70zIqW3Wzj9nmN2zqnzneWbWeGXd0uu1Z/PGmoLk+7jxgYnQghITLoKQKYAwZICpmX/WzozLfzdSlKu6tBfZBSpjb2+r////////8y//9///uSxJWBkUEVLa7NEcKJOaRV7VX456oQAAAEEFATY6sPc12FGAwmj0EJQtZAAIg5RBoBFvEwEgYcj5EWBouxIEFVEP3Ij1m5hO/+F1BGv21/e8/XcFlZVbSKpzA+JqQQxCDkzsls1SVdVc4pjIZYB9xYTZF6lB8ySX9mtQqTQVfYfKbrW5imk6lqdPeyRcHi4gJlabgAZqQ42v//ysgAAAABMWYgtNiTXAIJA+VcRMIZNDMjMaKjEgAIAzCHc5AWQwgBtBYu2OgELBSyM3iSDDNIfhKE6hYmplmAX0h4uBsFIHGW4UgJOlh6GEuCRQs5Fk610sMcWCzpxcracYWdjc1IyoWfjKo2pzYIMeBF3DiCgPKrOwPVGpBcUIb3byDHgVvfGt4zumdXkrHgGSIJhwLJCwDIBYAEwjoJhECeQAbP//76cAAgEoBRmHDAAUjSxCTKV4BEHJgUSRlcDZh0MAcB5iiGxl6BpwtTBiy7ZjKJhhuchk1OJhoGRhqBRgEUEQXEYPBQCMMjIzejzVwINBo4UD4KBZeUtgYFAAAAJhEQGP/7ksTFgBDFEy+umnhCmZymJb69iCCWDCsYxF5j8FGRiOYuARk0eAgemOAeYzGQhDoOEKd4GGpgEICwGMFBNBQwyDjAgbCgGTYTvBgOHjsZUFZicWGKQCZKBph0QDIeMBsk5WWTMA1CoS9y/qqgkeikz9frKnLgXKo/YVIvshZApIvaoYRBKap6s0ZU77DWjOO4qVTiphKdoaCR40wXySVg5KVAILFAAVP5AcDBREEPDlnkPwegc6wIZMIADJGQeFTiyAdUCCSYw02hiMPAOmQEamiadAZlrA00ScDGgIKWCLi6oiwVeTL01Uvn3aBIKstZ0tFiyPjfLCoEQoYpbHpXYnscPx13HLfMsMt8y7jl2tvHV/H8t5b5lnZIhN3+lgAAAFshVGOfDTExpyyxcFtDNQMFNBkCuYopGZ9BuOgPGFqBYYAYO5msjdGCiAmjQ4iCcWAkZQhKHgClQPEyqmemDk6mOrJSKqMqWpg7UVhpYKdjsMx+Q3a9S1MX5bULhWLpDiSHCKgSQ6gHOwOMwD4S8VT8HCiieTURpeZKCEOSyRz/+5LE9YAtEZktTvMvkq8pZWG/UXhIzQNhHLJnC9d2RrRUiyS0CijUjWuk9lOpKpftW6nqrZX/9ZAWfGNb+moABzwVWMHwUUuL1A0uiInjAMDzCQEyEGTI4mDLXQz9dxjGcQTFYLz5QjgcaAkCZd9ApS2HaSWwTRxm7epSUB6WCx4CYk6cK5lRzr955VqXus7OWqlvWH46pqeZnqNEQBJSpAbzVMO4Ko1UueMZ1EFILanUpg2k3tsrW955YfX6dU8xNNnb31//4jc8A5/qsTqT0zKFIBwSakAMAFWFMEEi0ZEgWVgarCTBAYBBQY3W6f5OAYvCOYRlwbDuKYPgolSzZXJEFzfXr7+V8+/aasBMDABT7IhqGAeRj21hVYZMGrrRMisPRUJkCOgBGkQRLzCmkESPVO9CLEeVqMhyy6+3u6GpGcJEzPdlG6tTUlKv2TZaPV6//8x6y1/2OTTflq4BZInstZro4AUYFYGBj8gVg0Bpo5gEAgGK2DCY/hYR8/ECmNUDUYYI2Zn+o1GE2DCYGQFRigkYuHjWIX4h5lDA4RSx//uSxLGBkoVLKk60/EIuqWWd1E6QrcFCMkoLZMnM3t5UMP0tNDCBK/NSaXaxlduhjE729QwVLr1G7z+tZMDHD5RNEqE01lJUiNIlO95y9lXpgFpkNWbTAjw24xmiC1MrZ1+ZGpmitb1lu2mgkzPvUtJSq//7avI6p1EHkvbVf2XV/Ke/v2b5CwNayWZEAIYJIb5k/gVEQKpgNgEAoFswtQ1TCGrUNN5fUwHhBDCwBdOMQfEDEQBgMYJAPIAJAUBGpm3bbhUlI/9qATBxFLARgKHCkjDlx+d3XS2ZbXgF9cZc/MZba5BUrlEov3KlO8qvIs3YVZzsVhL94I3x2BJViXcNYXa1SPjgtLpyeudjI8EXNTvLeev1OZTDy55QNjprXj6Kep6K6Lb2W85EM1fzu7txS2PipBRuAWrezIWVUx35PluxOytutFUgAAAADu+4KfJaVP4wDxCTEdBkMAwC8wBwHAcCcYjgM5jdqRHqiY2YqIKhgFCEGqSU+YQIERfFhwEAHDAYlLoi/y3aW3CJfHQoHrrfwWIZbLXijGFSLx1b1f/7ksToA5aRSR4vbm/DBqljQe2eOGHLVBe+U1JupUppBXv3aaMt67S5gsXnCCyZs9S2yQAFgHKj/G1W7hGkT5Nfw7uPPXjrLPuVbLZqVoYhwNU2x1SzLRbxy1DDEn6HKqoldqKiqqNEzu0FvbqpiGmvVGZXdaKh7M9diLQAZMfq1TUmTCcNPwwBYGnMCoAmjAKwDUcADDAFQDgwUgBWMJjH5zS3xPYwfsCBMCUB8zAYxYwwBwBbAIAA+Q8JA75HiF74QjnSx63LcgIRIxMIBwni3JK/ksiS/H/ZEu2HNWY/QOjcu5TLy1Zm1ZlFMwf4DAg4dQfpWRuxTlUMRzvRbvcvvTNKAjijppGZgXwRJJNqGlWm1lpSbKzGjGzuo1qTTW3vqTQuv6q31W6GpCu2XszaWRqKH9T1yiB56tLq08gNiB0KK62iJU2qIAAAAClvzrX1KS+xgOCGmLoAAYGIAxgRAHmBEA+YcocBhZRzmqQp8YPwepgeCVGpUYaYVQJhgUgQmAeASYBgCBQDuoPQwC90PTe8ZgEhGgP+DgUWXcma/dH/+5LE8wGYnZMfL2zxwx0pYwH9xfhXj0iT4n87+WeeMq7AtzdFhZmLcvdallIjNHPJsmnO7VSJhVLnj+OGeo6n5Ludz1HVqcy5jZ/X7mZ0No4JREze6kYI8vErDo8ND2n7w0LE9s3f/zHHx/RpN51Q95omqtFQpukiJJ/7Eqkv/ZTEqjwl2RCABGAZAcZhIwC6YAIApGAcAI5gLgFSYMiBoGGRB8prawK4YVAAomClgdhkHIJODgkIwEoAMMIgHF5jwSAKna62sOU8pmn3GVsM5jRmFSEvE+UqpIcmFbXFg2rEbsjicOROcxlcpu1alxuuMliAhJndYK7sSqpIx5VGam61ezYj0SAPwciRIlAkxqBTR3LLT63WmlZFN0FJmpAUuydykno22qTZro0q0m+q9C22brS1OfUhCQ+sw4gcZi7/eK2uuHcyZBt6eWvPS4qsjTBAGRIIsc1pk0OSMcAAMIYAcSAcSadAwKgSzCKOuNNAkUwZAYgCFed2wxgoOpKM0V8RCFvcph35mxztpbrZ7jt01ZctWxcrU0Kv/hu3zL6m//uSxPMBmKVJHS9pEcNCKSLB/TX49b+v+equu5L5IgxRXVCOBqa47h+CTEU3gcz8fH2c1UdlmgJp5K3Iady+oqeJi3fashdo/cj0n4ucDCIXp3oaAHNGG1oU5pJAAAFDDkYUoEQAgXAJHBOB4nQwSALTBXBAMGENAxbBkzIVu8P89n8x1w7DDeGOM+pO8wigSjArAXMAkA8wDgEhINMaATeWBlMJHnhEZCM1R6C05rvC3UejUUl6+2nNK3L5bRyyRRubuQuxFaSIw9TQ2yeniKLhsLuxN3cCoHQUkgs2MN2s4QOiM3s0j3YR1hj1V8OZYZ88tBhbSUKgOD9hI9DOREf6Od2HDVouIBaPmHjOMLWbqkiPtKl4mrlImY7hOaiOZpbpbhq+oapiEnu2HzsMXSufSah6wM1srtn4jlpiHPa5xQJmm4IBWdCEAPAgMAYGQAFAEA/MAfALDAYQGpA4wwsMPNZJC6jCSQFMwDIAfMeXCDgcDHkQA4qQsACJMAYKGMrXQ0eGZt2p+WgIdLCFrUaDHkOcOw80WJR9ZrnUk3EJmf/7ksTugBLhCydPcW3DljMimeyiOYl8Mu1EX2lFFSwFev12Jcus6K84bmL95O0iAoJ2tnzl2krujUx3hyopbnvuP5dz+fRoGSHQbV9LUYHtW/wR33xzF693/v3xzHVdKb6150e9x26Oy20uTXEQ8LrSVpSuvb0akoG3GoQZKnscs8O10gFpeOssgSrYgVQGYCrRAKR5BGQgaYcT5hoi6GGLcaa4bchg8iKmEIHSa/hVRhfAHmBOAGBSxlINVL8uFGVEZE7lPT3wQyruUOjB8LR0lW5RdgBmr+NIuP7F4bpMoVZyrwLLpm9PRyhs0CLoiEwlFHagErIpqWp+951fZM/NNTSHGVLP33+83zmv3ruG9arz34a79zUx+NzNCfAeBz+do92qAGCQvZWh+7Xu/feG1vr86PH9is6wfS5f2aEm1cT1uc3vxvmSO/iIACIqzEqSPQcKg8GEyBWYB4DRgNANmBsCyAQmDFiR5Omgj4xFgeTBHEKMAwm8wAwLEZWpIWjbS35ZWfyK2b1X0jCgqZSKbA2QDB09mJUroMTffOj3cwz/+5LE9oOaUZ0UL+URww2c4oHPZRFs2b1ecxq01S9nfwp5YPG3u5bjjFdZ/r+c30Apf3lg2mufviDzrF/FAyI5iI0HDA+M05m/vnrejgveB2FkLoEjVOhS2Fjg5yzYjcYUXQ8wGBC0ozRpYpP6/FdaAEr1/rFOioYE4FhjCgVhYBwwAQAzAeA6MCwLsx5FdD6qO1MYYJ4www8zRXKIMKEDswNAHDAIASMAcA8iBYU0gmkbrnFaszgWeUhPOpDMIR8coDAn3Y/p3lPpSN6pisTaiHrPBUb5XOUHIpwmb6G9bSNJ3caalc4nYDec4r3E85WxMeurfPtFvj4zGhwJYOZc5gOUtdGiLl5JmLKM5uH1NpOF3LJiHbS5Q/Y55cHcyGagKsFlPkCYnPGI1G9alaWBW1zI4YhYsMWiAxz36eZS9IAwNQeTH/AqMDABEwUQNDBZDEMFcYUwy7WjWNafMMkTYwqBGzYyEcMLQC8SAuGAATADAWCAEVyw1BTTs4zLqKARkBOHZE5bc4+vaFQM/kPp/w5KYZpYIjcBx6khy9GqSSTW//uSxPIDFjUNHG9lD8MkrGLJ547oVqrSWJ2zaGgIrfexRoBvtqr+LZq2OAOFYw0TdqXc/3am/vsMvskYiAjm3Wo12i1Uh5eLs9Fpcqh3Pbt03VcIyVsm+sfx2tLM8KRobLa++fg7AkxGCTce3t5KtqYS0MEo+P7/+21yNK2gBsx562oSyHDABCbMNcFIEAVmAOA8YHoAhCA2Y+5cx9tiEjRkRg4CAGTGUWAQMjAFANRzRJJgXlnRWbeyidt874Xoz01Vmbz6jRarTcSROJxdWkUuXs7U8Y4zVqLSFWuz1OTyV23DW9olImsTYbGuLAj4yeULGt/G8e7+SNEvKp4DRI3RZ9tt3TlHvHkM/6SkL0InYyM2dugnIVMjJCh0/KVa1bdJC/LqP0ZoKF3QaKVvlhf9PfiXnr26Dye/btvN/XICKkQcVcrdjAQExMHAGQwNwHwgHEwBgmTDYFMMaedM9kWVjFBDhMBoPszYTmjA9AlZlEBIAcSCESsjD3NvqUUd1sA6AlQS6QsXcFd0Oz1DDTtMJff4YuV5E7Up5XqvVFsaaP/7ksT7AxolZRIvPRxLCq+iyeeOeWp2NWY/hSEwBNvVSfdNPKzlb5nvWNIeGh6psYlYkYlSPLWQ2KWijlMpjpQtBjO/tm6WzbmWhbpmme+9/+zm2xTDJ7JqnylFvXiTux2Qj1I3djN7GIza7VXzXI8zN9V/O0iueRMG6+aFxwS42j2qB0zJr1dJYwHA9w4jUwKQDDAoAnMFIEMwJA7DGIiJO2BMIxOg0wqDUaewtJg+AJGAeAGWTBAAQkBO+s6/rpO/K6C9OrHgSSQ9PSRQWl5J7MhU/qMy2fgeT55Q1utZ1lbrdkUMS7N8I759EsC/ItPM1Nbk4Avk6eUTiaAzJeXVT1czKQPgfJOAqapmqrfHdEyUmKt5bHTuIqPmxnuZOVO9vSs4edWfoZFbdSMtZCLyzdGhudtQ6SEe26kfqZmUBFw4Qs9JuLdqd2OJdJfioAAYAABGmCDAGpgAABgAQA0wCoAkMDdATTCEggw0DAIbMG8AHDArwLgw8EGzMCFABgcAgCIAEHAAUIAKm+04KGCqLwuAy6bmldzDCfP2mJAV0Nz/+5LE94OaJdcQLyx+yxC+okHoD4lUUz98rVWu2tc3tWdtYOw3gNib3CiR0ygMYvFkzSWAJiRUOJDn5jS6+s6zvCLkvGVkhNIYo+/ZND7FDqeZmZaVPMrm35Dq8OCjvl+QjEG87DzNAsFojNdoaYwEnkcKicn7V4CX3JLtBwP5L2vOiggUIWj2Sv9TxZkRhDABkQJhgLgAGAqBMYKoUJgoM5GY8e6YDgWhgChymBUQcKgVgQAZAYRADkwHsHQA+vKl6xbplgH7pGutZrM/ofxqwTDj+18rG47Wh69vdy59EwWWkWPjjQY86IwUkKkjB01BGMiyaE8kZkAJio+pUwWIApLeE1hYbdo1KZEG6l3dt1s82xcxR1CY5RkTJbreb+yPNY2FZE4Bv+b2mn1V3Va9l3+ybsrfXP59hLwf+z+RY1UAQAMBE4Id1/EZxgI4wqAFDAkAtMCMB4wQwDjDYB5Md9hI+WS7TGfB0MLQHozViHTCCAKMBcAUAgDhQAwmA3dt8tl8s4zbcBClhUMJ/pUgk6s+VAvnhVxlV8Z25Ne2OsfD//uQxPMAGOl5Eg+8ccr0oSLZ6BtRm+TbBBpiUkDLjWUkUuaSW3rN44NdYmiLpOoZlZio67mLrOlY3TTYsITyTMbGheMzXTdPW6zzsnRa6r1foGZy55fS+AXhxKTgtgZu9wWrt5ukeDhzkKm7zzE00aPcnengW6F6LwUrgdF7AEUWUu1oyE8wAguDCaAKMBcBEuIYA4AJheA1GPCpeexJshithMmA8D8Z/4LpgrgGI6ucl6xaHjvfrcBxTssoQsyXNzLc8HfKzrtuU13imgtase6V9YcZg0vw2y7JtxjpgF7nMa6me2ve1Y9LtoGRmpa/nTcketN535NPhUNg4WsI78ppMypwqV7VOudlfL70q4wiLtIb2VrLokVFBBlwTEWjoChZ5XeIyN0lH9829ZV8rGzfBlwpTnml61IbsbwhADonW4k79yRP9XFA6MBgHBQRFrTAIBzCETDCbpzeKDjCYQR0LTN4zA4AZ+vWThsqJUw4LhejajU+4qteWYkjxrhHezPk9C7k5tlNxYcaJVSaVPL8wq4TgL9mk1DjTYvv1xeJ//uSxPaCGT0tEM8+UYr8uuIF5447DADxqXtPFvA1Tf1vPzuNizgO65k8aIRN6kRU5mxeXYS5X7LnDlhQjY/+mZZk6bz2L6/Du3o5HJ+uME2e/pWhjrCmGPUrIFwLwwQ0B7MAXAQjALgDswFwBpMFXAoDDKhM01xAGqMJ6AbTAsQU4ws4NtMAgANCoACsnEgBQSAknLjDR4S6WNiOxhDyTO7DE+znkDw3TSpcq/Iw7sRi1ykbNXa3BMpi2VNezqYTeVbpROFyyTXaO/P/PU9a9vj/BRqvLsxLcakC4asW+ZW6bLfeYfukuX61JnlTa3qRVbNtBmQbQqYRatfJrSRHc1ElzjtlPEyn97ZjWHfsRZHDddpLj2/wxtu7SL0pvsRSVSyiyfKOZY41TAlnMXmJJMn0paIvJIxSihQ4dmoGM2a228oufqIWnltJAtaVgMB8BAxPQEzAeACEgAwIAMCQ3zGAfoO3ROsxJA0DCTCBM5UUAwewHzAcAUMAIAYEgDhABDgPmSCkcM/PxLJqgtj2pAysVpmzAcFqcrEn0hMJShpAK//7ksT4gBRZnR1OvHHDzMChAfwaeR+qeTlZw8O2xSPWrmWW79BbeZo4QQCCQtdPWpV5G8h9j33BhwUpsWkZVCs4NHp5IeZIjEHV7o5U3IxijJ2To516cI6cUg2LLRSw5C93mMDxogSgk1RhRqRSRtDCDDhnYAjpz7sDXSCVVKjNncI9tJTSmCtAhW9QoJJB8DvYYAoCJhLgHGAQACYCIBBgMgaGC8EWYV6bxrhlTmEyDoYHQPJjXBdGBMAWvZ9VMk8ZCzp1shv40uztewXjOwWhb3Cor4zJFkpbDyPGxBW4W6x4lc7SIoG2j5X5sp493PWnqusTY+oCtbmraeW9xX+9apzEX+U28o9Mn06USpmL+uaxslxbHFwsXYPKFIpPvOMDLibmMFbZ2RDoQHlmGUXnzHTMybbFGDNpdi4IKd322jTcRCDOYJYIwhAtC4ChgVgSEwbBkCh/n6GLMYzIG5hCBoGDWPaYDAERgIgIgUANCgoA/avAPLnM8cm5OEwS0iPVKGKVrmyr1atOEGCxMChiTajSTd9l1nble7AJVXZe3gz/+5LE9AIZygUMDzBxws4joqXnjjhvaD4UPaqYyMvffb6ZUxIutUtJivxWRG2hh7FpZmR8dezbzv5vti0t9ZHd52vu4HeKqPmtWbUndJ/tYX6tzzLr1sH5c31+GZmxT1FzVO1cr21qdvKuXHaLl5tJpdFmvw21T0zt+1FWkGpyuZZrK3XMAoHMwcAFhoFMMAxMAQD0wLQ5jCJelNY9JgwbQtQCAOZIomwsDFJY23UmAEc2jJDbXTHFiHM4LllXlcaVG1XtjbiSA19yxAiWYoDGzNrbND2qlC7MIK9VOodXuXuI2bY0yOAnDnLGvny51bUTeqYKU/inHNhiG6oTyhhVBSS8VdZkzGpmwMlGUyW42NIbEtwJuuR8Hp3lNxYKgJ7Pm51i+kims0b4jqQYKpQ5TdRicYMWfTJQSZD+Rv9CrIAVAABxWpFZ1ySP6yICAqmDwAiYAoChgOAKmBgB+YJIShijJ8nOcUoYgwMZgUgCmSAA4RAexuCWYM5lMSaFAD7Ve27bww7blk1H4/GMaSftwmirUVq1NSutNw7lKrMkzj0U//uSxPmDWboDDC880csSwKGF5445i12ri7YsAVnGeoUKSyq+stmQsD5c6z50E1iVdfwXfiw8jCw7QqRMRBgBXVtHM+ExqxmzMiLKhQTHQz3psjyjEE92XzQP1b90U5bRSA2DxUue1yfBNmd2ChzWlpC6nosIzoVUOEXmgLXIisMQFwBS5MqrwASAXmBgAyAAEkGzAMACMCEFExSjHDpWJFMQ4EAwUQVDDfEPEgOhYABhjRRYAZ5lWwtE7qFFeNDNGgsrk1Zh0n0yrVppr5YGWJLrLVR62UUrUrmYqVZEex2IxHVH7g+cHrl8B0oWj2vE2aR5cseY96wyeZSnMvXMmdzharSKpSMQbV8sigrPIoZYhodvR7scPbRCV07eZMuVVqHOLmUPRiXpiO//VVDeG+ExpRZbbjhmNR0g3cmTagCgABXC7I03SVd1pS60ZDAhLtAEFBQTTAO9jO1xTAsQCEOTG8iC97AH4ftjuE7ioVFnGrE+dMKbblUq7ba96+YrjEfUsrZY7hRwQ5jYFFCb3UFIg6HsCzNqJaFP4He6bSYOTv/7ksT2ghlh9Q8vJHxK+bkh2eeOOd5iSzjWt6x4MK+iPMpmgRqSQre5WNqU86DIzk58U8unSQ9EzpiQy1EMvkKHbzkaExIVJM9fk6FailM9aO1lSLKn7FLECSNxSBWARdHQEgwDQAsMAMAMTAEwCwwF8A4MB+AczCiRMo0mMFVMH9APBYGpMMCA4wEB0GAPgAYBABxwAQRzeEwC4mWnFQqdqM7UTEIhsQiJOr16KqoJPbxXNmQ3LPhFoeyq5WmSuGFP7guBdBHWaKpmp41u4F6Tv48zWGm+XrXf7ZoES8KBiTcx0BSP5lrsgeef3oJCJLVtYYStacjxwIf1BsImFA6lpTRFCSK82iwVnDXpZOWctNXg4lcG9OEkDjlllU53SPcyjGwDakGUpz2CqUHEhZI7JUliVyQWnPZM2k9SF4YcaxqTqOpiovNUGo1i2xZgCMv5JZXEwsA0DgZAgAdC0cAZMCQGAwvTszYBKaMH0GUwCgWjFNCPAQASy3LeVb09Bd3tEhR4KReRG0/G55d/FV7e0RoMf4vAixIWn2VPdkVuIun/+5LE+AAUyZ0Zrrxxw9NA4IX3mjmNcBPPoDZaF5IUHdZdXkLw0sL+Be768166zBjQfKk5oV1La0vPcrmSkjoCuUrkxvWM5kaZkcW9/shFkVX6TLZU65a/Qh5FMwcV9tZt3m41khlsauXkOXL+Tv5hhnU45SQy1i67YoFgJjBCAXMC0BowLgIzA4BPMDkMYxPnrTksQwMRQKkwWwYzBKGgKAD5NKIDKAIF+LtmUbIrqsOBwQIK3DcW+Arsr8RUwk9BYW5khpNgvlUt8CKvw39O8SZNptRaR7vmzDcyz7U74T5ijrc1bKnbnGxDbe80yG4EK/RKsjpps07L7JJzh+yYTBNIGE+TQLegtNbmEL01B0p26P/TSLoovSzDaTxtQku7IcWUU4/TlHrRdCsIb9uZfUoaZ7XK7o+wm5c4ap3gw+2guJ5JFzaTDrLus2j9e75czwhiygETnJDXliwxgLgGkgBQiABHgIDA/AJMPoFA34hGTDGACCARjECCjXo/EOX1OY3HwqWmA+iabtxXGib3pxo2xF1JFXHc36go/ny3szVp//uSxPEDFonVDk88cct2wSCB55o5igai1dpNKXrCnc4+pHzfFmk7MO1nfxHu4V5IE1JaRLVMn5UJbXkka8pllkqPS6od1zOQlVYRFZ25CtFKLk7ny3iQm3DnNqaEdmhkeU6ZQxoSUn8zz2/R/WHSM0I5s5Za52CvHs1YAQAbpLoJs0KF4kHOLAQgYB4AgUGAGEyYJCthmKG1mA8EUYBoBpjRgUAoGMtgqRY7+XpL5hKuA4thP3UaK02ZWWE1qp3Dj4V0KKuNVku4yyxdwE9S166QL3L5vxelY24EZo2wj8QTisU+X2vu+YlLYx7fV8qULl0IKRMY0O+d2mN9pOe9ydBZfyhWG+y5IpYnl9txM2Ci1g0mmvTNN+nduymmdbfMMQmoPhX2TIdMQZN/Jbn/uGS9d2rDPZJblpmVNYYmcf2h5+VnPYQ2ADOGdG0OPO618wQQDDAEAFAoARgLgKGB4CWYb5mBuAiimF6B0YHAHZhZBUAoB1vobcJUNLEs5TSrbDtrS1n8SaSLaJidk0s3vFZNPGbENzh3iwVdM4OpdqOfG//7ksTugBa1+wzPPHHLMUCg1eeaOcYdR6xcRsRqRxjOoDjmV5Npr8GSaLmre2aHtsvw80ns0YybleMlPTGf8qZcyYLzPmcrzrTk1np0TonJ3Or61onlZb0+H21+JKk+u24o0tetPaOYVdZqB2Q3xrm2ThPZ4vLakfNUxnhm+o10s2BAbzKWPJMslGACjABADcQuWYFgGxhtkvm4GPUYVoIJgVAuGDQGCYAwAxatY7JEsp5g+4rOumrK4jwYC6kgxX8rYrprOLDnEkCJaM/eo2eK9jtashPD5Jt8/+JCvXL/ECsYgM7BHl1qJPFzuau89DJoCm5ONQaAyDV3B2oTFkPu4FBthTigcdVYNSO1AkYgU9hiEB0WubxTpmHDE5iZCB2GRDLQSIKaBAqU1NaYawuPGy6Jc070wxEo7pLhzwwBViOHzODWAIsoAOFDDqzEuEQEkQeiQDA4CTAQGTBEYDCL2zciKjDoTzA8FjP8QhoCm9lTkzsnjtUZsxejg9u5x4zpVtCSbGxs1K9R7A4VVtUi2SQ4bEyx4MsrhM2pSlYzK+n/+5LE9AIY+gEIrzzRyxBBYMXnjjggv56Wg+0hIJ4ln8ed/TOL6vv9maGEcFgzsEBx2CmKOMx/VhA2FBUZDOOIlF6UTntGMwdTqkoljfQhIMnpjmgkFW1kHoNpcsCDgxQj6Jm+z5ECVpiAzYOp4wNWYI48DjEoWol031o4UgETwf9yIYhmmHDnCIqYuqbkmBqAsYfQ/IC+gEhiTAnAZMRQE5/X8gp51+XXKMDZMaSNqjclyJEBTAnPmGTRIVYa4NIF6s3aTTSBKmNUQhlNaC602GW2CzZNFoEh1NLT2qNppRcovqyreTaijjUvV5LfzGutLYZPEUFVydLaPJNbNEnlMI20cJSPyrsIEmVIw69uYTjBpDnlcKqV9JVspb0cp9JK/dRtRlXbmulMvFZk4o2QrrYlOJKrRZIoxarDHlGvVrqJJRaySiybMFoJseUJZ0/1K0+XMPCRoUJxCFBgFgpmEMXMaQxBZgpAfGAGA0YCoRLQnUjGLU5tgsBBRQlErSDcQIrGDtH5wJXEqkTtbBdaZEXRZN6jxW7g9TiiIjIo+069//uSxPSCWMYBBs68ccs7wKBFjyUZ+YhfDVkrghxpJunR9sNLme9WS89tOk/LG0S0MQ3DDSb+sjPvuXgysYSpZc7qa6jUd2aDeinBFDdyOZjOYspT9QsqyXZRwwdii2f2sVKpZFNsnTlS6azUk4KqWtk36lnlJSkquBa9g1A3FW+szKGJ2lHZy7eOUgt5Y0Ufyjh4aDZBUBAEYBgcYDCOY04Ae4reYxhsYCBKZVjggnhh1IfatRD4lJCcz2HGpQPJIzhNKDRs8iRETbJ4wgHYoWxUsox0c7MKv2bdvaaq27YinwUGF4TlPCCUZ0oiJ5niny6lNyqNdJC2WpWZZcSdCCG4U9fbc8FRMq2Yg7KRNoz6fXCMfXXkTPtjUGYsw2qg5zVTFSjiNE69kkBlQzFOWa+QnUNaEiE5U0a0tZjckXO+tPl2eL3CTVjYeBU61yWBJGzWU6USBIACd6wREAECgVDC5AeNZsMIwiwAQgEkDDckQEiu1zuxLqF+A4WKFhwsRrTxGdNTBRxw/dA89DBbmE6Stm4prDW0MSJ9iTlY6iMk5f/7ksTwg9lODQIMeSjDDUEgQdSaOW591K24qHZQ9tJmFpKjmj1IGsaeQMOa3mDmmVtcnNRuGmH3ZhxusXRf2VmxkygH3nSWkUSSCGMY05Ouaaf1jmBhZIRmXBhnMvi0dui4rV1S0DCMq9xYNRA1epTRxdp474tC9jYP7ED8HInwc6SkTjcXuz1ovjG00kIfS/JrDcUoGPL9SNCwUGDsMms6sAkKyAJDFkT0bnDkUYc+XJTnImSWkiRLmgGUoVDDhwdBcUIUMFxwyFiMQwRTSWZXmlEtjB56SLtznD3M/qAHWcQKSkgfONVSi6+vI2TwN7OK1KwJeEUjLNNPxK6p1Ca+eYORMtxQ5sNOxmKr05VGTQbWe2u211WlctXhjWPRtq7n0TWo8dfiilsBHJ2uTIJYuE7fEkUIaUUsKOM19dvcaWezFOpUSbyuxUrKKpiclUOxUqFR5QDKYgoJhCCxjo65/IVRjIApgyB5iSNSRa6H8aqxy8iIiC+ZgTmoonIZT5O1MiLz1RrSPwMU0q0xgWQuUam2Eq8ZJrIUc2k2TyIhcjj/+5LE8ANZPg0ADzDRwwFA4EnUmjnFtA1hRe1dfBRqaskTvEVvmjpmR5+TPpFWWGVSCDCyamqqXGSqycrlem9cUtSE14InRZqU2nI0XxxRfsqrsbqNNoswViHoGVO02TuF4rMUzVNu1pFkHtJK/XoUkEP1YziHjDZ5y70TSBpWvOa9RMtPk6TC67y7bb2cYkfy87ln0O7R2IU8cMDwHMXDyPRD/MPAOLnmUwOpqyikkkRq4o0eOnFt6asTd0ucH0iu4Vk0WOROLKEE0yBxaGngxLr7Bi+ROJJEHcUQFl9ASXjoyUUFA1OaMce6K0kKNhnSxJdGZtoOtZpDBujYL9XK8vGQAiJdEqMS6APRZ/SPc84wYholk7IPjDkytDw5JIXMUtwY3DPSRAshs5TQhI49dUOs4GSZNE2iZSw1W9C7a65h+ByJeuQMdAnpEtYfAyYlc9VQJvOOy7Tc3+ZqzpIYCBMA6Y9fhMbDkdDXRNj0UbOoh5AiWmjJ2jA61TytGF+iEZhCgbme1Uy1myktYcIXHEVoiuF6MG2osr0wy+Crm0Ky//uSxPED2fII/gx1KMsKwV/B1JnhcXwMQIXOPnads7iVe1SsqxfKLKH5Qmw2Wm3mzRspIqchvxcbpVHGLEo49XJIGMIdxVY4gvIST1iTNxdJ2YwkiVrIj0ZVGcWzEzFzhrE4625VSEDj044mjnOUdjqqFluV3iFeKPpThU/0VWUmoiyBhZNQ+gxHEaIYOzso5dDdX2a8GAaYkmMcyioVhqDABEYWSWnjMSoUdtNmbegnZVAiWbkf6rk45fXSLKEENayBIKSYUBYiR7X7cXytSFFvNhkldiKi7aGSDItNH5vhaBO+RvZgS8c51Oc7a0qtr2itbyWd5rEFzLdGEOoGEmlppLRlJSS8n5JK1G3L1GC7KBlMZZKzFOKqE8ETEd2KW7Wo1Es9unSDqQism9KooytNSZikgzslF15nkm13oiHGVXIl/WUSaMIlG2tXZZZvIAABIAAXJDDAvFcMinZKgQMFZTwX5LdyDFBdxImjRCppR7zapEtaaE1JAYMFLRXrM0hUKoDRdx0uWTWbhJyJZPUrgwldro0CsEllmdLKqMLG1f/7ksTuA1iuCv4ubSpLEsEfhJ6koFadKmHKmooEmkpsro5uSyUmS66M3cUDqXWpteJf5Ny2MtMIJL2IVYpX+sm02R4QTMGn4kqqkpGTFIFJHGNZae5BpaToNWzcqOPXmj3tXAmQvO0kjdK36fTSjeJopl+oqZXWk5pTU51NDcMkkhplE2w7GXIZSdFbFrVfjZFrBNHVcwAaweEjwKuYIDpHigrE1lV54SIzC83G2jLp6y0jLo7aURCPXR17Bj4pcfOFOcXVV0gONLl0cHRPfBOtcouFRMyunrVO8MVVTkay8hVNrmolY1NE6NF9MFadAoeZW5izR/UB1JuZEckyaatWDaRtA2hZ210EE1TeLrnsMkEyErGoG2E07aIG5MNNqtFpPg3G4RKT6aBJSJHE3qFdUcYiQLJJqrllcTjA82qSX01dIosn9ER44wiQadRq0qpYTsTacbghZh8KPPy4YthlDaM1CarYfxsiu9OIXEpbUaBSc4NEZD29kKy9kKAVS1XDxWbuXxQnTRR18GRQmuiKiNyCZMMjhjR0+ujlHZEDkff/+5LE74FZKgz9JO0lAxDBX0DNpRGWC5KoPqxdOAwqOEhEsKS69weKoEKLGiOrcQjPgoQOUEC0jRBhkglgeJo7pYwruUgSlI6gQzSJ5Tk33NqOeogLwRtkD0PVmMEEhCgMLlomyOHX+vQWbixa6NgujcnSSZZZej7BdypC96AovDGeQrlSuSg5YtBuCYKSoB4eAmCPLwHIhKZgyhM9eUYLCBEokXKTkQso7SROkd7NFjSCFkBgvEVrjbHQCRJZeyBuJEk22ai09nZE7SogaONUiYg0nBG6Q2WIkiyEvt4lONHjj1WUafQqmlm3DipKbUsbIBlYf1pMhOnxhYnICjDJphZUiVMmUkmiIUqYTnidIiQR1sVqk7WqoiZDr6O8pSZqbFyRNOZZo+QB+llm8KGShtVphcowdZsjjvSRlVG1nlBaaqiZsw8/Z9AJ2VYYmgIEk1eZSnAHyP4BFLdiZOfYkC2AjoEzSSEqLkwNKj6KBNFRJ4IWegTGb0icQDIkgRFWGm2AER8SFhaTAe1VXUkE05c22jVWe1yVRtPOUbSQrHma//uSxO8D2QIK+AThKEMjQZ8AUyQolJshev3TlTJk5Au8/aypc+UOwMHSVVaenuYQjhlNElBlYsOrFYpEr1k461R9A3uzWWmm0R9GRnzqNDU5KRmLCeRuKBx2Elm4GtMsExxIwsmVQkUD6WEa9PiabMoTToJI3FWhyDLdEESJa4sl6dmwNmB1UkqUjyQEAgDA4y646lXPRswpXXeQqKlVrxlNa9zzF/5p3n6uoyc1ZYlDCEklAHTARx+QvOjMtMWdKzjxW4f1aFokypNd2kqRpkDmFjCwkEjeHFCLX2dg3aFG+CSpCpqFGfbl2okrVG7Q0jvpEcCOilFCC3SaqUmpWjIdwmMajiiQkaBlUlgPk9tL2ohSPN5AlQFk87Ru7Y0T7JpGwdIVr02zfLKESkEEYcAiqJt5oJAg6QIagSnmoexJPefgOCWEKJkj05KEsJBhJXlFqkZ4+2fQTtNGjI8Xg5tSDbK6RAOImRU0oxaBuBOQNsIaQI1mlUBqkSNBUydNvQ+fgTioTSZhwu4HkAEqgCUSCAczgRotIqERZIKQPpZxcP/7ksTtAFh+DPojGSnDHcGfZMSbcMQGhu11jylIF5RioSolVCFJhbXjbBK4UMik3rWHzrzhnWlSRhshkKFCdQ4wy9ijjTBKXfbyNREQLkKNJBNZRYvRYiRLHpKKJRSQk1RpA1AoKJIGhSquomZaHHzbytZTU7OOpI20hCzSbaZPFERySWPkLAoWcTIpkS08NtE06QOWZYXGyjDI0lYGPJOTdATdWS2dAaPL2unYiFawjFlZEwuu0owwyS4kbwk1pl9EOON2KU5kBOwhITBJCOxQFUSsEu6ZRYKLQyOF1F1iVpVmRdttHFCYtR2kEFtcStNI3RVRDyyi8l4HDKNtGkjLqpGl0mFyUgkNkeMCKS5lyNCyvDks7kjMdlANMxN3bAuZXcakgVJyiLIjRp8mCmGUydtNkpBphs6jhVtH4NpEvTVqqMuggRsKo9JEayc8aKEVBi4EPkAMBUCQsM5hjJkEwagOIXQLtH7QaLlS8lF2E2CRTHuSQDgqFDMHPXrV0cVWSVAfsvJYRLihAY3VINmerIZXV9PkjKo5m2ohohG8NPb/+5LE7YPZdgj4BJk8Qwy/n0CTJWGxGiUZU3zRQkXKEq8CPJPVcogQsyaRzPzJJI05kCS0W13qxGOYJtVOwy2ysVE0ZGid9SmcQlSs2deYh1YNEjCzOCzavYXUTFKMiUPwPEKczshSvIYZqFvNFSEPnsYbRVGBpjqQNkbIaVPp1N6jc25sInswSOpmiQWMLs5CQADZtsoVCFAolR55tlAXaZaKEjM52/VzUmA8qKUFEVvI4AmjokmTRkVRLKVaLlAy79LXUk6EywWbIowaFGFlzApqmUZsttIFPhpZoiMOUPoUTKKTerJalcDRK0YsLTMqttuJ1VS1yBC2myTm2A45KbkLCaV0s0RcjVbousVRClJlEzLHrwjsTbTJlukKNspDmQ/cMiq0tJRAyKiiW9zbdrKJPaULDaUyy3NspixZcg/mWO1EtSBnFW104E7nq9t7K0YgFnybZUgXiWemyuobVXQLNECZO00oSFdaKTWHVyNxDAMd01UMiEAsECRDYUatqbIpgLIkCBZC7uDJhgIHARTxbbJ0YmFB9DoXbIGKeejY//uSxOyAWQIK+wMlLcsHQZ9UkybShhhhRCk5IdM40qQn1RKipGqyW6bBMwknjBUiTlE2uuimGwXJkEGniRDhFLkq4gICyq2LtmyBhZos2zIbxGGiGVOMlJMJTYIIBVl7uQdVCF9sxVkx9ggLPdAqRWQisVHSIxIHhGNuehTNTJzjaZdMRWYcwowqyiESFxhTo9m3adBBpBpTVHG5pNIVyE3baFQsziUBLVKITCzhhNDTQ19RQcYmkgLLIULZGZDiSKkZqSEkGpj+MaXVF85nSFC1rZ5GLkzQvisLcxAwjRSkgcgbcq3VyQKwQVA0j1Y02gZpOJEifrbFMDxfDpOyqqxJHFWXU0katqcrYyKaBjIlhGQpLKtUwTSqDUtZnhuaCB3Ej5SJZg1OMYG4NFE2Wm2U4MIbZI7ynsfUT1ZzkuXiPCkTtoEZA4sjqRzkCV6ncoKSJpQT2lhZepE3lwUfSWmkNnH6JkC/O0yjA5rZjahPBzKNkV0KUMV1GOfydC8nAmhPkfUWaKPamTNCuazQ6CqF6hGo9mklS7CjcjrRakI4Rv/7ksTuAFnKCvgkmTwLCUGfVGSkQPJ0bCS5VTrE5I6kGsiFGixRWl0BWixOIColYHz7CePIaIKDKGZdEVOttiLEg8CTLWoVER8wsJ5EIwl4JCZx5sgQM0TvbcuJEzQb5PhENsDiJJVuuwQKnE15jg0WJjKMcRmVo4cm3ZHNZc+2iPMddtbwNwYQQHjC6oyV6syEgIIlJoGEKw/KMJiMB8HECya+aIJUc4SWxIBOOKIyWawAFgQEOBj7wy+mTRyzxU2hClCFqpkMU/obb1Rso3Fs2gQKk7UqQ3hYfJU3WTrzJYGC2jsCJRVVfbIeYLaNHETGpoGGSdgr6eTYZc2lhQjXQqCkVqKtRkFZKTpyFOLBptpJs9yvfLSEQCmbm7REbsUPNzQI2lkZLJEiOpKsvU0hwQmtCduoEFongz0We2Y8GB2MPB1QTOQQPGCOWcaWpjEpzUyj6Elr1XIhB5DQEPKIHENHIIyT0jHg8xkjJSGHENopAgUhIQoHIrRJNOXm2sjZXsiQ4qm8oeOoWxLRc8DbkgecfKkqwcQZLF0BH0nnEJH/+5LE7ALZsgz4BJkgwwLBX1Rkm3EUKLpJKokMXIjRghgnaZSnuZMEwhdS60VkDJIJz5CKiZyEwKNsUB8hJh1ZmkQoJDZxZs8lKQMrtKIiZLvk3kkz+Fz8z6EliPvRzihQsDtWKl5SED3ihEqV1QvvaMHF1mCWa5pZKI6Pi8iBtAYew2vSTmTacXtMqrWgojh5nSOBGpMcDnQa9CCUDl1kkZOfTFXC7KNdEojHzJgfJRWtLzRGFyVQom5RGmmXJKNMweTlEmeRjaRwjCnmsmbIkYeLLigwZIGg3AlaIykRMsIhnRfDRTKQUxJEq0IysMeSo9qRMCALI19QvIETkeEJYabZRLLPe4cbmZMkStMTxddeaFC4fjO00C5oeiHrJGu5AKmJY8tWIJQOyg/begxoNpNCtRyTCyR1Zy152kBhpBBQkIiRCtiqNtM2olaFh4jQue0g6SePTiipACdqFW2cEAgEACQAMTiVI1lVqQrNHkTKiyiNEibanhKEysWoRTg3I828ygPrx0BEaIAYMBYIGljzh84ibbcjJjjFiiRoGyJn//uSxOsD2V4K+AMZJ8soQR8AYqTBNiVSahFawgWTccZpZqA8g2QaFEhuOFzqKgMuQgku0QopMDNMLyzrOKuQ4+XPciUyZDrOmzyPE2SCydZJpJERrSDzUKQfVoqkbJEr12kKaj1oKrSw0ruUeYiwQHSfGHnIMSe2zNeG2eYecWTS01CRnXExjCFxK5RVBG2KR6gRIyKF4pGEKIAA/S4qQrho4uRqHlFmZDomIKK4i1VCIHN4qbRSQiJN3AfSgWQ29pGjI1MiYk6JCFoCjGvHjjw+YUtG6cC+odTYtlAeWI0UZoaJwo4+w5rEDUUK7pLoiRskkXRabKxZixTCJJEiNp37H1JFYobErzRSmWzZcjLLocN8v10NIy5qZEOFu9lCPRaNQs0he0QJQchskjSAnRDliIquajRMgVNMCGbg2TH0a+NoFEkaIfcyO7Ac21KXLXoxhJYgIzM0T1hW95PJqk5NXQIEAYSKMLIuELNEImEg5KoKROLhQhQxVB9Gjht3ImyfpPbdw+RYGDgcJ0IydJ4KUajJtdl8UGGOoclpGqQqpP/7ksTnAFi6BvskmTzLI8GfFJMmgKsUIU2F0NW2u3kaOXEjqoNUy2hbo/PUEGEl9prxuisyrLNMKmKPnUCh03hayUdpqvFJFK2k6VaJejVbJSlRemRVNAYH5oDXwTqo2cJCBe7N4hLzDTmaU1Bo6yL4cIG4JHLaVU9ka1WsmUbcnBu+URa5kX6V2UgYWyzLQYRt41NRAIKERpHMM6ujLkiBQuNsWDUzDRVghhsmES+JhW+ZQkmm5gsjIBRCJXBjZyEsnGCrFDicqNQhA6ehJdZAWJ7Glr1Y4LLxmUsVoThEhLRYKKCl+YyhHWzcyZMBIknmhVvUIDC5sSnkYJyHyUkJDwiLlXoy678pBHG05ERdBKfRIZ4AJtQvFduRbCOJMiYRjbJE2VinV0gQGkKPFlIMpEwrNKNIQK0jeqetEfaaGCQaEw8whIW02yNBNIecb085CPLsNH3LJF7PzJHzisaaNvsqSRQgabNiJyZykL12/K2JJpkQsDpOT0zrNNZE/Gq2vXJMfKaGPOoGOYZ9XDIEy7SZSaJ6cM+l9dj0iBIoRGj/+5DE5gJYEgr6oyEwWzXBHwCTJZmm7BGzzKWkEFGEEQWFHFsecvUTr8MQVtw6NB6J9zYWZhxSL6O3npYqj4ThaKhrT00w8rPX7JE3yhXlNAqwrBDyaW5Mifi0GxEBkiBzMT2bAi7OgXcRhrTJhRS2h4Y48SSIYNkvnJobysABCBBEhJEDhrRhUqyfEMj5wD5jdIUfQrCBaYHgnzYJzbsueEwqCVDxCFaMwFhIYKlNCqhbiseMs0Jx0siFkBcjLq2eZOBpQgSDI8jVFSpomJyIYMPJCRDFyqJFs3hERIw8ZZLIioyWLilp5mLoXNgsGRSRNkZCuD8iJExBZAZQaJSMPqBwTKto0KjREyQgqgXB9xghZUbQxEkmGMYgzZ4dOIYKFpsxjKBCnFRQUSIUcJKLIaiKjYhioRBTWVyyShORsCgeigsqoTk4Wc2XY0YSWVRm5kcDpIKHHUJESrZVDAQBMQiQkOJiaChx5CmeQgkdWLvja7ShLahK9gcCRdXT5k+RrniByghsjoJS/RKdEMkL04iUciXLlOIjyj1mkx8cyg//+5LE5QBU0gz8AYTEQ3rB3uCTJwBinVzdV8aG6yenSDTR4iXYvn6YhUMioVBafPHcoR6w48YX+ChaO3jhFza/xUYwVfMiufIzmrK2hDEhExKuySmESBAiJLWUFzDSNx4qlR1IZTWZLoCYhaTPLnQPsQDrI8zbUzQYPQaV0wtKK3eyB8Ioyc82UARxopzzZQcJrRFCh9oqsnBlhMuXUOrwSmJ4DzWHERs4aJFLiQxBMc9orohSVaikRSlQazlHuZyyiJR9Shr6gNm5ODydEt1FYYkxTPVMnu3h2OZ1fkOedGqKR1F7MilWBG0Bpl08GGLU1G6gmW6NCgkhAaNMEwbO5XPOycyTErEddrPA6MIGzBLAiyIoY9wFmUbRs33jB8JrQOGMdgmt/FUl2jFDagXppIlhQXGhzyfirdxtUddkKk5N8HCrQRYnBXp0SUAYETI7emJA4FqmOSY7fVEkZbTVHOR3DtBQCi8lhKJpCSoUOKqAkfColrfaFn2hxEiLCp6GGoTgJMCp8amFSUshprrEyaGJETIkQqBIm2kMEWxxE+Ox//uSxOiAW2IO9qSxOUKsQZ+UZJrArY5KSxCKXeKGCJrFiaaFDAiRRVQwRbHFkJCKWBUTXALBlIm21WUgsSxjFVlYmXCzYpUDT4xQtCEMnCZcKhlhDBE9UUoVQqKpS1WBEaEIJE0kwqS1LVpFhU0s0qyVFLpbiJoqTXlSWRCpr2qQiklSFTyIEg00RE2xjJE1KWqsrYLYUNZYDBB7PVrHZY5MubBZWk40UKAxBNC4co4uLzs+Yz5snFxlPiRE4syN/p2fMZ82Wdv/8p2vc/zX+0a15Us//2WdndnjZp2z6pIiKAzIF6ZxvUZ6rVM2tTW1LlJJE7T2TK4b15fTB8lCbB3pxXsC7XkykV5rbmFFHafB7pleX25Soo9T0RanbIckFua2x/PXG9Wzjds03FjQZJc4zjOM4///x///q1bSyQoMkskskOAJTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7ksTsA5lODPADGTICysFTCDM+uVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=');

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

            let commentAuthor = comment.querySelector('.comment-header .user');
            commentAuthor = commentAuthor && commentAuthor.textContent?.trim();

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

      /* Disabled, because there is no more exact start & end date info => it has to be extracted from human friednly strings... :/ */
      /* Add calendar option */
      // if (location.pathname.match(/(promocje|kupony)\//)) {
      //   const dateToGoogleCalendarFormat = date => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
      //   const extractDealDateFromString = (str, time) => {
      //     if (!str) {
      //       return new Date();
      //     }
      //     let dateResult;
      //     const dateString = str.match(/\d+\/\d+\/\d+/);  // date in the format: 15/12/2019
      //     if (dateString) {
      //       const parts = dateString[0].split('/');
      //       dateResult = new Date(parts[2], parts[1] - 1, parts[0]);
      //     } else if (str.match(/jutro/i)) {
      //       dateResult = new Date();
      //       dateResult.setDate(dateResult.getDate() + 1);
      //       // } else if (str.match(/dzisiaj/i)) {
      //     } else {
      //       dateResult = new Date();
      //     }
      //     if (time) {
      //       time = time.split(':');
      //       dateResult.setHours(time[0], time[1], 0);
      //     }
      //     return dateResult;
      //   };
      //   const extractDealDates = () => {
      //     // const dateSpans = document.querySelectorAll('.cept-thread-content .border--color-borderGrey.bRad--a span');
      //     let start = document.querySelector('.cept-thread-content .border--color-borderGrey .icon--clock.text--color-green');
      //     start = extractDealDateFromString(start && start.parentNode.parentNode.textContent, '00:01');
      //     let end = document.querySelector('.cept-thread-content .border--color-borderGrey .icon--hourglass');
      //     end = extractDealDateFromString(end && end.parentNode.parentNode.textContent, '23:59');
      //     if (start >= end) {
      //       end.setTime(start.getTime());
      //       end.setDate(start.getDate() + 1);
      //     }
      //     return { start, end };
      //   };
      //   let dealTitle = document.querySelector('.thread-title--item');
      //   dealTitle = dealTitle && encodeURIComponent(dealTitle.textContent.trim());
      //   let dealDescription = document.querySelector('.cept-description-container');
      //   dealDescription = dealDescription && encodeURIComponent(`${location.href}<br><br>${dealDescription.innerHTML.trim()}`);
      //   let dealMerchant = document.querySelector('.cept-merchant-name');
      //   dealMerchant = dealMerchant && encodeURIComponent(dealMerchant.textContent.trim());
      //   const dealDates = extractDealDates();

      //   const timeFrameBox = document.querySelector('.cept-thread-content button');
      //   const calendarOptionLink = document.createElement('A');
      //   // calendarOptionLink.classList.add('btn', 'space--h-3', 'btn--mode-secondary');
      //   calendarOptionLink.classList.add('thread-userOptionLink');
      //   calendarOptionLink.style.cssFloat = 'right';
      //   calendarOptionLink.style.fontWeight = '900';
      //   calendarOptionLink.style.setProperty('margin-right', '7px', 'important');
      //   calendarOptionLink.target = '_blank';
      //   calendarOptionLink.href = `https://www.google.com/calendar/render?action=TEMPLATE&text=${dealTitle}&details=${dealDescription}&location=${dealMerchant}&dates=${dateToGoogleCalendarFormat(dealDates.start)}%2F${dateToGoogleCalendarFormat(dealDates.end)}`;
      //   const calendarOptionImg = document.createElement('IMG');
      //   calendarOptionImg.style.width = '18px';
      //   calendarOptionImg.style.height = '20px';
      //   calendarOptionImg.style.filter = `invert(${pepperTweakerConfig.darkThemeEnabled ? 77 : 28}%)`;
      //   calendarOptionImg.style.verticalAlign = 'middle';
      //   calendarOptionImg.classList.add('icon', 'space--mr-2');
      //   calendarOptionImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAABmJLR0QA/wD/AP+gvaeTAAABAklEQVRIid2WPQ6CMBSAPwx6CokH8Aj+DCYeQTdu4ClcrBdxdtLFGI16FPECJi4mOFDJi4FSlDL4koYC3+vXEtI+yI8LcDK8/5VPI9atEr4BtIAlEBnguKDl8VdAaQcqJzGrbxKZeOUDYcaM2sBZQ0HWpyjJh3mz3ejkANharKiQ98RynUajDkmtIl/0PUeOGP7x09mKTL/2o0qRKe42kF+MADD9uB8CM91f2c6o7C4NyXHwzuvajl9WNBY5ewv+a9FR5ExciUaCvwFNV6KD4OeWOaVFPcE+gY4r0U6wa0tJOr48j5xvqpF+0HcgGehrBNnFSdVtAUkppEhKo6oFabn1Ajsht5QbUQgDAAAAAElFTkSuQmCC';
      //   calendarOptionLink.appendChild(calendarOptionImg);
      //   const calendarOptionSpan = document.createElement('SPAN');
      //   calendarOptionSpan.classList.add('space--t-1');
      //   calendarOptionSpan.appendChild(document.createTextNode('Kalendarz'))
      //   calendarOptionLink.appendChild(calendarOptionSpan);
      //   timeFrameBox.parentNode.appendChild(calendarOptionLink);
      // }

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
          const threadArticle = document.querySelector('.thread');
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
        document.body.appendChild(searchButtonsWrapper);  // must add before computing position to get computed width: https://stackoverflow.com/questions/2921428/dom-element-width-before-appended-to-dom
        window.addEventListener('load', setSearchInterfacePosition);
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
    if (pepperTweakerConfig.pluginEnabled && ((location.pathname.length < 2) || location.pathname.match(/search|gor%C4%85ce|najgoretsze|dlaciebie|nowe|grupa|om%C3%B3wione|promocje|kupony[^\/]|dyskusji|profile|alerts/))) {

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

      /* List to grid update */
      const updateGridDeal = (dealNode) => {
        const vueString = dealNode?.querySelector('div[data-vue3]')?.dataset?.vue3;

        if (vueString) {
          const vueObject = JSON.parse(vueString);
          const threadObject = vueObject?.props?.thread;

          if (threadObject) {
            const dealHeader = dealNode.querySelector('.threadListCard-header');
            if (dealHeader !== null) {
              const nowDate = new Date();

              // startDate & endDate are in object format i.e.: { timestamp: 1740006060 }
              // publishedAt is defined just as an integer (timestamp)
              const dealStartDate = isInteger(threadObject.startDate?.timestamp) ? new Date(threadObject.startDate.timestamp * 1000) : null;
              const dealEndDate = isInteger(threadObject.endDate?.timestamp) ? new Date(threadObject.endDate.timestamp * 1000) : null;
              const dealPublishedAtDate = isInteger(threadObject.publishedAt) ? new Date(threadObject.publishedAt * 1000) : null;

              let date = null;
              let color = null;

              if (dealStartDate !== null && dealStartDate > nowDate) {
                date = dealStartDate;
                color = 'var(--textStatusInfo)';
              } else if (dealEndDate !== null && dealEndDate < nowDate) {
                date = dealEndDate;
                color = 'var(--textStatusNegative)';
              } else {
                date = dealPublishedAtDate;
                color = null;
              }

              if (date !== null) {
                const dealDateInfo = createDealDateInfo(date, color);
                dealHeader.append(dealDateInfo);
              }
            } else {
              console.error('Deal header not found (.threadListCard-header)');
            }

            const dealFooter = dealNode.querySelector('.threadListCard-footer');
            if (dealFooter !== null) {
              const userSpan = createUserSpanInfo(threadObject.user, threadObject.commentCount);
              dealFooter.prepend(userSpan);
            } else {
              console.error('Deal footer not found (.threadListCard-footer)');
            }
          } else {
            console.error('Extracting VUE object failed');
          }
        } else {
          console.error('VUE element not found in DOM');
        }
      }

      const createDealDateInfo = (date, color = null) => {
        const mainContainer = document.createElement('DIV');
        mainContainer.classList.add('color--text-TranslucentSecondary');
        mainContainer.style.cssFloat = 'right';
        if (color) mainContainer.style.color = color;

        const labelContainer = document.createElement('DIV');
        labelContainer.style.display = 'grid';
        labelContainer.style.cssFloat = 'right';

        const timeDateInfo = createDealDateInfoString(date);

        const timeLabelSpan = document.createElement('SPAN');
        timeLabelSpan.style.fontSize = '0.85em';
        timeLabelSpan.style.lineHeight = '1.2em';

        const timeLabelText = document.createTextNode(timeDateInfo.time);
        timeLabelSpan.appendChild(timeLabelText);

        const dateLabelSpan = document.createElement('SPAN');
        dateLabelSpan.style.fontSize = '0.85em';
        dateLabelSpan.style.lineHeight = '1.2em';

        const dateLabelText = document.createTextNode(timeDateInfo.date);
        dateLabelSpan.appendChild(dateLabelText);

        labelContainer.append(timeLabelSpan, dateLabelSpan);
        mainContainer.append(labelContainer);

        return mainContainer;
      };

      const createDealDateInfoString = (date) => {
        const hours = zeroPad(date.getHours());
        const minutes = zeroPad(date.getMinutes());
        const seconds = zeroPad(date.getSeconds());
        const month = zeroPad(date.getMonth() + 1); // months starting from 0
        const day = zeroPad(date.getDate());
        const year = zeroPad(date.getFullYear().toString().substr(-2));

        return {
          time: `${hours}:${minutes}:${seconds}`,
          date: `${day}/${month}/${year}`,
        };
      }

      const createUserSpanInfo = (userObject, commentCount = 0) => {
        const containerSpan = document.createElement('SPAN');
        containerSpan.classList.add('color--text-TranslucentSecondary', 'overflow--wrap-off', 'gap--h-1', 'flex', 'boxAlign-ai--all-c');
        // Add some overlay to longer labels
        containerSpan.style['-webkit-mask-image'] = 'linear-gradient(90deg, #000 85%, transparent)';

        // Computing the width of the container based on comments count
        let containerWidth = '108px';
        if (commentCount >= 10 && commentCount <= 99) {
          containerWidth = '100px'
        } else if (commentCount >= 100 && commentCount <= 999) {
          containerWidth = '93px'
        } else if (commentCount >= 1000 && commentCount <= 9999) {
          containerWidth = '85px'
        } else if (commentCount >= 10000 && commentCount <= 99999) {
          containerWidth = '77px'
        }

        containerSpan.style.width = containerWidth;

        const avatarImg = document.createElement('IMG');
        avatarImg.classList.add('size--all-s', 'size--fromW3-m', 'avatar--type-xs', 'img', 'img--type-entity', 'img--square-s');

        // Set an user avatar if present, otherwise set the default Pepper avatar
        if (userObject.avatar && userObject.avatar.path && userObject.avatar.name) {
          avatarImg.src = `https://static.pepper.pl/${userObject.avatar.path}/${userObject.avatar.name}/fi/60x60/qt/45/${userObject.avatar.name}.jpg`;
        } else {
          avatarImg.src = '/assets/img/profile-placeholder_09382.png';
        }

        avatarImg.srcset = avatarImg.src;

        const labelSpan = document.createElement('SPAN');
        labelSpan.classList.add('overflow--ellipsis', 'size--all-xs', 'size--fromW3-s');
        labelSpan.style.textOverflow = 'unset';

        const labelText = document.createTextNode(userObject.username);

        labelSpan.appendChild(labelText);

        containerSpan.append(avatarImg, labelSpan);

        return containerSpan;
      }
      /* END: List to grid update */

      let dealCount = 0;
      const startPage = Number((new URLSearchParams(location.search)).get('page') || 1);
      const getVerticalScrollPercentage = (node) => (node.scrollTop || node.parentNode.scrollTop) / (node.parentNode.scrollHeight - node.parentNode.clientHeight ) * 100;
      const rescale = (v, rMin, rMax, tMin, tMax) => ((v - rMin) / (rMax - rMin)) * (tMax - tMin) + tMin;
      const updatePagination = () => {
        const pageSize = window?.__INITIAL_STATE__?.pagination?.pageSize ?? 30;

        if (dealCount % pageSize === 0) {
          const position = getVerticalScrollPercentage(document.body);
          const currentPage = startPage - 1 + Math.round(rescale((dealCount / pageSize) * (position / 100), 0, 10, 1, 10));

          const searchParams = new URLSearchParams(location.search);
          if (searchParams.get('page') != currentPage) {
            searchParams.set('page', currentPage);
            const newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
            history.replaceState(null, '', newRelativePathQuery);

            // const pagination = document.getElementById('pagination');
            // const paginationPageText = pagination?.querySelector('.pagination-page .hide--toW2');
            // if (paginationPageText) {
            //   paginationPageText.textContent = paginationPageText.textContent.replace(/\d+/, currentPage);
            // }
            // const nextButton = pagination?.querySelector('.cept-next-page button');
            // if (nextButton) {
            //   nextButton.dataset.pagination = nextButton.dataset.pagination.replace(/\d+/, currentPage + 1);
            // }
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
            // threadImage.dataset.lightbox = `{"images":[{"width":640,"height":474,"unattached":"","uid":"","url":"${threadImage.src.replace('thread_large', 'thread_full_screen')}"}]}`;
            // image links have beed changed:
            // threadImage.src.replace(/\/re.*/, '.jpg') => original image
            // threadImage.src.replace('300x300/qt/60', '768x768/qt/90') => scaled image to 768x768 with 90 quality (original scale: 300x300 / 60)
            // there are other sizes too: 1024x1024, 1200x1200 (more?)
            threadImage.dataset.lightbox = `{"images":[{"width":640,"height":474,"unattached":"","uid":"","url":"${threadImage.src.replace('300x300/qt/60', '768x768/qt/90')}"}]}`;

            // remove go to the thread behavior after clicking
            try {
              const dataHistory = JSON.parse(element.dataset.history);
              dataHistory.delegate = undefined;
              dataHistory.endpoint = undefined;
              element.dataset.history = JSON.stringify(dataHistory);
            } catch { }
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

          // Apparently some info has been moved/copied to the "ThreadMainListItemNormalizer" Vue object
          // Becuase the object has to be parsed to find merchant info, it will be faster to get some other info from this object too instead of parsing DOM (e.g. for deal title)
          // Some properties are still missing though (e.g. description, user)
          const threadVueString = element?.querySelector('div[data-vue3]')?.dataset?.vue3;
          const threadVueObject = threadVueString ? JSON.parse(threadVueString)?.props?.thread : undefined;

          const title = threadVueObject?.title ?? element.querySelector('.cept-tt')?.textContent?.trim();;

          const description = element.querySelector('.userHtml-content div')?.textContent?.trim();

          // no more merchant info in the innerHTML property of the thread element => using Vue object instead
          const merchant = threadVueObject?.merchant?.merchantName;

          const user = threadVueObject?.user?.username ?? element.querySelector('span.thread-user')?.textContent?.trim();

          const price = threadVueObject?.price;
          let discount = undefined;

          if (price !== null && price > 0) {
            const nextBestPrice = threadVueObject?.nextBestPrice;
            if (nextBestPrice !== null && nextBestPrice > price) {
              discount = (nextBestPrice - price) / nextBestPrice * 100;
            }
          }

          const local = threadVueObject?.isLocal;

          /**
           * Extracts the groups list from the provided HTML document.
           * @param {Document} htmlDoc - The HTML document to extract the groups list from.
           * @returns {Array<string>} - The list of group names found in the HTML document.
           */
          const getGroupsListFromDocument = (htmlDoc) => {
            try {
              // Get all script elements in the document
              const scriptElements = htmlDoc.getElementsByTagName('script');

              // Iterate through the script elements
              for (const scriptElement of scriptElements) {
                const content = scriptElement.textContent;

                // Attempt to match the content against the regex
                const match = content.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/);

                // If there's no match or the match doesn't contain the JSON object, move to the next script element
                if (!match || !match[1]) {
                  continue;
                }

                // Parse the JSON object from the matched string
                const initialState = JSON.parse(match[1]);

                // Extract the groups list from the initialState object and return it
                return initialState.threadDetail?.groupsPath?.map(({ threadGroupName }) => threadGroupName) || [];
              }
            } catch (error) {
              // Log an error message if something goes wrong during processing
              console.error('An error occurred while processing the page:', error);
              return [];
            }
            // Return an empty array if no matching elements were found
            return [];
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
                const groups = getGroupsListFromDocument(htmlDoc);

                // After Pepper developers changes there is no more such info preloaded in HTML
                // => window.__INITIAL_STATE__ must be used instead, but isLocol is a property of threadVueObject too
                // const merchantIcon = htmlDoc.documentElement.querySelector('*[id^="thread"] .threadItem-content svg.icon--merchant');
                // const local = merchantIcon !== null && merchantIcon.parentNode.parentNode.textContent.search(/Ogólnopolska/i) < 0;

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
      const dealsSection = document.querySelector(dealsSectionSelector = '.js-threadList') || document.querySelector(dealsSectionSelector = '#toc-target-deals .js-threadList') || document.querySelector(dealsSectionSelector = '#toc-target-deals') || document.querySelector(dealsSectionSelector = '.listLayout') || document.querySelector(dealsSectionSelector = '.listLayout-scrollBox') || document.querySelector(dealsSectionSelector = '#tab-feed');
      // cannot combine as one selector => div.gridLayout appears before section.gridLayout on the main page
      const isGridLayout = dealsSectionSelector.indexOf('gridLayout') >= 0;

      // local is no more needed to be parsed from HTML doc => using Vue object instead
      // const deepSearch = pepperTweakerConfig.dealsFilters.findIndex(filter => (filter.active !== false) && (filter.groups || (filter.local === true))) >= 0;
      const deepSearch = pepperTweakerConfig.dealsFilters.findIndex(filter => (filter.active !== false) && filter.groups) >= 0;

      if (dealsSection) {

        if (!location.pathname.includes("dyskusji")) {
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
        }
        /* END: Deals Filtering */

        /* List to Grid */
        if (pepperTweakerConfig.improvements.listToGrid && !isGridLayout) {
          const sideWidgets = document.querySelectorAll('.listLayout-side .listLayout-box');
          const sideWidgetsWidth = Array.from(sideWidgets).map((widget) => parseFloat(window.getComputedStyle(widget).width));
          let sideContainerWidth;
          if (location.pathname.match(/\/search|\/grupa/))
            sideContainerWidth = 304;
          else
            sideContainerWidth = sideWidgetsWidth.reduce((acc, cur) => acc || (isNumeric(cur) && cur > 0), false) ? 234 : 0;
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
            dealsSection.style.gridTemplateColumns = `repeat(${gridColumnCount}, ${columnWidth}px)`;

            if (location.pathname.indexOf('/alerts') < 0) {
              const gridMarginLeft = (document.querySelector('.tabbedInterface') != null) ? 0 : Math.floor((gridMaxWidth - gridColumnCount * (columnWidth + gridGapWidth)) / 2);
              dealsSection.style.setProperty('margin-left', `${gridMarginLeft}px`, 'important');
              // id="listingOptionsPortal" => the search sort option with the number of deals found
              document.getElementById('listingOptionsPortal')?.style.setProperty('margin-left', `${gridMarginLeft}px`, 'important');
            }
          }

          updateGridView();
          window.addEventListener('resize', updateGridView);

          const styleNode = document.createElement('style');
          const styleText = document.createTextNode(`
            .listLayout-box.bg--color-brandPrimaryPale {
              grid-column: 1 / -1;
            }
            .threadGrid-headerMeta, .threadListCard-header {
              grid-column: 1;
              grid-row: 1;
              -ms-grid-row-span: 1;
            }
            .cept-meta-ribbon .icon--clock.text--color-green, .cept-meta-ribbon .icon--clock.text--color-green ~ span[class^="hide--"],  /* deal starts */
            .cept-meta-ribbon .icon--hourglass, .cept-meta-ribbon .icon--hourglass ~ span[class^="hide--"],  /* deal ends */
            .cept-meta-ribbon .icon--location, .cept-meta-ribbon .icon--location ~ span[class^="hide--"],    /* local deal */
            .cept-meta-ribbon .icon--world, .cept-meta-ribbon .icon--world ~ span[class^="hide--"],          /* delievery */
            .vote-box .cept-show-expired-threads,  /* deal ended text */
            .vote-box span[class^="hide--"],  /* discussion ended text */
            .threadGrid-headerMeta > div > div:not(.vote-box) button,  /* three dots button, covering deal starting date */
            #exploreMoreRelatedWidget, #exploreMoreTopWidgetPortal,  /* explore more widget */
            #incontentFuseZonePortal, #incontent1FuseZonePortal, #incontent2FuseZonePortal, #incontent3FuseZonePortal, #incontent4FuseZonePortal, #inListing1AdSlotPortal, #inListing2AdSlotPortal, #inListing3AdSlotPortal, /* empty tiles on a search page */
            #groupHottestWidgetPortal,  /* hottests deals widget on the category subpage */
            #rlpBannerPortal,  /* link to a voucher subpage on a merchant search page */
            .js-threadList > div:not([class]):not([id]) { /* empty tiles on category subpages */
              display: none;
            }
            .cept-meta-ribbon .icon--refresh {
              margin-right: .35em !important;
            }
            /* Deal added / start / ends etc. */
            .threadListCard-header { /* move the "chip" element to a new line */
              padding-top: 0.8em;
            }
            .chip--type-info, .chip--type-default, .chip--type-warning, .chip--type-expired { /* hide original time info */
              display: none;
            }
            /* END: Deal added / start / ends etc. */
            /* Smaller vote box */
            .cept-vote-box button[data-track*="vote"] {
              padding-left: .28em !important;
              padding-right: .28em !important;
            }
            /* OLD CLASS => Save to delete?
            .threadGrid-image {
              grid-row-start: 2;
              grid-row-end: 4;
              -ms-grid-row-span: 3;
              grid-column: 1;
              width: 196px !important;
              padding: 0.35em 0 0.65em 0 !important;
            }
            */
            .threadListCard-image {
              grid-row-start: 2;
              grid-row-end: 4;
              -ms-grid-row-span: 3;
              grid-column: 1;
              width: 196px !important;
              padding: 0.25em 0 0.2em 0 !important;
              margin: 8px auto 0;
            }
            .threadListCard-image .thread-image {
              max-width: 100%;
              max-height: 100%;
            }
            .thread-listImgCell, .thread-listImgCell--medium {
              width: 100%;
            }
            /* OLD CLASS => Required for discution subpage */
            .threadGrid-title {
              grid-column: 1;
              grid-row-start: 5;
              grid-row-end: 6;
              width: 196px !important;
            }
            .threadGrid-title .thread-title, .threadListCard-body .thread-title {
              padding-top: 0.2em;
              height: 3.1em !important;
              display: inline-block !important;
            }
            .threadGrid-title .overflow--fade {
              height: 1.9em;
            }
            .threadListCard-body .flex--wrap { /* disable wrapping of the price + delivery (etc.) line */
              flex-wrap: nowrap;
            }
            /* OLD CLASS => Required for discution subpage */
            .threadGrid-body {
              grid-column: 1;
              -ms-grid-column-span: 1;
              grid-row: 7;
              padding-top: .28571em !important;
              height: 4.1em;
              text-overflow: ellipsis;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
            }
            .threadListCard-body {
              grid-column: 1;
              -ms-grid-column-span: 1;
              grid-row: 7;
              padding-top: .28571em !important;
              height: 8.8em;
              text-overflow: ellipsis;
              overflow: hidden;
              font-size: 1rem !important;
              line-height: 1.5rem !important;
              --line-height: 1.5rem !important;
            }
            /* For non-Safari browsers */
            @supports not (-webkit-hyphens:none) {
              .threadListCard-body {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
              }
            }
            @media (min-width: 48em) {
              .threadListCard-body {
                margin: 0.2em 0 0.1em;
              }
            }
            .threadListCard-body div.flex {
              height: 1.7em;
            }
            /* Hide the updete box in discussion tiles */
            .thread--discussion .thread-updates-top {
              display: none;
            }
            /* TODO: Move user info to the footer */
            .threadListCard-body div.flex div.flex--inline + span,
            .threadListCard-body .thread-price + span {
              display: none !important;
            }
            .threadListCard-body .userHtml-content { /* remove ellipse text overflow in the middle of a deal description */
              display: inline-block;
            }
            .userHtml-content .size--fromW3-m, .userHtml-content .hide--toW3 { /* add more space between deal description lines */
              line-height: 1.1rem !important;
              --line-height: 1.1rem !important;
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
            .userHtml-content .size--fromW3-m, .userHtml-content .hide--toW3 {
              line-height: 1.05rem;
              --line-height: 1.05rem;
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
            /* Voucher buttons */
            .threadListCard-footer .threadListCard-footer-action { /* Limit the width of a footer */
              width: 100%;
            }
            .threadListCard-footer .voucher .buttonWithCode-button { /* Allow smaller width of a button */
              width: 2.5rem;
              min-width: 2.5rem;
            }
            .threadListCard-footer .voucher .buttonWithCode-button span { /* Hide button text (left only an icon) */
              font-size: 0;
            }
            .threadListCard-footer .voucher .buttonWithCode-code { /* Center the text of a voucher code */
              margin: 0 auto;
              padding-left: 1.25em !important;
              text-align: center;
            }
            .threadListCard-footer .voucher .color--text-StatusPositive span, /* Hide the defualt long text when clicking the vouvher button */
            .threadListCard-footer .voucher .color--text-TranslucentSecondary span {
              display: none;
            }
            .threadListCard-footer .voucher .color--text-StatusPositive:after, /* Replace the default text with short message */
            .threadListCard-footer .voucher .color--text-TranslucentSecondary:after {
              content: "Skopiowano";
            }
            /* END: Voucher buttons */
            /* Comments, share & bookmark button + user info section */
            .threadListCard-footer .button[data-t="shareBtn"] {
              display: none;
            }
            .threadListCard-footer .button[data-t="addBookmark"],
            .threadListCard-footer .button[data-t="removeBookmark"] {
              order: -1; /* set as the second in a row */
            }
            .threadListCard-footer span:has(> img[src*="/users/"], > img[src*="profile-placeholder"]) {
              order: -2; /* set as the first in a row */
            }
            /* END: Comments & share button */

            /* Hide original user info, local deal info, merchant info etc. */
            .threadListCard-body span:has(> img[src*="/users/"], > img[src*="profile-placeholder"]),
            .threadListCard-body span:has(> a[data-t="merchantLink"]),
            .threadListCard-body span.overflow--ellipsis:has(> span:not([class])), /* merchant info without a link */
            .threadListCard-body div:has(> svg.icon--location) { /* local deal info */
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
            .threadGrid-footerMeta, .threadListCard-footer {
              grid-column: 1;
              -ms-grid-column-span: 1;
              grid-row: 8;
              padding-top: 0.25em !important;
            }
            .threadGrid-footerMeta { /* needed for discutions */
              width: 196px !important;
            }
            .threadGrid-footerMeta .footerMeta.fGrid, .threadListCard-footer {
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
            /* .threadGrid-footerMeta .cept-off {
              display: none;
            } */
            #toc-target-deals .listLayout-side {
              position: absolute !important;
              right: 0;
              top: 0;
            }
            /* max-height trims the height of the widget
            #toc-target-deals .listLayout-side > div, .card--type-vertical {
              min-height: 500px;
              max-height: 500px;
            }
            */
            /* this hides some "get deal" buttons
            .footerMeta .iGrid-item.width--all-12.width--fromW3-auto.space--l-0.space--fromW3-l-2.space--t-2.space--fromW3-t-0.hide--empty {
              display: none;
            }
            */
            .js-pagi-top {  /* hiding top pagination */
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
            .size--all-l, .size--all-xl {
              font-size: 1rem !important;
              /* line-height: 1.5rem !important; */
            }
            .listLayout-main > div:empty {
              display: none;
            }
            /* Alert page */
            .flex--expand-v .page-content.page-center {
              max-width: 100%;
            }
            .tabbedInterface-tabs {
              width: 60em;
              margin-left: auto;
              margin-right: auto;
            }
            #tab-manage {
              width: 60em; /* TODO: for some reason alert manage tab doesn't keep width set in the '.tabbedInterface-tabs' class */
            }
            /* END: Alert page */
            /* "Your new tab..." div on "For You" subpage */
            /* id="listingOptionsPortal" => the search sort option with the number of deals found */
            .listLayout-main > div:not([class]):not([id="listingOptionsPortal"]) {
              display: none;
            }
            /* END */
            /* Weird empty space as the first tile on the alert subpage */
            #threadMainListPortal {
              display: none;
            }
            /* END */
            /* Hidding some promo deals with a different class "threadListCard" */
            /* Now all deals have the ".threadListCard" class
            article.thread:has(> .threadListCard) {
              display: none !important;
            } */
            /* END */
            /* Hidding some deal meta ribbons */
            .threadGrid-headerMeta .metaRibbon:not(:has(svg.icon--clock, svg.icon--refresh, svg.icon--flame)) {
              display: none !important;
            }
            /* END */
            /* Hiding dilivery cost with an icon */
            .threadGrid-title span.color--text-TranslucentSecondary:has(svg.icon--truck),
            .threadListCard-body span.color--text-TranslucentSecondary:has(svg.icon--truck) {
              display: none;
            }
            /* END */
            /* Hiding the "ended" text when deal is expired */
            .thread--expired span:has(> svg.icon--hourglass) span {
              display: none !important;
            }
            /* END */
          `);
          styleNode.appendChild(styleText);
          document.head.appendChild(styleNode);
        }
        /* END: List to Grid */

        /* Auto Update */
        if (!location.pathname.match(/\/search|\/alerts|\/profile/)) {

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
          if (subNavMenu) {
            subNavMenu.parentNode.insertBefore(autoUpdateCheckbox, subNavMenu);
          }
        }
      }

    }
    /*** END: Deals List ***/
  }
  /*** END: startPepperTweaker() ***/

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // call on next available tick
    setTimeout(startPepperTweaker, 1);
  } else {
    document.addEventListener('DOMContentLoaded', startPepperTweaker);
  }

  /***** END: RUN AFTER DOCUMENT HAS BEEN LOADED *****/

})();
