import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import _ from 'lodash';
import * as yup from 'yup';
import { Formik, useField, useFormikContext } from 'formik';
import { Image } from 'react-native-image-crop-picker';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { Banner, Cell, CellFieldProps, Spacer } from 'src/components';
import { CELL_GROUP_VERTICAL_SPACING } from 'src/components/cells/CellGroup';
import { useNavigationAlertUnsavedChangesOnRemove } from 'src/hooks';

import {
  CreateItemDetailsTopTabScreenProps,
  CreateItemStackNavigationProp,
} from 'src/navigation';

import { ImagePreviewPicker } from './components';
import { useHandleSubmitNavigationButton } from './hooks';

const MAX_MEDIA_COUNT = 8;
const MAX_NAME_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 2000;

const productSchema = yup.object({
  media: yup
    .array()
    .required()
    .min(1, 'Please upload at least one photo')
    .max(
      MAX_MEDIA_COUNT,
      `You can only upload up to ${MAX_MEDIA_COUNT} photos at a time`,
    ),
  name: yup
    .string()
    .trim()
    .required('Please enter the name of your product')
    .max(
      MAX_NAME_LENGTH,
      `Your product name should be no longer than ${MAX_NAME_LENGTH} characters`,
    ),
  price: yup
    .string()
    .required('Please enter the price of your product')
    .test(
      'is formatted as a valid currency',
      'Your price should only have digits, an optional decimal point and optional commas like "12,345.67"',
      input => {
        if (!input) return false;
        return /^(\d(?:[\d,])*)(?:\.(\d+))?$/.test(input.trim());
      },
    )
    // .test(
    //   'has up to two digits for cents',
    //   'Please enter up to 2 digits after the decimal point',
    //   input => {
    //     if (!input) return false;
    //     return /^(.*)(?:\.(\d{,2}))?$/.test(input.trim());
    //   },
    // )
    .test(
      'has a non-negative numeric value',
      'Please input a non-negative number',
      input => {
        if (!input) return false;
        return Number.parseFloat(input.replaceAll(',', '')) >= 0;
      },
    )
    .test(
      'has numeric value less than or equal to 1,000,000',
      'Please input a price less than or equal to $1,000,000',
      input => {
        if (!input) return false;
        return Number.parseFloat(input.replaceAll(',', '')) <= 1e6;
      },
    ),
  description: yup
    .string()
    .required('Please enter a description of at least 3 words')
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Your product description is too long! Please enter at most ${MAX_DESCRIPTION_LENGTH} characters`,
    )
    .test('has at least 3 words', 'Please enter at least 3 words', input => {
      if (!input) return false;
      return utilities.getWordCount(input) >= 3;
    }),
  hidden: yup.boolean().required(),
  unlimited: yup.boolean().required(),
  quantity: yup
    .string()
    .optional()
    .default('1')
    .test(
      'has a non-negative numeric value',
      'Please input a non-negative integer',
      input => {
        if (!input) return true;
        return Number.parseFloat(input.replaceAll(',', '')) >= 0;
      },
    )
    .test('it is an integer', 'Please input a whole number', input => {
      if (!input) return true;
      return !input.includes('.');
    })
    .test(
      'has numeric value less than 1,000,000,000',
      'Please input a price less than $1,000,000,000',
      input => {
        if (!input) return false;
        return Number.parseFloat(input.replaceAll(',', '')) <= 1e9;
      },
    ),
});

type ProductForm = Omit<yup.InferType<typeof productSchema>, 'media'> & {
  media: Image[];
};

type CreateProductScreenProps =
  CreateItemDetailsTopTabScreenProps<'CreateProduct'>;

export default function CreateProductScreen(props: CreateProductScreenProps) {
  const handleNavigateToPreview = (values: ProductForm) => {
    const sources = values.media.map(utilities.mapImageToMediaSource);

    props.navigation
      .getParent<CreateItemStackNavigationProp>()
      .navigate('CreateItemPreview', {
        type: 'product',
        contents: {
          hidden: values.hidden,
          name: values.name.trim(),
          description: values.description.trim(),
          price: Number.parseFloat(values.price.replaceAll(',', '')),
          stock: values.unlimited
            ? -1
            : _.round(Number.parseFloat(values.quantity || '1'), 2),
          squarespaceImages: sources,
        },
      });
  };

  return (
    <Formik<ProductForm>
      initialValues={{
        media: [],
        name: '',
        price: '',
        description: '',
        hidden: false,
        unlimited: true,
        quantity: '1',
      }}
      validationSchema={productSchema}
      onSubmit={async (values, helpers) => {
        handleNavigateToPreview(values);
        helpers.resetForm({ values });
      }}>
      <ProductFormikForm />
    </Formik>
  );
}

function ProductFormikForm() {
  const { dirty, isValid, submitCount } = useFormikContext<ProductForm>();
  const { height: windowHeight } = useWindowDimensions();

  const [, hiddenMeta, hiddenHelpers] = useField<boolean>('hidden');
  const [, unlimitedMeta, unlimitedHelpers] = useField<boolean>('unlimited');

  useNavigationAlertUnsavedChangesOnRemove(dirty);
  useHandleSubmitNavigationButton<ProductForm>();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        productFormikFormStyles.scrollView,
        { paddingBottom: windowHeight * 0.25 },
      ]}>
      {submitCount > 0 && !isValid && (
        <View style={[productFormikFormStyles.container]}>
          <Banner
            type="error"
            title="There are errors in your form."
            caption="Please correct them before submitting."
          />
          <Spacer.Vertical value="md" />
        </View>
      )}
      <ImagePreviewPicker
        fieldName="media"
        maxCount={MAX_MEDIA_COUNT}
        caption={`Upload up to ${MAX_MEDIA_COUNT} photos below`}
      />
      <View style={[productFormikFormStyles.container]}>
        <Cell.Group label="Details">
          <FormikField
            fieldName="name"
            label="Name"
            placeholder="What's the name of your product?"
            autoCapitalize="words"
          />
          <FormikField
            fieldName="price"
            label="Price"
            placeholder="123,456.78 (AUD)"
            keyboardType="numeric"
          />
          <FormikField
            fieldName="description"
            multiline
            numberOfLines={8}
            label="Description"
            placeholder="Write a short description about your product"
          />
        </Cell.Group>
        <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
        <Cell.Group label="Availability">
          <Cell.Switch
            label="Visible to everyone"
            caption={
              hiddenMeta.value
                ? 'This product is only visible to you'
                : 'Anyone can view and purchase this product'
            }
            value={!hiddenMeta.value}
            onValueChange={value => hiddenHelpers.setValue(!value)}
          />
          <Cell.Switch
            label="Unlimited quantity"
            caption="You can change this at any time"
            value={unlimitedMeta.value}
            onValueChange={value => unlimitedHelpers.setValue(value)}
          />
          {!unlimitedMeta.value && (
            <FormikField
              fieldName="quantity"
              label="Quantity"
              placeholder="1"
              keyboardType="numeric"
            />
          )}
        </Cell.Group>
        <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
        <Cell.Group label="Categorisation">
          <Cell.Navigator
            label="Add tags"
            previewValue="0 tags"
            onPress={() => utilities.alertUnavailableFeature()}
          />
          <Cell.Navigator
            label="Add categories"
            previewValue="0 categories"
            onPress={() => utilities.alertUnavailableFeature()}
          />
        </Cell.Group>
        {/* <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
        <Cell.Group
          label="Variants (Preview)"
          elementOptions={{ disabled: true }}>
          <Cell.Button label="Color" previewValue="No colors" />
          <Cell.Button label="Size" previewValue="No sizes" />
          <Cell.Navigator label="Add another variant" />
        </Cell.Group> */}
      </View>
    </ScrollView>
  );
}

const productFormikFormStyles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    paddingTop: constants.layout.spacing.lg,
  },
  container: {
    paddingHorizontal: constants.layout.spacing.lg,
  },
});

type FormikFieldProps = CellFieldProps & {
  fieldName: string;
};

function FormikField(props: FormikFieldProps) {
  const { fieldName, ...cellFieldProps } = props;
  const [field, meta] = useField<string>(fieldName);

  return (
    <Cell.Field
      {...cellFieldProps}
      value={meta.value}
      onChangeText={field.onChange(fieldName)}
      // onBlur={field.onBlur(fieldName)}
      error={meta.touched ? meta.error : undefined}
    />
  );
}
