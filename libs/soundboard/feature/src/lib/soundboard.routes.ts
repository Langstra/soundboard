import { Route } from '@angular/router';
import { operatorGuard } from './operator.guard';

export const soundboardRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [operatorGuard],
    loadComponent: () => import('./soundboard-page/soundboard-page').then((module) => module.SoundboardPage),
  },
  {
    path: 'instellingen',
    canActivate: [operatorGuard],
    loadComponent: () => import('./settings-page/settings-page').then((module) => module.SettingsPage),
  },
  {
    path: 'inloggen',
    loadComponent: () => import('./operator-sign-in/operator-sign-in').then((module) => module.OperatorSignIn),
  },
];
