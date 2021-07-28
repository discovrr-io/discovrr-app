import {
  ActionSheetIOS,
  Alert,
  Linking,
} from 'react-native';

// import URL from 'url-parse';

// import { strings } from '../translations/i18n';
import {
  // alphaKeyz,
  // betaKeyz,
  // appLinking,
  isAndroid,
} from './Constants';

import {
// blockDialogues,
// unblockDialogues,
// changeDeepLinkingContent,
// changeCampaignSummaryContent,
} from './Actions';

// const merchantSources = { 1: 'merchantApp', 2: 'qrCode', 3: 'website' };

const failedAction = (type) => {
  let message = '';
  switch (type) {
    case 'googlemaps':
      // message = strings('bodyNoGoogleMaps');
      message = 'Google Maps is not installed on this device.';
      break;
    case 'applemaps':
      // message = strings('bodyNoAppleMaps');
      break;
    case 'mapping':
      // message = strings('bodyNoMappingApp');
      message = 'Apple Maps is not installed on this device.';
      break;
    case 'dialer':
      // message = strings('bodyNoDialer');
      message = 'No phone dialer application found on this device.';
      break;
    default:
  }

  Alert.alert(
    'Action Failed!', // strings('titleFailedAction'),
    message,
    [
      {
        text: 'CLOSE', // strings('actionClose'),
        onPress: () => {},
        style: 'ok',
      },
    ],
  );
};

const showActionSheet = (address, mapApps, label) => {
  ActionSheetIOS.showActionSheetWithOptions(
    { options: mapApps, cancelButtonIndex: 2, tintColor: '#555555' },
    (index) => {
      if (index !== 2) {
        if (index === 0) {
          linkToAppleMapsIOS(address, label);
        } else if (index === 1) {
          linkToGoogleMapsIOS(address);
        }
      }
    },
  );
};

const linkToAppleMapsIOS = (address, label) => {
  const addressURL = label ? `http://maps.apple.com/?ll=${address}&q=${label}` : `http://maps.apple.com/?q=${address}`;
  Linking.canOpenURL(addressURL)
    .then((supported) => {
      if (supported) {
        Linking.openURL(addressURL);
      } else {
        failedAction('applemaps');
      }
    });
};

const linkToGoogleMapsIOS = (address) => {
  const addressURL = `comgooglemaps://?q=${address}&center=0,0`;
  Linking.canOpenURL(addressURL)
    .then((supported) => {
      if (supported) {
        Linking.openURL(addressURL);
      } else {
        failedAction('googlemaps');
      }
    });
};

export const showOnMap = async (linkingURI, name, label) => {
  let address = '';
  if (linkingURI && linkingURI.trim()) {
    address = linkingURI.trim();
  } else if (name && name.trim()) {
    address = name.trim();
  } else {
    return;
  }

  if (isAndroid) {
    const addressURL = label ? `geo:0,0?q=${address}(${label})` : `geo:0,0?q=${address}`;
    Linking.canOpenURL(addressURL)
      .then((supported) => {
        if (supported) {
          Linking.openURL(addressURL);
        } else {
          failedAction('mapping');
        }
      });
  } else {
    let mapApps = null;

    const hasGoogleMaps = await canOpenAppLink('comgooglemaps://center=0,0?q=gosmac');

    if (hasGoogleMaps) mapApps = ['Apple Maps', 'Google Maps', 'Cancel']; // strings('actionCancel')

    if (mapApps) {
      showActionSheet(address, mapApps, label);
    } else {
      linkToAppleMapsIOS(address, label);
    }
  }
};

// const requestAppLinking = (url, app, appIsInstalled) => {
//   if (appIsInstalled) {
//     Alert.alert(
//       (app === 'goMOORE' ? strings('titleOpenInGoMOORE') : strings('titleOpenInGoREWARD')),
//       (app === 'goMOORE' ? strings('bodyOpenInGoMOORE') : strings('bodyOpenInGoREWARD')),
//       [
//         { text: strings('actionDismiss'), onPress: () => {}, style: 'ok' },
//         { text: strings('actionYES'), onPress: () => appDeepLinking(url, app, 'open'), style: 'ok' },
//       ],
//       { cancelable: false },
//     );
//   } else {
//     Alert.alert(
//       '',
//       (app === 'goMOORE' ? strings('bodyDownloadGoMOORE') : strings('bodyDownloadGoREWARD')),
//       [
//         { text: strings('actionNoThanks'), onPress: () => {}, style: 'ok' },
//         { text: strings('actionYES'), onPress: () => appDeepLinking(url, app, 'open'), style: 'ok' },
//       ],
//       { cancelable: false },
//     );
//   }
// };

