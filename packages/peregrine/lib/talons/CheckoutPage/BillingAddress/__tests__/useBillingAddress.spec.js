import React from 'react';
import {
    useQuery,
    useMutation,
    useLazyQuery,
    useApolloClient
} from '@apollo/client';
import { useFormState } from 'informed';
import createTestInstance from '../../../../util/createTestInstance';
import { useBillingAddress, mapAddressData } from '../useBillingAddress';

/**
 * Mocks
 */
const getBillingAddressQuery = 'getBillingAddressQuery';
const getIsBillingAddressSameQuery = 'getIsBillingAddressSameQuery';
const getShippingAddressQuery = 'getShippingAddressQuery';
const setBillingAddressMutation = 'setBillingAddressMutation';

jest.mock('@apollo/client');

const billingAddress = {
    firstName: 'ba fn',
    lastName: 'ba ln',
    country: {
        code: 'US'
    },
    street: ['45678 blvd', 'suite 300'],
    city: 'Austin',
    region: { code: 'TX' },
    postcode: '78945',
    phoneNumber: '1234567891'
};
const shippingAddress = {
    firstName: 'sa fn',
    lastName: 'sa ln',
    country: {
        code: 'UK'
    },
    street: ['12345 ln', 'apt 123'],
    city: 'London',
    region: { code: 'TX' },
    postcode: '13245',
    phoneNumber: '7894561231'
};

const shippingAddressQueryResult = {
    data: {
        cart: {
            shippingAddresses: [
                {
                    __typename: 'Shipping Address',
                    ...shippingAddress
                }
            ]
        }
    }
};

const isBillingAddressSameQueryResult = {
    data: { cart: { isBillingAddressSame: false } }
};

const getBillingAddress = jest.fn().mockReturnValue([
    () => {},
    {
        data: {
            cart: {
                billingAddress: {
                    __typename: 'Billing Address',
                    ...billingAddress
                }
            }
        },
        loading: false,
        called: false
    }
]);

const getShippingAddress = jest
    .fn()
    .mockReturnValue(shippingAddressQueryResult);
const getIsBillingAddressSame = jest
    .fn()
    .mockReturnValue(isBillingAddressSameQueryResult);

const setBillingAddress = jest.fn();

const setBillingAddressMutationResult = jest.fn().mockReturnValue([
    setBillingAddress,
    {
        error: null,
        loading: false,
        called: false
    }
]);

jest.mock('@magento/peregrine/lib/context/cart', () => ({
    useCartContext: jest.fn().mockReturnValue([{ cartId: '123' }])
}));

const writeQuery = jest.fn();

const operations = {
    getBillingAddressQuery,
    getIsBillingAddressSameQuery,
    getShippingAddressQuery,
    setBillingAddressMutation
};

jest.mock('informed', () => ({
    useFormState: jest.fn().mockReturnValue({
        values: {
            isBillingAddressSame: false,
            firstName: '',
            lastName: '',
            country: '',
            street1: '',
            street2: '',
            city: '',
            state: '',
            postcode: '',
            phoneNumber: ''
        },
        errors: {}
    }),
    useFormApi: jest.fn().mockReturnValue({
        validate: jest.fn()
    })
}));

beforeAll(() => {
    useQuery.mockImplementation(query => {
        if (query === getBillingAddressQuery) {
            return getBillingAddress();
        } else if (query === getIsBillingAddressSameQuery) {
            return getIsBillingAddressSame();
        } else if (query === getShippingAddressQuery) {
            return getShippingAddress();
        } else {
            return { data: {} };
        }
    });

    useLazyQuery.mockReturnValue([
        () => {},
        {
            data: null,
            error: null,
            loading: true
        }
    ]);

    useLazyQuery.mockImplementation(query => {
        if (query === getBillingAddressQuery) {
            return getBillingAddress();
        }
    });

    useMutation.mockImplementation(mutation => {
        if (mutation === setBillingAddressMutation) {
            return setBillingAddressMutationResult();
        } else if (mutation === setCreditCardDetailsOnCartMutation) {
            return setCreditCardDetailsOnCartMutationResult();
        } else {
            return [jest.fn(), {}];
        }
    });

    useApolloClient.mockReturnValue({
        writeQuery
    });
});

const Component = props => {
    const talonProps = useBillingAddress(props);

    return <i talonProps={talonProps} />;
};

const getTalonProps = props => {
    const tree = createTestInstance(<Component {...props} />);
    const { root } = tree;
    const { talonProps } = root.findByType('i').props;

    const update = newProps => {
        tree.update(<Component {...{ ...props, ...newProps }} />);

        return root.findByType('i').props.talonProps;
    };

    return { talonProps, tree, update };
};

/**
 * Tests
 */
test('Should return correct shape', () => {
    const { talonProps } = getTalonProps({
        shouldSubmit: false,
        operations,
        onBillingAddressChangedError: () => {},
        onBillingAddressChangedSuccess: () => {}
    });

    expect(talonProps).toMatchSnapshot();
});

test('Should return errors from billing address mutation', () => {
    const billingResultError = new Error('some billing address mutation error');

    const billingMutationResultMock = [
        () => {},
        {
            loading: false,
            called: true,
            error: billingResultError
        }
    ];

    setBillingAddressMutationResult
        .mockReturnValueOnce(billingMutationResultMock)
        .mockReturnValueOnce(billingMutationResultMock);

    const { talonProps } = getTalonProps({
        shouldSubmit: false,
        operations,
        onBillingAddressChangedError: () => {},
        onBillingAddressChangedSuccess: () => {}
    });

    expect(talonProps.errors.get('setBillingAddressMutation')).toEqual(
        billingResultError
    );
});

