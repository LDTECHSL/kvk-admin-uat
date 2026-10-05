const REQUIRED_MODULES = ['Gym', 'CarWash', 'BadmintonCourt', 'GamingCenter', 'Salon', 'Cafe'];

export const ADMIN_ACCESS_ERROR = 'KVK Admin requires access to all modules. Contact your administrator.';

export const hasAllModuleAccess = (modules: unknown): boolean =>
  Array.isArray(modules) && REQUIRED_MODULES.every(module => modules.includes(module));
