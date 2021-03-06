import React from 'react';
import { createTestInstance } from '@magento/peregrine';

import { usePassword } from '@magento/peregrine/lib/talons/Password/usePassword';

import Password from '../password';

jest.mock('@magento/peregrine/lib/talons/Password/usePassword', () => ({
    usePassword: jest.fn().mockReturnValue({
        visible: false,
        togglePasswordVisibility: jest.fn()
    })
}));

test('should render properly', () => {
    const tree = createTestInstance(
        <Password
            label="Password"
            fieldName="password"
            isToggleButtonHidden={true}
            autoComplete="password"
        />
    );

    expect(tree.toJSON()).toMatchSnapshot();
});

test('should render toggle button if isToggleButtonHidden is false', () => {
    usePassword.mockReturnValue({
        visible: false,
        togglePasswordVisibility: jest.fn()
    });

    const tree = createTestInstance(
        <Password
            label="Password"
            fieldName="password"
            isToggleButtonHidden={false}
            autoComplete="password"
        />
    );

    expect(tree.toJSON()).toMatchSnapshot();
});

test('should render show button if visible is false', () => {
    usePassword.mockReturnValue({
        visible: true,
        togglePasswordVisibility: jest.fn()
    });

    const tree = createTestInstance(
        <Password
            label="Password"
            fieldName="password"
            isToggleButtonHidden={false}
            autoComplete="password"
        />
    );

    expect(tree.toJSON()).toMatchSnapshot();
});