test('Should return isBillingAddress and billingAddress from cache as initialValues', () => {
    const billingAddress = {
        firstName: 'test',
        lastName: 'test',
        country: {
            code: 'test'
        },
        street: ['test', 'test'],
        city: 'test',
        region: { code: 'test' },
        postcode: 'test',
        phoneNumber: 'test'
    };

    getBillingAddress.mockReturnValueOnce([
        () => {},
        {
            data: {
                cart: {
                    billingAddress: {
                        __typename: 'Billing Address',
                        ...billingAddress
                    }
                }
            },
            loading: false,
            called: true
        }
    ]);

    getIsBillingAddressSame.mockReturnValueOnce({
        data: { cart: { isBillingAddressSame: false } }
    });

    const { talonProps } = getTalonProps({
        shouldSubmit: false,
        operations,
        onBillingAddressChangedError: () => {},
        onBillingAddressChangedSuccess: () => {}
    });

    expect(talonProps.initialValues).toMatchObject({
        ...mapAddressData(billingAddress),
        isBillingAddressSame: false
    });
});

test('Should set billingAddress to {} if isBillingAddress is true in initialValues', () => {
    const billingAddress = {
        firstName: 'test',
        lastName: 'test',
        country: {
            code: 'test'
        },
        street: ['test', 'test'],
        city: 'test',
        region: { code: 'test' },
        postcode: 'test',
        phoneNumber: 'test'
    };
    getBillingAddress.mockReturnValueOnce([
        () => {},
        {
            data: {
                cart: {
                    billingAddress: {
                        __typename: 'Billing Address',
                        ...billingAddress
                    }
                }
            }
        }
    ]);
    getIsBillingAddressSame.mockReturnValueOnce({
        data: { cart: { isBillingAddressSame: true } }
    });

    const { talonProps } = getTalonProps({
        shouldSubmit: false,
        operations,
        onBillingAddressChangedError: () => {},
        onBillingAddressChangedSuccess: () => {}
    });

    expect(talonProps.initialValues).toMatchObject({
        isBillingAddressSame: true
    });
});

test('Should call setBillingAddressMutation mutation with shipping address from UI if isBillingAddressSame is true', () => {
    const shippingAddress = {
        firstName: 'test value',
        lastName: 'test value',
        country: {
            code: 'test value'
        },
        street: ['test value', 'test value'],
        city: 'test value',
        region: { code: 'test value' },
        postcode: 'test value',
        phoneNumber: 'test value'
    };
    getShippingAddress.mockReturnValueOnce({
        data: {
            cart: {
                shippingAddresses: [
                    {
                        __typename: 'Shipping Address',
                        ...shippingAddress
                    }
                ]
            }
        }
    });
    useFormState.mockReturnValueOnce({
        values: {
            isBillingAddressSame: true
        },
        errors: {}
    });

    getTalonProps({
        shouldSubmit: true,
        operations,
        onBillingAddressChangedError: () => {},
        onBillingAddressChangedSuccess: () => {}
    });

    expect(setBillingAddress).toBeCalledWith({
        variables: {
            ...mapAddressData(shippingAddress),
            sameAsShipping: true,
            cartId: '123'
        }
    });
});

test('Should call onBillingAddressChangedSuccess if billing address mutation is successful', () => {
    setBillingAddressMutationResult.mockReturnValueOnce([
        () => {},
        {
            error: null,
            loading: false,
            called: true
        }
    ]);

    const onBillingAddressChangedSuccess = jest.fn();

    getTalonProps({
        shouldSubmit: true,
        operations,
        onBillingAddressChangedError: () => {},
        onBillingAddressChangedSuccess
    });

    expect(onBillingAddressChangedSuccess).toBeCalled();
});

test('Should call onBillingAddressChangedError if billing address mutation is failed', () => {
    setBillingAddressMutationResult.mockReturnValueOnce([
        () => {},
        {
            error: new Error('some billing address mutation error'),
            loading: false,
            called: true
        }
    ]);

    const onBillingAddressChangedError = jest.fn();

    getTalonProps({
        shouldSubmit: true,
        operations,
        onBillingAddressChangedError,
        onBillingAddressChangedSuccess: () => {}
    });

    expect(onBillingAddressChangedError).toBeCalled();
});

test('Should save isBillingAddressSame in apollo cache', () => {
    useFormState.mockReturnValueOnce({
        values: {
            isBillingAddressSame: true
        },
        errors: {}
    });

    getTalonProps({
        shouldSubmit: true,
        operations,
        onBillingAddressChangedError: () => {},
        onBillingAddressChangedSuccess: () => {}
    });

    const isBillingAddressSameSaveCall = writeQuery.mock.calls.filter(
        call => call[0].query === getIsBillingAddressSameQuery
    )[0];

    expect(
        isBillingAddressSameSaveCall[0].data.cart.isBillingAddressSame
    ).toBeTruthy();
});

test('Should not proceed with saving billing address if form state has errors', () => {
    useFormState.mockReturnValueOnce({
        values: {
            isBillingAddressSame: true
        },
        errors: {
            firstName: 'The Field is Required'
        }
    });

    getTalonProps({
        shouldSubmit: false,
        operations,
        onBillingAddressChangedError: () => {},
        onBillingAddressChangedSuccess: () => {}
    });

    expect(setBillingAddress).not.toHaveBeenCalled();
});
