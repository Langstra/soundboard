import { Route } from '@angular/router';
import { homeGuard, operatorGuard } from './operator.guard';
import type { SettingsPage } from './settings-page/settings-page';

export const soundboardRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [homeGuard],
    title: 'Soundboard',
    loadComponent: () => import('./soundboard-page/soundboard-page').then((module) => module.SoundboardPage),
  },
  {
    path: 'instellingen',
    canActivate: [operatorGuard],
    canDeactivate: [(page: SettingsPage) => page.canLeave()],
    title: 'Instellingen – Soundboard',
    loadComponent: () => import('./settings-page/settings-page').then((module) => module.SettingsPage),
  },
  {
    path: 'operator/inloggen',
    title: 'Operator inloggen – Soundboard',
    loadComponent: () => import('./operator-sign-in/operator-sign-in').then((module) => module.OperatorSignIn),
  },
];
