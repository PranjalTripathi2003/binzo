import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentUser, login, register, signInWithGoogle } from '../../services/auth';
import AuthModal from './AuthModal';

vi.mock('../../services/auth', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

const loginMock = vi.mocked(login);
const registerMock = vi.mocked(register);
const currentUserMock = vi.mocked(getCurrentUser);
const googleMock = vi.mocked(signInWithGoogle);
const user = { email: 'shopper@example.com', name: 'Shopper' };
const onClose = vi.fn();
const onAuthSuccess = vi.fn();

function renderModal(mode: 'login' | 'register' = 'login') {
  return render(<AuthModal mode={mode} onClose={onClose} onAuthSuccess={onAuthSuccess} />);
}

describe('AuthModal integration', () => {
  beforeEach(() => {
    localStorage.clear();
    loginMock.mockReset();
    registerMock.mockReset();
    currentUserMock.mockReset();
    googleMock.mockReset();
    onClose.mockReset();
    onAuthSuccess.mockReset();
  });

  it('closes with Escape and restores body scrolling after unmount', () => {
    renderModal();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('logs in, stores the returned tokens, and reports the authenticated user', async () => {
    const interaction = userEvent.setup();
    loginMock.mockResolvedValue({
      user, access_token: 'access-123', refresh_token: 'refresh-123',
    });
    currentUserMock.mockResolvedValue(user);
    renderModal();

    await interaction.type(screen.getByPlaceholderText('Email'), 'shopper@example.com');
    await interaction.type(screen.getByPlaceholderText('Password'), 'secret');
    await interaction.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(onAuthSuccess).toHaveBeenCalledWith(user));
    expect(localStorage.getItem('access_token')).toBe('access-123');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-123');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows an error and keeps the modal open when login fails', async () => {
    const interaction = userEvent.setup();
    loginMock.mockRejectedValue(new Error('Invalid credentials'));
    renderModal();

    await interaction.type(screen.getByPlaceholderText('Email'), 'shopper@example.com');
    await interaction.type(screen.getByPlaceholderText('Password'), 'wrong');
    await interaction.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('asks the user to confirm email when registration returns no session', async () => {
    const interaction = userEvent.setup();
    registerMock.mockResolvedValue({ user: null, access_token: null, refresh_token: null });
    renderModal('register');

    await interaction.type(screen.getByPlaceholderText('Name'), 'New Shopper');
    await interaction.type(screen.getByPlaceholderText('Email'), 'new@example.com');
    await interaction.type(screen.getByPlaceholderText('Password'), 'secret');
    await interaction.click(screen.getByRole('button', { name: 'Signup' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Check your email to confirm it');
    expect(onAuthSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('completes registration when the backend returns a session', async () => {
    const interaction = userEvent.setup();
    registerMock.mockResolvedValue({
      user, access_token: 'register-access', refresh_token: 'register-refresh',
    });
    currentUserMock.mockResolvedValue(user);
    renderModal('register');

    await interaction.type(screen.getByPlaceholderText('Name'), 'Shopper');
    await interaction.type(screen.getByPlaceholderText('Email'), 'shopper@example.com');
    await interaction.type(screen.getByPlaceholderText('Password'), 'secret');
    await interaction.click(screen.getByRole('button', { name: 'Signup' }));

    await waitFor(() => expect(onAuthSuccess).toHaveBeenCalledWith(user));
    expect(localStorage.getItem('access_token')).toBe('register-access');
    expect(registerMock).toHaveBeenCalledWith({
      name: 'Shopper', email: 'shopper@example.com', password: 'secret', phone: '',
    });
  });

  it('shows Google sign-in startup errors without closing the modal', async () => {
    const interaction = userEvent.setup();
    googleMock.mockRejectedValue(new Error('Google sign-in is not configured'));
    renderModal();
    await interaction.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Google sign-in is not configured');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when the user clicks the backdrop', () => {
    const { getByRole } = renderModal();
    fireEvent.click(getByRole('dialog', { name: 'Login' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
