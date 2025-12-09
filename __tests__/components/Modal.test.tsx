import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Modal from '@/components/Modal';

describe('Modal', () => {
  it('renders modal when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Test content</div>
      </Modal>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Test content</div>
      </Modal>
    );

    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Test content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
