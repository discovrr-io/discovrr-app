import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import * as yup from 'yup';
import { Formik, useField, useFormikContext } from 'formik';
import { Image } from 'react-native-image-crop-picker';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as productsSlice from 'src/features/products/products-slice';
import { Cell, CellFieldProps, Spacer } from 'src/components';
import { CELL_GROUP_VERTICAL_SPACING } from 'src/components/cells/CellGroup';
import { CreateItemDetailsTopTabScreenProps } from 'src/navigation';

import {
  useAppDispatch,
  useNavigationAlertUnsavedChangesOnRemove,
} from 'src/hooks';

import { ImagePreviewPicker } from './components';
import { useHandleSubmitNavigationButton } from './hooks';

const MAX_MEDIA_COUNT = 8;
const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 280;

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
      'Please format your price like "12,345.67"',
      input => {
        if (!input) return false;
        return /^(\d(?:[\d,])*)(?:\.(\d{2}))?$/.test(input.trim());
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
  visible: yup.boolean().required(),
});

type ProductForm = Omit<yup.InferType<typeof productSchema>, 'media'> & {
  media: Image[];
};

type CreateProductScreenProps =
  CreateItemDetailsTopTabScreenProps<'CreateProduct'>;

export default function CreateProductScreen(_: CreateProductScreenProps) {
  const dispatch = useAppDispatch();

  const __handleSubmit = async (values: ProductForm) => {
    try {
      console.log({ values });
      const sources = values.media.map(utilities.mapImageToMediaSource);
      const product = await dispatch(
        productsSlice.createProduct({
          ...values,
          price: Number.parseFloat(values.price),
          media: sources,
          hidden: !values.visible,
        }),
      ).unwrap();

      console.log('NEW PRODUCT:', product);
    } catch (error: any) {
      console.error('Failed to create new product:', error);
      utilities.alertSomethingWentWrong(
        error?.message ||
          error?.code ||
          "We weren't able to create your product at this time. Please try again later.",
      );
    }
  };

  return (
    <Formik<ProductForm>
      initialValues={{
        media: [],
        name: '',
        price: '',
        description: '',
        visible: true,
      }}
      validationSchema={productSchema}
      onSubmit={async (values, helpers) => {
        // await __handleSubmit(values);
        utilities.alertUnavailableFeature();
        helpers.resetForm({ values });
      }}>
      <ProductFormikForm />
    </Formik>
  );
}

function ProductFormikForm() {
  const { dirty, handleSubmit } = useFormikContext<ProductForm>();
  const [_, visibleMeta, visibleHelpers] = useField<boolean>('visible');

  useNavigationAlertUnsavedChangesOnRemove(dirty);
  useHandleSubmitNavigationButton<ProductForm>(handleSubmit);

  // TODO: Add KeyboardAvoidingView (couldn't get it to work before)
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={productFormikFormStyles.scrollView}>
      <ImagePreviewPicker
        fieldName="media"
        maxCount={MAX_MEDIA_COUNT}
        caption={`Upload up to ${MAX_MEDIA_COUNT} photos below`}
      />
      <View style={[productFormikFormStyles.container]}>
        <Cell.Group label="Product Details">
          <FormikField
            fieldName="name"
            label="Name"
            placeholder="What's the name of your product?"
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
        <Cell.Group label="Categorisation">
          <Cell.Navigator label="Add tags" previewValue="0 tags" />
          <Cell.Navigator label="Add categories" previewValue="0 categories" />
        </Cell.Group>
        <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
        <Cell.Group label="Additional Options">
          <Cell.Switch
            label="Visible to everyone"
            value={visibleMeta.value}
            onValueChange={value => visibleHelpers.setValue(value)}
          />
          <Cell.Navigator label="Add location" />
        </Cell.Group>
      </View>
    </ScrollView>
  );
}

const productFormikFormStyles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    paddingVertical: constants.layout.spacing.lg,
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
  const [field, meta, helpers] = useField<string>(fieldName);

  return (
    <Cell.Field
      {...cellFieldProps}
      value={meta.value}
      onChangeText={text => helpers.setValue(text)}
      onBlur={field.onBlur(fieldName)}
      error={meta.touched ? meta.error : undefined}
    />
  );
}
