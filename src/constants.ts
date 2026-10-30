const googleSignInError =
  'No se pudo completar el inicio de sesión con Google. Intente nuevamente.';

export const C = {
  rateTypes: ['normal', 'saturdayPre', 'saturdayPost'],
  rateTypesMap: {
    normal: 'Horario normal (L a V)',
    saturdayPre: 'Sábado hasta las 14:30',
    saturdayPost: 'Sábado después de las 14:30',
  },
  rateChangeKindsMap: {
    correction: 'Corrección de tarifa',
    retroactive: 'Actualización retroactiva',
    removal: 'Baja de tarifa por usuario',
    hourLoad: 'Carga de horas con la tarifa vigente',
  },
  months: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
  authErrorsMap: {
    OAuthSignin: googleSignInError,
    OAuthCallback: googleSignInError,
    OAuthCreateAccount: googleSignInError,
    Callback: googleSignInError,
    OAuthAccountNotLinked:
      'Este correo ya está vinculado a otra forma de ingreso.',
    SessionRequired: 'Debe iniciar sesión para continuar.',
    default: 'Ocurrió un error al iniciar sesión. Intente nuevamente.',
  },
} as const;

export default C;
