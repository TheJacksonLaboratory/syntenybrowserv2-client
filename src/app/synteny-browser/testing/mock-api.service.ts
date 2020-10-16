import { Observable, of } from 'rxjs';
import { SyntenyBlock } from '../classes/synteny-block';
import { MOUSE_TO_HUMAN_SYNTENY } from './constants/genome-synteny';
import { map } from 'rxjs/operators';
import { COLOR_MAP } from './constants/color-map';
import { Feature } from '../classes/feature';
import {
  HUMAN_FEATURES_CHR_1,
  HUMAN_FEATURES_CHR_3,
  MOUSE_FEATURES_CHR_2,
  SELECTED_FEATURES_NO_SYNTENY,
  SELECTED_QTL_FEATURES
} from './constants/mock-features';

export class MockApiService {
  getGenomeSynteny(refID: string, compID: string): Observable<SyntenyBlock[]> {
    return of(MOUSE_TO_HUMAN_SYNTENY)
      .pipe(map(resp => resp.map(b => new SyntenyBlock(b))));
  }

  getGenomeColorMap(): Observable<any> {
    return of(COLOR_MAP);
  }

  getGeneMetadata(refID: string, chr: string): Observable<Feature[]> {
    if (refID === '10090') {
      if (chr === '1') {
        return of(SELECTED_FEATURES_NO_SYNTENY);
      } else if (chr === '2') {
        return of(MOUSE_FEATURES_CHR_2);
      } else {
        return of([]);
      }
    } else if (refID === '9606') {
      if (chr === '1') {
        return of(HUMAN_FEATURES_CHR_1);
      } else if (chr === '3') {
        return of(HUMAN_FEATURES_CHR_3);
      } else {
        return of([]);
      }
    }
  }

  getQTLs(taxonID: string): Observable<Feature[]> {
    return of(SELECTED_QTL_FEATURES);
  }
}
