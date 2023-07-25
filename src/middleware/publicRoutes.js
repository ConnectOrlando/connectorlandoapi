import config from '../config.js';
import _ from 'lodash-es';

export default async (request, response, next) => {
  let route = request.path;
  if (_.last(route) === '/') {
    route = route.slice(0, -1);
  }

  request.isPublicRoute =
    config?.PUBLIC_ROUTES?.includes('*') ||
    config.PUBLIC_ROUTES.includes(route);
  next();
};
