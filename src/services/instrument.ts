import * as Sentry from '@sentry/node';
import { SENTRY_DSN_KEY } from '../config/environment';
import { isEmpty } from 'lodash';

export const initializeSentry = () => {
  if (!SENTRY_DSN_KEY || isEmpty(SENTRY_DSN_KEY)) {
    console.log('Sentry DSN not found — skipping initialization.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN_KEY,
    environment: process.env.ENV || 'dev',
  });

  console.log('Sentry initialized.');
};