// export const appDeepLinking = (path, app, action) => {
//   const appScheme = appLinking[app].scheme;
//   Linking.canOpenURL(appScheme)
//     .then((supported) => {
//       if (supported) {
//         if (action === 'request') {
//           requestAppLinking(path, app, true);
//         } else {
//           Linking.openURL(`${appScheme}${path}`);
//         }
//       } else if (action === 'request') {
//         requestAppLinking(path, app, false);
//       } else {
//         const downloadLink = isAndroid ? appLinking[app].store.android : appLinking[app].store.ios;
//         Linking.openURL(downloadLink);
//       }
//     })
//     .catch(() => {});
// };

export const canOpenAppLink = async (appScheme) => {
  let canOpen = false;
  await Linking.canOpenURL(appScheme)
    .then((supported) => { canOpen = supported; })
    .catch(() => {});

  return canOpen;
};

export const callNumber = (phoneNumber) => {
  if (phoneNumber) {
    const numberURL = `tel:${phoneNumber}`;

    Linking.canOpenURL(numberURL)
      .then((supported) => {
        if (supported) {
          Linking.openURL(numberURL)
            .catch(() => {});
        } else {
          failedAction('dialer');
        }
      })
      .catch(() => {});
  }
};

export const openExternalLink = (link, type) => {
  if (link) {
    let url = link;

    if (type) {
      switch (type) {
        case 'email':
          url = `mailto:${link}`;
          break;
        case 'video':
          if (!isAndroid && link.match(/youtube.com|youtu.be/)) {
            url = `youtube://${link.replace(/.+?(?=y)/, '')}`;
          }
          break;
        default:
      }
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else if (!isAndroid && type === 'video') { // youtube isn't installed...use broswer
          Linking.openURL(link);
        }
      })
      .catch(() => {});
  }
};

// const notifyOfLinkingError = ({ isNotLoogedIn }) => {
//   requestAnimationFrame(() => {
//     Alert.alert(
//       strings('titleOops'),
//       isNotLoogedIn ? strings('bodyNotLoggedIn') : strings('bodyInvalidLink'),
//       [{ text: strings('actionOK'), onPress: () => {} }],
//       { cancelable: false },
//     );
//   });
// };

// export const verifySessionStatus = ({ isDeepLink, data }) => (dispatch, getState) => {
//   if (getState().userState.isLoggedIn === 'signedIn') {
//     if (isDeepLink) {
//       dispatch(deepLinkToContent(data));
//     } else {
//       dispatch(showLinkedContent(data));
//     }
//   } else if (isAndroid) {
//     notifyOfLinkingError({ isNotLoogedIn: true });
//   }
// };

// export const showLinkedContent = content => (dispatch, getState) => {
//   const { isShowingCampaignSummary, isShowingDeepLinkingContent } = getState().networkState;
//   const { rootNavigate } = getState().appContext;
//   const data = content;
//
//   switch (data.type) {
//     case '0':
//       requestAnimationFrame(() => {
//         dispatch(blockDialogues());
//         Alert.alert(
//           data.header,
//           data.msg,
//           [{ text: strings('actionClose'), onPress: () => dispatch(unblockDialogues()) }],
//           { cancelable: false },
//         );
//       });
//       break;
//     case '5':
//       if (!isShowingCampaignSummary) {
//         rootNavigate('CampaignSummaryScreen', { data, title: 'Campaigns' });
//       } else {
//         dispatch(changeCampaignSummaryContent(true, data, 'Campaigns'));
//       }
//       break;
//     case 'survey':
//       rootNavigate('SurveyScreen', { ...data, isFromLinking: false });
//       break;
//     default:
//       if (data.type) {
//         if (data.action === 'nr') data.altPath = true;
//
//         requestAnimationFrame(() => {
//           if (data.altPath) {
//             rootNavigate('DeepLinkingScreen', { data });
//           } else {
//             rootNavigate('MembersDealModalScreen', { data, title: data.title || strings('headingRewardCard') });
//           }
//         });
//       } else if (!isShowingDeepLinkingContent) {
//         rootNavigate('DeepLinkingScreen', { data });
//       } else {
//         dispatch(changeDeepLinkingContent(true, data));
//       }
//   }
// };

