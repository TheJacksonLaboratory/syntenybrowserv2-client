import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SyntenyBlock } from '../classes/synteny-block';
import { Feature } from '../classes/feature';
import { Species } from '../classes/species';
import { TermMetadata } from '../feature-selection/ontology-search/row-detail.component';
import { OntologyTerm } from '../feature-selection/ontology-search/ontology-search.component';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // the url to the API to interface with
  private root: string = environment.api;

  constructor(private http: HttpClient) {}

  /**
   * Returns color hex value dictionary for chromosomes
   */
  getGenomeColorMap(): Observable<any> {
    return this.http.get<JSONResponse>(`${this.root}/color-map`);
  }

  /**
   * Returns a list of species that are present in the database
   */
  getSpecies(): Observable<Species[]> {
    return this.http
      .get<ArrayResponse>(`${this.root}/species`)
      .pipe(map(resp => resp.map(s => new Species(s.organism))));
  }

  /**
   * Returns a list of syntenic block data that spans all chromosomes (for
   * purposes of the genome view)
   * @param {string} refID - stringified taxon ID for reference species
   * @param {string} compID - stringified taxon ID for comparison species
   */
  getGenomeSynteny(refID: string, compID: string): Observable<SyntenyBlock[]> {
    return this.http
      .get<ArrayResponse>(`${this.root}/blocks/${refID}/${compID}`)
      .pipe(map(resp => resp.map(b => new SyntenyBlock(b))));
  }

  /**
   * Returns a list of syntenic block data that spans a specified chromosome for
   * the specified reference and comparison species
   * @param {string} refID - stringified taxon ID for reference species
   * @param {string} compID - stringified taxon ID for comparison species
   * @param {string} chr - the chromosome to get blocks for
   */
  getChrSynteny(refID: string, compID: string, chr: string): Observable<SyntenyBlock[]> {
    return this.http
      .get<ArrayResponse>(`${this.root}/blocks/${refID}/${compID}/${chr}`)
      .pipe(map(resp => resp.map(b => new SyntenyBlock(b, true))));
  }

  /**
   * Returns a list of genes for a specified chromosome and reference species
   * @param {string} refID - stringified taxon ID for reference species
   * @param {string} chr - the chromosome to get genes for
   */
  getGeneMetadata(refID: string, chr: string): Observable<Feature[]> {
    return this.http
      .get<ArrayResponse>(`${this.root}/genes/metadata/${refID}/${chr}`)
      .pipe(map(resp => resp.map(g => new Feature(g))));
  }

  /**
   * Returns a list of genes for a specified chromosome and reference species
   * with homolog data for the specified comparison species
   * @param {string} refID - stringified taxon ID for reference species
   * @param {string} chr - the chromosome to get genes for
   */
  getGenes(refID: string, chr: string): Observable<any[]> {
    return this.http.get<ArrayResponse>(`${this.root}/genes/${refID}/${chr}`);
  }

  /**
   * Returns a list of genes for a specified reference chromsome and comparison
   * species that are homologous in the specified reference species
   * @param {string} refID - stringified taxon ID for reference species
   * @param {string} compID - stringified taxon ID for comparison species
   * @param {string} refChr - the reference chromosome to get homologs for
   */
  getHomologs(refID: string, compID: string, refChr: string): Observable<any[]> {
    return this.http.get<ArrayResponse>(`${this.root}/homologs/${refID}/${compID}/${refChr}`);
  }

  /**
   * Returns a list of all QTLs belonging to the specified species (by taxon ID)
   * @param {string} taxonID - stringified taxon ID for the reference species
   */
  getQTLs(taxonID: string): Observable<Feature[]> {
    return this.http
      .get<Feature[]>(`${this.root}/qtls/${taxonID}`)
      .pipe(map(resp => resp.map(q => new Feature(q))));
  }

  /**
   * Returns namespace, definition and direct descendant terms for the term
   * associated with the specified term ID
   * @param {string} termID - ID of the term to get metadata for
   */
  getTermMetadata(termID: string): Observable<TermMetadata> {
    return this.http
      .get<ArrayResponse>(`${this.root}/ontologies/metadata/${termID}`)
      .pipe(map(resp => resp[0]));
  }

  /**
   * Returns a list of associations for the specified species (by taxon ID) and
   * ontology term
   * @param {string} taxonID - stringified taxon ID for the desired species
   * @param {string} termID - string to search for genes by matching ontologies
   */
  getTermAssociations(taxonID: string, termID: string): Observable<Feature[]> {
    return this.http
      .get<ArrayResponse>(`${this.root}/ontologies/associations/${taxonID}/${termID}`)
      .pipe(map(resp => resp.map(g => new Feature(g, true))));
  }

  /**
   * Returns a list of ontology term names and IDs for the specified ontology
   * @param {string} ontology - ontology ID prefix
   */
  getOntologyTerms(ontology: string): Observable<OntologyTerm[]> {
    return this.http.get<ArrayResponse>(`${this.root}/ontologies/terms/simple/${ontology}`);
  }

  /**
   * Returns a list of cytogenetic band objects for the specified species and
   * chromosome
   * @param {string} taxonID - stringified taxon ID for the desired species
   * @param {string} chr - the chromosome to get bands for
   */
  getChrCytoBands(taxonID: string, chr: string): Observable<any[]> {
    return this.http.get<ArrayResponse>(`${this.root}/bands/${taxonID}/${chr}`);
  }
}

export type ArrayResponse = Array<any>;

export type JSONResponse = Record<string, any>;
