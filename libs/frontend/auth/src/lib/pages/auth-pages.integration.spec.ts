import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthStateService } from '@petradar/frontend/core';

import { LoginPageComponent } from './login-page/login-page.component.js';
import { RegisterPageComponent } from './register-page/register-page.component.js';

function setup(auth: Partial<AuthStateService>) {
  const router = {
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };

  const injector = Injector.create({
    providers: [
      { provide: AuthStateService, useValue: auth },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: { get: vi.fn().mockReturnValue(null) } } },
      },
      { provide: Router, useValue: router },
    ],
  });

  return { injector, router };
}

describe('auth pages integration', () => {
  it('starts login empty and blocks invalid submission', async () => {
    const login = vi.fn().mockResolvedValue(true);
    const { injector, router } = setup({
      error: () => null,
      loading: () => false,
      login,
      resetError: vi.fn(),
    } as Partial<AuthStateService>);
    const component = runInInjectionContext(injector, () => new LoginPageComponent());

    expect(component.form.email).toBe('');
    expect(component.form.password).toBe('');

    await component.submit();

    expect(login).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.localError()).toContain('Enter your email address and password');
  });

  it('prevents duplicate login submission while loading', async () => {
    const login = vi.fn().mockResolvedValue(true);
    const { injector } = setup({
      error: () => null,
      loading: () => true,
      login,
      resetError: vi.fn(),
    } as Partial<AuthStateService>);
    const component = runInInjectionContext(injector, () => new LoginPageComponent());

    component.form.email = 'nicha@example.com';
    component.form.password = 'password';
    await component.submit();

    expect(login).not.toHaveBeenCalled();
  });

  it('navigates after successful login without logging credentials', async () => {
    const login = vi.fn().mockResolvedValue(true);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { injector, router } = setup({
      error: () => null,
      loading: () => false,
      login,
      resetError: vi.fn(),
    } as Partial<AuthStateService>);
    const component = runInInjectionContext(injector, () => new LoginPageComponent());

    component.form.email = 'nicha@example.com';
    component.form.password = 'safe-password';
    await component.submit();

    expect(login).toHaveBeenCalledWith({ email: 'nicha@example.com', password: 'safe-password' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/my/reports');
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('validates register loading state and never sends privileged roles', async () => {
    const register = vi.fn().mockResolvedValue(true);
    const { injector } = setup({
      error: () => null,
      loading: () => false,
      register,
      resetError: vi.fn(),
    } as Partial<AuthStateService>);
    const component = runInInjectionContext(injector, () => new RegisterPageComponent());

    component.form.name = 'Nicha';
    component.form.email = 'nicha@example.com';
    component.form.password = 'long-safe-password';
    component.form.confirmPassword = 'long-safe-password';
    component.form.acceptedGuidelines = true;
    await component.submit();

    expect(register).toHaveBeenCalledWith({
      displayName: 'Nicha',
      email: 'nicha@example.com',
      password: 'long-safe-password',
    });
    expect(JSON.stringify(register.mock.calls)).not.toContain('ADMIN');
    expect(JSON.stringify(register.mock.calls)).not.toContain('VOLUNTEER');
  });

  it('starts registration empty and blocks invalid submission', async () => {
    const register = vi.fn().mockResolvedValue(true);
    const { injector, router } = setup({
      error: () => null,
      loading: () => false,
      register,
      resetError: vi.fn(),
    } as Partial<AuthStateService>);
    const component = runInInjectionContext(injector, () => new RegisterPageComponent());

    expect(component.form.name).toBe('');
    expect(component.form.email).toBe('');
    expect(component.form.password).toBe('');

    await component.submit();

    expect(register).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.localError()).toContain('Enter your name and a valid email');
  });
});
