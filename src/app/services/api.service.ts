import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {GeneMetadata, OntologyGeneMetadata, QTLMetadata, Response} from '../classes/interfaces';
import {SyntenyBlock} from '../classes/synteny-block';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private root: string = environment.root;

  constructor(private http: HttpClient) { }

  /**
   * Returns a list of genes belonging to the specified species (by taxon ID) which also matches the search string
   * @param {string} taxonID - stringified taxon ID for the reference species
   * @param {string} search - string to search for genes by
   */
  getGeneMatches(taxonID: string, search: string): Observable<Array<GeneMetadata>> {
    return this.http.get<Response>(this.root + 'genes/' + taxonID + '/' + search)
                    .pipe(map(resp => resp.genes));
  }

  /**
   * Returns a list of QTLs belonging to the specified species (by taxon ID) which also matches the search string
   * @param {string} taxonID - stringified taxon ID for the reference species
   * @param {string} search - string to search for QTLs by
   */
  getQTLMatches(taxonID: string, search: string): Observable<Array<QTLMetadata>> {
    return this.http.get<Response>(this.root + 'qtls/' + taxonID + '/' + search)
                    .pipe(map(resp => resp.qtls));
  }

  /**
   * Returns a list of genes belonging to the specified ontology (by taxon ID) which also matches the ont search term
   * @param {string} taxonID - stringified taxon ID for the reference species
   * @param {string} ontType - ontology type keyword
   * @param {string} search - string to search for genes by matching ontologies
   */
  getOntGeneMatches(taxonID: string, ontType: string, search: string): Observable<Array<OntologyGeneMetadata>> {
    return this.http.get<Response>(this.root + 'ont/' + ontType + '/genes/' + taxonID + '/' + search)
                    .pipe(map(resp => resp.ont_genes));
  }

  /**
   * Returns a list of species that present in the database
   * TODO: Currently we're getting taxon IDs using a query not really intended for this, not to mention
   * TODO: that the DB doesn't actually have a table for just species and species-related data. We need
   * TODO: a loader script that takes a config like we have in the original repo and turn each one into
   * TODO: a row in a relational table
   */
  getSpecies(): Observable<Array<number>> {
    return this.http.get<Response>(this.root + 'species')
                    .pipe(map(resp => resp.species.map(species => species.ref_taxonid).sort()))
  }

  /**
   * Returns a list of syntenic block data that spans all chromosomes (for purposes of the genome view)
   * @param {string} refTaxonID - the stringified taxon ID for the reference species
   * @param {string} compTaxonID - the stringified taxon ID for the comparison species
   */
  getGenomeSynteny(refTaxonID: string, compTaxonID: string): Observable<Array<SyntenyBlock>> {
    return this.http.get<Response>(this.root + 'syntenic-blocks/' + refTaxonID + '/' + compTaxonID)
                    .pipe(map(resp => resp.blocks.map(block => new SyntenyBlock(block))));
  }

  getChromosomeSynteny(refTaxonID: string, compTaxonID: string, chr: string): Observable<Array<SyntenyBlock>> {
    return this.http.get<Response>(this.root + 'syntenic-blocks/' + refTaxonID + '/' + compTaxonID + '/' + chr)
                    .pipe(map(resp => resp.blocks.map(block => new SyntenyBlock(block, true))));
  }

  getGenes(refTaxonID: string, compTaxonID: string, chr: string): Observable<Array<any>> {
    return this.http.get<Response>(this.root + 'chr-genes/' + refTaxonID + '/' + compTaxonID + '/' +chr).pipe(map(resp => resp.genes));
  }

  getGenomeColorMap(): Observable<any> {
    return this.http.get<Response>(this.root + 'genome-colors');
  }
}