// export const deepLinkToContent = link => (dispatch, getState) => {
//   if (getState().userState.isLoggedIn === 'signedIn') {
//     if (link) {
//       try {
//         let isgoREWARDShare = false;
//         let isCardShare = false;
//         let isPromoShare = false;
//         const urlLink = link.url ? link.url : link;
//         const deepLinkLURL = new URL(urlLink);
//         const path = deepLinkLURL.pathname.toLowerCase();
//
//         if (path === '/app/' || path === '/app') return;
//
//         const hostname = deepLinkLURL.hostname.replace(/www./, '').toLowerCase();
//         const isgoREWARDHost = hostname === 'go-reward.com' || hostname === 'app.go-reward.com';
//         const isCorrectRootPath = hostname === 'app.go-reward.com' ? true : path.substring(0, 5) === '/app/';
//         if (isgoREWARDHost && isCorrectRootPath) {
//           const destination = path.substring(0, path.lastIndexOf('/') + 1);
//           const queryParams = path.substring(path.lastIndexOf('/') + 1);
//           let data = null;
//
//           if (link.skip) {
//             data = { type: link.type, id: link.id };
//           } else {
//             switch (destination) {
//               case '/app/survey/': {
//                 const key = queryParams.substring(0, 1);
//                 const payload = queryParams.substr(1).split('').map(char => betaKeyz[key].from[char]).join('');
//                 const [id, merchantID, sharerID] = payload.split('-');
//                 data = { id, merchantID, sharerID, type: 'survey', level: 3, headerTitle: 'Survey' };
//                 break;
//               }
//               case '/app/ck/': {
//                 const ids = queryParams.split('-');
//                 const [id, bundleCode] = ids;
//                 data = { type: 'ck', id, level: 3, bundleCode, title: 'Check-in' }; // addTranslation
//                 break;
//               }
//               case '/app/dm/': {
//                 const ids = queryParams.split('-');
//                 const [id, bundleCode] = ids;
//                 data = { type: 'dm', id, level: 3, bundleCode, title: strings('headingPromotions') };
//                 break;
//               }
//               case '/app/mr/': {
//                 const codex = queryParams.split('-');
//                 if (codex.length > 1) {
//                   const [id, sharer, source] = codex;
//                   data = { type: 'loyalty', id, sharer, level: 3, action: 'mr', payload: queryParams }; // testdisenjaga ma
//                   if (source && sharer === id) data.source = merchantSources[source];
//                 } else {
//                   data = { type: 'loyalty', id: queryParams, level: 3 };
//                 }
//                 break;
//               }
//               case '/app/nr/':
//                 data = { type: queryParams.substring(0, 1), id: queryParams.substring(1), level: 3, altPath: true };
//                 break;
//               case '/app/rp/':
//               case '/app/rw/':
//                 data = { type: 'rewards', id: queryParams, level: 3, title: strings('headingRewards') };
//                 break;
//               case '/app/sr/':
//                 data = { type: 'survey', id: queryParams, level: 3 };
//                 break;
//               case '/app/tk/': {
//                 const key = queryParams.substring(0, 1);
//                 const payload = queryParams.substring(1).split('').map(char => alphaKeyz[key].from[char]).join('');
//                 const codex = payload.split('-');
//
//                 if (Array.isArray(codex) && codex.length === 3 && codex.every(x => Number(x))) {
//                   const [issuingNumber, numberOfTickets, timeStamp] = codex;
//                   data = { numberOfTickets, issuingNumber, timeStamp, type: 'voteTicket', level: 2 };
//                 } else {
//                   const error = { message: 'something is wrong' };
//                   throw error;//
//                 }
//                 break;
//               }
//               default: {
//                 let isOldEncoding = true;
//                 const key = queryParams.substring(0, 1);
//
//                 if (Object.prototype.hasOwnProperty.call(betaKeyz, key)) isOldEncoding = false;
//
//                 const linkedType = (isOldEncoding ? alphaKeyz : betaKeyz)[key].from[queryParams.substring(1, 2)].toString();
//                 const payload = queryParams.substring(2).split('').map(char => (isOldEncoding ? alphaKeyz : betaKeyz)[key].from[char]).join('');
//                 const codex = payload.split('-');
//
//                 if (linkedType === '9') {
//                   return;
//                 } else if (linkedType === '5') {
//                   isPromoShare = true;
//                   const [id, bundleCode, sharer] = codex;
//                   data = { type: 'dm', bundleCode, id, payload, sharer, level: 2, action: 'dm' };
//                   data.title = strings('headingPromotions');
//                 } else if (linkedType === '4') {
//                   isCardShare = true;
//                   const [id, sharer, source] = codex;
//                   data = { type: 'loyalty', id, sharer, level: 2, action: 'mr', payload: path.substring(5) };
//                   if (source && sharer === id) data.source = merchantSources[source];
//                 } else {
//                   isCardShare = linkedType === '4';
//                   isgoREWARDShare = !isCardShare;
//                   data = {
//                     altPath: isgoREWARDShare,
//                     type: linkedType === '4' ? 'loyalty' : linkedType,
//                     id: codex[0],
//                     mID: codex[1],
//                     sharer: codex[2],
//                     level: 2,
//                   };
//
//                   if (linkedType === '8') data.type = 'marketplaceItem';
//                 }
//               }
//             }
//           }
//
//           if (data.type === 'marketplaceItem') {
//             data.action = 'mp';
//             data.payload = queryParams;
//           } else if (!isCardShare && !isPromoShare) {
//             data.action = isgoREWARDShare ? 'nr' : path.substring(5, 7);
//             data.payload = queryParams;
//           }
//
//           data.urlLink = urlLink;
//
//           dispatch(showLinkedContent(data));
//         } else {
//           notifyOfLinkingError({ isNotLoogedIn: false });
//         }
//       } catch (e) {
//         notifyOfLinkingError({ isNotLoogedIn: false });
//       }
//     }
//   } else {
//     notifyOfLinkingError({ isNotLoogedIn: true });
//   }
// };
