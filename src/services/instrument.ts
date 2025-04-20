import * as Sentry from '@sentry/node';
import { SENTRY_DSN_KEY } from '../config/environment';
import { isEmpty } from 'lodash';

if (SENTRY_DSN_KEY && !isEmpty(SENTRY_DSN_KEY)) {
  Sentry.init({
    dsn: SENTRY_DSN_KEY,
  });

  console.log('Sentry initialized.');
} else {
  console.log('Sentry DSN not found — skipping initialization.');
}
