import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, catchError} from 'rxjs/operators';
import { Observable, empty} from 'rxjs';

interface Advertiser {
  campaigns: any;
  budget: number;
  spend: number;
  id: number;
  name: string;
  advertiserName: string;
}

@Injectable()
export class BackendService {
  constructor(private http: HttpClient) { }

  getData(url: any): Observable<Advertiser> {
    return this.http.get<Advertiser>(url)
    .pipe(
        map((res: any) => res),
        catchError(e => {
          console.error(e);
          return empty();
        })
    );
  }
}
