import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const user = localStorage.getItem('erp_user');
  
  if (user) {
    const usuario = JSON.parse(user);
    const credentials = btoa(`${usuario.username}:123456`);
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Basic ${credentials}`
      }
    });
    return next(authReq);
  }
  
  return next(req);
};