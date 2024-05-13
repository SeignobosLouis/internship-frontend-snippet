import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  /**
   * API URL Path  (e.g. 'http://localhost:7000/api')
   */
  private apiUrl: string = environment.apiPath;

  /**
   * Constructor
   * @param http - The HttpClient (Injectable)
   */
  constructor(private http: HttpClient) { }

  /**
   * Put request
   * @param data - The data value of the request (e.g. 1000)
   * @param path - The path of the request (e.g. 'simulation/sitac/refreshperiod')
   * @returns Observable<any> - The response of the request
   */
  public put(data: unknown, path: string): Observable<object> {
    const url = `${this.apiUrl}/${path}/${data}`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http.put(url, null, httpOptions)
  }
}
