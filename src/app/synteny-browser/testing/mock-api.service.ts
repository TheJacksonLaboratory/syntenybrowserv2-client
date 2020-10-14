import { Observable, of } from 'rxjs';
import { SyntenyBlock } from '../classes/synteny-block';
import { MOUSE_TO_HUMAN_SYNTENY } from './constants/genome-synteny';
import { map } from 'rxjs/operators';
import { COLOR_MAP } from './constants/color-map';

export class MockApiService {
  getGenomeSynteny(refID: string, compID: string): Observable<SyntenyBlock[]> {
    return of(MOUSE_TO_HUMAN_SYNTENY)
      .pipe(map(resp => resp.map(b => new SyntenyBlock(b))));
  }

  getGenomeColorMap(): Observable<any> {
    return of(COLOR_MAP);
  }
}
