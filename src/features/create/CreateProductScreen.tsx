import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as yup from 'yup';
import { Formik, useFormikContext } from 'formik';
import { Image } from 'react-native-image-crop-picker';

import * as constants from 'src/constants';
import { Cell, Spacer } from 'src/components';
import { CreateItemDetailsTopTabScreenProps } from 'src/navigation';

import { ImagePreviewPicker } from './components';
import { useNavigationAlertUnsavedChangesOnRemove } from 'src/hooks';
import { CELL_GROUP_VERTICAL_SPACING } from 'src/components/cells/CellGroup';

const MAX_MEDIA_COUNT = 8;

const productSchema = yup.object({
  media: yup
    .array()
    .required()
    .min(1, 'Please upload at least one photo')
    .max(
      MAX_MEDIA_COUNT,
      `You can only upload up to ${MAX_MEDIA_COUNT} photos at a time`,
    ),
  name: yup.string().trim().required('Please enter the name of your product'),
  price: yup.string().required('Please enter the price of your product'),
  description: yup
    .string()
    .required('Please enter a description of at least 3 words'),
  hidden: yup.boolean().required(),
});

type ProductForm = Omit<yup.InferType<typeof productSchema>, 'media'> & {
  media: Image[];
};

type CreateProductScreenProps =
  CreateItemDetailsTopTabScreenProps<'CreateProduct'>;

export default function CreateProductScreen(props: CreateProductScreenProps) {
  return (
    <Formik<ProductForm>
      initialValues={{
        media: [],
        name: '',
        price: '',
        description: '',
        hidden: false,
      }}
      validationSchema={productSchema}
      onSubmit={(values, helpers) => {
        console.log(values);
        helpers.resetForm({ values });
      }}>
      <ProductFormikForm />
    </Formik>
  );
}

function ProductFormikForm() {
  const {
    dirty,
    values,
    errors,
    isSubmitting,
    handleBlur,
    handleChange,
    handleSubmit,
  } = useFormikContext<ProductForm>();

  useNavigationAlertUnsavedChangesOnRemove(dirty);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1 }}>
      <KeyboardAvoidingView
        behavior="position"
        keyboardVerticalOffset={Platform.select({
          ios: 100,
          default: undefined,
        })}>
        <View
          style={[
            postFormikFormStyles.container,
            { paddingTop: constants.layout.spacing.lg },
          ]}>
          <Text
            style={[constants.font.medium, { color: constants.color.gray500 }]}>
            Start creating your product by upload your photos below
          </Text>
        </View>
        <ImagePreviewPicker fieldName="media" maxCount={MAX_MEDIA_COUNT} />
        <View style={postFormikFormStyles.container}>
          <Cell.Group label="Product Details">
            <Cell.Field
              label="Name"
              placeholder="What's your product's name?"
            />
            <Cell.Field
              label="Price"
              placeholder="$0.00 (AUD)"
              keyboardType="decimal-pad"
            />
            <Cell.Field
              multiline
              label="Description"
              placeholder="Write a short description about the product…"
            />
          </Cell.Group>
          <Spacer.Vertical value={CELL_GROUP_VERTICAL_SPACING} />
          {/* <Cell.Group
          elementOptions={{
            containerSpacingHorizontal: constants.layout.spacing.md * 1.25,
          }}>
          <Cell.InputGroup labelFlex={1.35}>
            <Cell.Input
              label="Name"
              placeholder="Enter your product's name…"
              value={values.name}
              onBlur={handleBlur('name')}
              onChangeText={handleChange('name')}
              error={errors.name}
            />
            <Cell.Input
              label="Price"
              placeholder="0.00"
              keyboardType="decimal-pad"
              prefix={<Cell.Input.Affix text="AU$" />}
              value={values.price.toString()}
              onBlur={handleBlur('price')}
              onChangeText={handleChange('price')}
              error={errors.price}
            />
            <Cell.Input
              multiline
              label="Description"
              placeholder="Write a short description…"
              value={values.description}
              onBlur={handleBlur('description')}
              onChangeText={handleChange('description')}
              error={errors.description}
            />
          </Cell.InputGroup>
        </Cell.Group> */}
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const postFormikFormStyles = StyleSheet.create({
  container: {
    paddingHorizontal: constants.layout.spacing.lg,
  },
});
