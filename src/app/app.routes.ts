import { Routes } from '@angular/router';

export const ROUTE_PATHS = {
  EXTRACT: 'extract',
  HISTORY: 'history',
} as const;

export type AppRoute = `/${(typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS]}`;

export interface NavLink {
  label: string;
  path: AppRoute;
}

export const routes: Routes = [
  {
    path: '',
    redirectTo: ROUTE_PATHS.EXTRACT,
    pathMatch: 'full',
  },
  {
    path: ROUTE_PATHS.EXTRACT,
    loadComponent: () => import('./features/expense/components/extract-expense/extract-expense.component'),
  },
  {
    path: '**',
    redirectTo: ROUTE_PATHS.EXTRACT,
  },
];
