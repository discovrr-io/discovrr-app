
// import storage from '@react-native-firebase/storage';
// import { Client, Configuration } from 'bugsnag-react-native';

import {
  updatePendingItems,
  updateConfigData,
  updateProductEditions,
} from './Actions';

import {
  weekDays,
  months,
  isAndroid,
} from './Constants';



const Parse = require('parse/react-native');

let store;

export const linkStore = (realStore) => {
  store = realStore;
  // console.log({ info: '*****************', realStore, store });
}

// const bugsnagConfig = new Configuration();
// bugsnagConfig.notifyReleaseStages = ['beta', 'production', 'testing', 'development'];
// bugsnagConfig.releaseStage = 'production';
// const bugsnag = new Client(bugsnagConfig);

export const setBugsnagUser = ({ id, accessLevel = '', displayName: name = '', email = '' }) => {
  // if (id) bugsnag.setUser(`${id} (${accessLevel})`, name, email);
};

export const logException = ({ error, query = '', extraData = null }) => {
  // console.log(query)
  // console.log('error', error)
  // bugsnag.notify(error, (report) => {
  //   report.metadata = { query, extraData };
  // });
};

export const extractDateString = (timeStamp) => {
  try {
    const d = timeStamp ? new Date(timeStamp) : new Date();

    if (d) {
      let hours = d.getHours();
      let minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours %= 12;
      hours = hours || 12;
      minutes = minutes < 10 ? `0${minutes}` : minutes;
      const strTime = `${hours}:${minutes} ${ampm}`;

      return `${weekDays[d.getDay()]} ${strTime}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  } catch (error) {
    logException({ error, extraData: timeStamp });
  }

  return '';
};

export const fetchNotes = () => {
  debugAppLogger({
    info: 'fetchNotes',
    store,
  });

  return;
  try {
    Parse.User.currentAsync()
      .then(async (currentUser) => {
        const query = new Parse.Query(Parse.Object.extend('NFCSticker'));
        query.equalTo('artist', currentUser.get('artist'));
        query.equalTo('status', 1);
        query.include('product');
        const results = await query.find();

        const pendingProducts = [];
        if (results && Array.isArray(results) && results.length) {
          results.forEach((sticker) => {
            const displayName = currentUser.get('displayName');
            const price = sticker.get('product').get('price');
            const title = sticker.get('product').get('title');
            const edition = sticker.get('edition_id');
            const editionNumber = sticker.get('edition_id');
            const description = sticker.get('product').get('description');
            const availableImages = sticker.get('product').get('images') || [];
            const { id } = sticker;

            const images = [];
            if (Array.isArray(availableImages) && availableImages.length) {
              availableImages.forEach((image) => {
                if (sticker.get('product').get(image)) {
                  const { _name: name, _url: imageUrl } = sticker.get('product').get(image);
                  images.push({ name, imageUrl });
                }
              });
            }

            if (images.length) {
              pendingProducts.push({
                edition, editionNumber, id, displayName, price, title, description, images,
              });
            }
          });
        }

        dispatch(updatePendingItems(pendingProducts));
      })
      .catch(() => {});
  } catch (error) {
    logException({ error });
  }
};

export const fetchNotez = ({ id: productID, maxEditions }) => async (dispatch, getState) => {
  try {
    const { productEditions = {} } = getState().cachedState;

    const query = new Parse.Query(Parse.Object.extend('NFCSticker'));
    query.equalTo('product', new Parse.Object('Product', { id: productID }));
    query.containedIn('status', [2]);
    query.ascending('createdAt');
    const results = await query.find();

    const items = [];
    if (results && Array.isArray(results) && results.length) {
      results.forEach((edition) => {
        const { id } = edition;
        const editionNumber = edition.get('edition_id');
        const dateString = extractDateString(edition.get('signature_date'));

        // const signatureTimeStamp = ;
        // let dateString = '';
        // if (signatureTimeStamp) {
        //   const d = new Date(signatureTimeStamp);
        //   dateString = d
        //     ? `${weekDays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
        //     : '';
        // }

        let signature = { imageUrl: 'https://enjagaAlwayswins.com' };
        if (edition.get('artist_signature')) {
          const { _name: name, _url: imageUrl } = edition.get('artist_signature');
          signature = { name, imageUrl };
        }

        items.push({ ...signature, id, editionNumber, maxEditions, dateString });
      });
    }

    productEditions[productID] = items;
    dispatch(updateProductEditions(productEditions));
  } catch (error) {
    //
  }
};

export const fetchConfigData = () => async (dispatch) => {
  try {
    const configData = await Parse.Config.get();
    if (configData && configData.attributes) dispatch(updateConfigData(configData.attributes));
  } catch (error) {
    //
  }
};

// export const uploadImage = (imageUri) => new Promise((resolve, reject) => {
//   // const filename = imageUri.substring(uri.lastIndexOf('/') + 1);
//   const filename = Math.random().toString(36).substring(2);
//   const uploadUri = isAndroid ? imageUri : imageUri.replace('file://', '');
//
//   const task = storage()
//     .ref(filename)
//     .putFile(uploadUri);
//
//   try {
//     resolve(task);
//   } catch (error) {
//     reject(error.message);
//   }
// });
