import * as React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';

import * as yup from 'yup';
import { Formik, useField, useFormikContext } from 'formik';
import { useNavigation } from '@react-navigation/core';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { CELL_ICON_SIZE } from 'src/components/cells/common';
import { Profile, ProfileId, ProfileKind } from 'src/models';
import { RootStackScreenProps } from 'src/navigation';

import * as profilesSlice from 'src/features/profiles/profiles-slice';
import { useMyProfileId, useProfile } from 'src/features/profiles/hooks';

import {
  AsyncGate,
  Button,
  Cell,
  LoadingContainer,
  LoadingOverlay,
  RouteError,
} from 'src/components';

import {
  useAppDispatch,
  useIsMounted,
  useNavigationAlertUnsavedChangesOnRemove,
} from 'src/hooks';

const profileKindSchema = yup.object({
  kind: yup.mixed<ProfileKind>().oneOf(['personal', 'vendor']).required(),
});

type AccountTypeForm = yup.InferType<typeof profileKindSchema>;

type AccountTypeSettingsScreenProps =
  RootStackScreenProps<'AccountTypeSettings'>;

function ProfileNotFoundRouteError() {
  return <RouteError message="We weren't able to find your profile." />;
}

export default function AccountTypeSettingsScreen(
  props: AccountTypeSettingsScreenProps,
) {
  const myProfileId = useMyProfileId();
  if (!myProfileId) return <ProfileNotFoundRouteError />;

  return (
    <AccountTypeSettingsScreenInner myProfileId={myProfileId} {...props} />
  );
}

function AccountTypeSettingsScreenInner(
  props: AccountTypeSettingsScreenProps & { myProfileId: ProfileId },
) {
  const profileData = useProfile(props.myProfileId);

  return (
    <AsyncGate
      data={profileData}
      onPending={() => <LoadingContainer />}
      onFulfilled={profile => {
        if (!profile) return <ProfileNotFoundRouteError />;
        return <LoadedAccountTypeSettingsScreen profile={profile} />;
      }}
      onRejected={ProfileNotFoundRouteError}
    />
  );
}

type LoadedAccountTypeSettingsScreenProps = {
  profile: Profile;
};

function LoadedAccountTypeSettingsScreen(
  props: LoadedAccountTypeSettingsScreenProps,
) {
  const $FUNC = '[LoadedAccountTypeSettingsScreen]';
  const dispatch = useAppDispatch();
  const profile = props.profile;
  const isMounted = useIsMounted();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (values: AccountTypeForm) => {
    try {
      setIsSubmitting(true);
      await dispatch(profilesSlice.changeProfileKind(values)).unwrap();
    } catch (error) {
      console.error($FUNC, 'Failed to change profile kind:', error);
      utilities.alertSomethingWentWrong(
        "We weren't able to change your account type. Please try again later.",
      );
    } finally {
      if (isMounted.current) setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          constants.layout.defaultScreenStyle,
          { flexGrow: 1 },
        ]}>
        <Formik<AccountTypeForm>
          initialValues={{ kind: profile.kind }}
          validationSchema={profileKindSchema}
          onSubmit={async (values, helpers) => {
            await handleSubmit(values);
            helpers.resetForm({ values });
          }}>
          <AccountTypeForm />
        </Formik>
      </ScrollView>
      {isSubmitting && (
        <LoadingOverlay
          message="Apply changes…"
          caption="This won't take long"
        />
      )}
    </SafeAreaView>
  );
}

function AccountTypeForm() {
  const navigation =
    useNavigation<AccountTypeSettingsScreenProps['navigation']>();
  const { dirty, handleSubmit, isSubmitting, isValid } =
    useFormikContext<AccountTypeForm>();

  const [_, meta, helpers] = useField<AccountTypeForm['kind']>('kind');

  useNavigationAlertUnsavedChangesOnRemove(dirty);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        const canSubmit = dirty && isValid && !isSubmitting;
        return (
          <Button
            title="Save"
            type="primary"
            variant="text"
            size="medium"
            disabled={!canSubmit}
            loading={isSubmitting}
            onPress={handleSubmit}
            textStyle={{ textAlign: 'right' }}
            containerStyle={{
              alignItems: 'flex-end',
              paddingHorizontal: 0,
              marginRight: constants.layout.defaultScreenMargins.horizontal,
            }}
          />
        );
      },
    });
  }, [navigation, dirty, isSubmitting, isValid, handleSubmit]);

  const handleChangeSelection = (selection: string) => {
    // When we submit the form, it will not attempt to migrate the profile if
    // the selection is the same as the current profile's kind
    helpers.setValue(selection as AccountTypeForm['kind']);
  };

  return (
    <Cell.Group
      label="Account Type"
      elementOptions={{ iconSize: CELL_ICON_SIZE * 1.5 }}>
      <Cell.Select value={meta.value} onValueChanged={handleChangeSelection}>
        <Cell.Option
          label="I'm a user"
          value="personal"
          caption="Post, share and like content created by other users and makers"
        />
        <Cell.Option
          label="I'm a maker"
          value="vendor"
          caption="Advertise products and workshops to help your business grow"
        />
      </Cell.Select>
    </Cell.Group>
  );
}
