import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router); 
  const data = localStorage.getItem('result');

  const cloned = data? req.clone({ setHeaders: { Authorization: `Bearer ${JSON.parse(data).token}` } }): req;
  
  return next(cloned).pipe(
    catchError((err)=>{
      if(err.sttaus === 401){
        localStorage.removeItem('result');
        router.navigate(['/login']);
      }
      return throwError(()=> err);
    })
  );
};
