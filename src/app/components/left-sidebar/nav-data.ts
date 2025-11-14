export interface NavItem {
  routerLink?: string;
  icon?: string;
  label: string;
  expanded?: boolean;
  children?: NavItem[];
}

export const navData: NavItem[] = [
  {
    routerLink: '/dashboard',
    icon: 'bi bi-speedometer2',
    label: 'Dashboard',
  },
  {
    label: 'Expenses',
    icon: 'bi bi-wallet2',
    routerLink: '/expenses',
  },
  {
    label: 'Settings',
    icon: 'bi bi-gear',
    routerLink: '/settings',
    children: [
      {
        routerLink: '/settings/profile',
        label: 'Profile',
        icon: 'bi bi-person',
      },
      {
        routerLink: '/settings/budget',
        label: 'Budget',
        icon: 'bi bi-piggy-bank',
      },
    ],
  },
];
