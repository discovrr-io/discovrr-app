import * as React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { Button, Cell, Spacer } from 'src/components';

import { color, font, layout } from 'src/constants';
import { ReportItemStackScreenParams } from 'src/navigation';

type ReportItemReasonScreenProps =
  ReportItemStackScreenParams<'ReportItemReason'>;

export default function ReportItemReasonScreen(
  props: ReportItemReasonScreenProps,
) {
  const contentType = props.route.params.type;
  const [selection, setSelection] = React.useState('');

  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: () => (
        <Button
          title="Submit"
          type="primary"
          variant="text"
          size="medium"
          disabled={selection.length === 0}
          onPress={() => props.navigation.push('ReportItemSuccess')}
        />
      ),
    });
  }, [props.navigation, selection.length]);

  return (
    <SafeAreaView style={layout.defaultScreenStyle}>
      <View
        style={{ paddingHorizontal: layout.defaultScreenMargins.horizontal }}>
        <Text style={[font.mediumBold]}>
          Why are you reporting this {contentType}?
        </Text>
        <Spacer.Vertical value="sm" />
        <Text style={[font.small, { color: color.gray700 }]}>
          Let us know what&apos;s happening and we&apos;ll look into it. Your
          report will be anonymous.
        </Text>
      </View>
      <Spacer.Vertical value="md" />
      <Cell.Group>
        <Cell.Select value={selection} onValueChanged={setSelection}>
          <Cell.Option
            label={`I'm not interested in this ${contentType}`}
            value="not-interested"
          />
          <Cell.Option label="It's suspicious or spam" value="spam" />
          <Cell.Option label="It's abusive or harmful" value="abusive" />
          <Cell.Option
            label="It contains sexually explicit material"
            value="explicit"
          />
          <Cell.Option label="Some other reason" value="other" />
        </Cell.Select>
      </Cell.Group>
      <Spacer.Vertical value="md" />
    </SafeAreaView>
  );
}
