/**
 * Copyright 2022 Redpanda Data, Inc.
 *
 * Use of this software is governed by the Business Source License
 * included in the file https://github.com/redpanda-data/redpanda/blob/dev/licenses/bsl.md
 *
 * As of the Change Date specified in that file, in accordance with
 * the Business Source License, use of this software will be governed
 * by the Apache License, Version 2.0
 */

import { fireEvent, renderWithRouter, screen, waitFor } from 'test-utils';
import { HostSelector } from './HostSelector';

const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

describe('HostSelector', () => {
  const defaultProps = {
    principalName: 'test-user',
    hosts: ['192.168.1.1', '192.168.1.2', '192.168.1.3'],
    baseUrl: '/security/acls/test-user/details',
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    test('should render card with correct title', () => {
      renderWithRouter(<HostSelector {...defaultProps} />);

      expect(screen.getByText('Multiple Hosts Found')).toBeVisible();
    });

    test('should display principal name in description text', () => {
      renderWithRouter(<HostSelector {...defaultProps} />);

      expect(screen.getByTestId('host-selector-principal-name')).toBeVisible();
      expect(screen.getByTestId('host-selector-principal-name')).toHaveTextContent('test-user');
      expect(screen.getByTestId('host-selector-description')).toBeVisible();
      expect(screen.getByTestId('host-selector-description')).toHaveTextContent(
        /principal has ACLs configured for multiple hosts/i,
      );
    });

    test('should render all host values in the table', () => {
      renderWithRouter(<HostSelector {...defaultProps} />);

      expect(screen.getByText('192.168.1.1')).toBeVisible();
      expect(screen.getByText('192.168.1.2')).toBeVisible();
      expect(screen.getByText('192.168.1.3')).toBeVisible();
    });

    test('should render correct number of table rows', () => {
      renderWithRouter(<HostSelector {...defaultProps} />);

      // Verify each host has a row using testIds
      expect(screen.getByTestId('host-selector-row-192.168.1.1')).toBeVisible();
      expect(screen.getByTestId('host-selector-row-192.168.1.2')).toBeVisible();
      expect(screen.getByTestId('host-selector-row-192.168.1.3')).toBeVisible();
    });
  });

  describe('Table structure', () => {
    test('should render table headers', () => {
      renderWithRouter(<HostSelector {...defaultProps} />);

      expect(screen.getByText('Principal')).toBeVisible();
      expect(screen.getByText('Host')).toBeVisible();
    });

    test('should display principal name and host value in each row', () => {
      renderWithRouter(<HostSelector {...defaultProps} />);

      // Check that each host has a corresponding principal name and host value with testIds
      for (const host of defaultProps.hosts) {
        expect(screen.getByTestId(`host-selector-principal-${host}`)).toBeVisible();
        expect(screen.getByTestId(`host-selector-principal-${host}`)).toHaveTextContent('test-user');
        expect(screen.getByTestId(`host-selector-host-${host}`)).toBeVisible();
        expect(screen.getByTestId(`host-selector-host-${host}`)).toHaveTextContent(host);
      }
    });
  });

  describe('Navigation', () => {
    test('should navigate with correct query parameter when clicking a host row', async () => {
      renderWithRouter(<HostSelector {...defaultProps} />);

      const firstRow = screen.getByTestId('host-selector-row-192.168.1.1');
      fireEvent.click(firstRow);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/security/acls/test-user/details?host=192.168.1.1');
      });
    });

    test('should navigate to different URLs when clicking different hosts', async () => {
      renderWithRouter(<HostSelector {...defaultProps} />);

      // Click first host
      const firstRow = screen.getByTestId('host-selector-row-192.168.1.1');
      fireEvent.click(firstRow);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/security/acls/test-user/details?host=192.168.1.1');
      });

      // Click second host
      const secondRow = screen.getByTestId('host-selector-row-192.168.1.2');
      fireEvent.click(secondRow);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/security/acls/test-user/details?host=192.168.1.2');
      });
    });

    test('should properly encode host values with special characters', async () => {
      const propsWithSpecialChars = {
        ...defaultProps,
        hosts: ['host@example.com', '*.domain.com', 'host with spaces'],
      };

      renderWithRouter(<HostSelector {...propsWithSpecialChars} />);

      const row = screen.getByTestId('host-selector-row-host@example.com');
      fireEvent.click(row);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/security/acls/test-user/details?host=host%40example.com');
      });
    });

    test('should use provided baseUrl correctly', async () => {
      const customBaseUrl = '/security/roles/my-role/details';
      const customProps = {
        ...defaultProps,
        baseUrl: customBaseUrl,
      };

      renderWithRouter(<HostSelector {...customProps} />);

      const row = screen.getByTestId('host-selector-row-192.168.1.1');
      fireEvent.click(row);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/security/roles/my-role/details?host=192.168.1.1');
      });
    });
  });

  describe('Edge cases', () => {
    test('should render with single host', () => {
      const singleHostProps = {
        ...defaultProps,
        hosts: ['192.168.1.1'],
      };

      renderWithRouter(<HostSelector {...singleHostProps} />);

      expect(screen.getByTestId('host-selector-row-192.168.1.1')).toBeVisible();
      expect(screen.getByTestId('host-selector-host-192.168.1.1')).toHaveTextContent('192.168.1.1');
    });

    test('should render with many hosts', () => {
      const manyHostsProps = {
        ...defaultProps,
        hosts: Array.from({ length: 10 }, (_, i) => `192.168.1.${i + 1}`),
      };

      renderWithRouter(<HostSelector {...manyHostsProps} />);

      // Verify first and last host are present
      expect(screen.getByTestId('host-selector-row-192.168.1.1')).toBeVisible();
      expect(screen.getByTestId('host-selector-row-192.168.1.10')).toBeVisible();

      // Verify all 10 rows exist
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByTestId(`host-selector-row-192.168.1.${i}`)).toBeVisible();
      }
    });
  });
});
