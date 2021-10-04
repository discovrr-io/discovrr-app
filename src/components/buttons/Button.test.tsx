import React from 'react';

import { fireEvent, render } from '@testing-library/react-native';
import '@testing-library/jest-native';

import Button, { ButtonTestId } from './Button';

describe('Button', () => {
  const buttonTitle = 'My Button';

  describe('test large buttons', () => {
    describe('test large idle buttons', () => {
      it('renders an enabled large idle button', () => {
        const onPress = jest.fn();
        const { getByTestId, queryByTestId, toJSON } = render(
          <Button title={buttonTitle} onPress={onPress} />,
        );

        expect(queryByTestId(ButtonTestId.TEXT)).not.toBeNull();
        expect(queryByTestId(ButtonTestId.ACTIVITY_INDICATOR)).toBeNull();

        // expect(queryByTestId(ButtonTestId.TEXT)).toBeInTheDocument();
        // expect(queryByTestId(ButtonTestId.ACTIVITY_INDICATOR)).not.toBeInTheDocument();

        const buttonContainer = getByTestId(ButtonTestId.CONTAINER);
        fireEvent.press(buttonContainer);
        expect(onPress).toHaveBeenCalledTimes(1);

        // FIXME: This doesn't work
        // const buttonText = getByTestId(ButtonTestId.TEXT);
        // expect(buttonText.props.children).toContain(buttonTitle);

        expect(toJSON()).toMatchSnapshot();
      });
    });
  });
});
