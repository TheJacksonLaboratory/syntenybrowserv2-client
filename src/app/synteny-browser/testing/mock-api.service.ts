import { Observable, of } from 'rxjs';
import { SyntenyBlock } from '../classes/synteny-block';
import { MOUSE_HUMAN_CHR_1, MOUSE_TO_HUMAN_SYNTENY } from './constants/genome-synteny';
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
import { OntologyTerm } from '../feature-selection/ontology-search/ontology-search.component';
import { GO, MOUSE_GO_ASSOC } from './constants/ontology-terms';
import { GWASHit } from '../classes/gwas-location';
import { MOUSE_CYTO_CHR_1 } from './constants/cytobands';
import { HUMAN_GWAS_COMP_CHR_1, HUMAN_GWAS_REF_CHR_1 } from './constants/gwas-hits';
import { MOUSE_HUMAN_GENES_CHR_1, MOUSE_HUMAN_HOMOLOGS_CHR_1 } from './constants/block-view-features';

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

  getOntologyTerms(ontology: string): Observable<OntologyTerm[]> {
    return of(GO);
  }

  getTermAssociations(taxonID: string, termID: string): Observable<Feature[]> {
    if (termID.toLowerCase() === 'go:0002003') {
      return of(MOUSE_GO_ASSOC['GO:0002003'].map(a => new Feature(a, true)));
    } else if (termID.toLowerCase() === 'go:0002020') {
      return of(MOUSE_GO_ASSOC['GO:0002020'].map(a => new Feature(a, true)));
    }
  }

  getChrCytoBands(taxonID: string, chr: string): Observable<any[]> {
    return of(MOUSE_CYTO_CHR_1);
  }

  getChrGWASHits(taxonID: string, chr: string, traitID: string): Observable<GWASHit[]> {
    return of(HUMAN_GWAS_REF_CHR_1);
  }

  getGenomeGWASHits(taxonID: string, traitID: string): Observable<GWASHit[]> {
    return of(HUMAN_GWAS_COMP_CHR_1);
  }

  getChrSynteny(refID: string, compID: string, chr: string): Observable<SyntenyBlock[]> {
    return of(MOUSE_HUMAN_CHR_1);
  }

  getGenes(refID: string, chr: string): Observable<any[]> {
    return of(MOUSE_HUMAN_GENES_CHR_1);
  }

  getHomologs(refID: string, compID: string, refChr: string): Observable<any[]> {
    // MUY IMPORTANTE: Because the 'homologs' property of each homolog is altered and gets
    // passed between tests so we need to make sure a new copy is passed each time
    return of(JSON.parse(JSON.stringify(MOUSE_HUMAN_HOMOLOGS_CHR_1)));
  }
}
