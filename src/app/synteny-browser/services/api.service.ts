import { environment } from '../../../environments/environment';
import {
  ArrayResponse,
  GeneMetadata,
  JSONResponse,
  OntologyGeneMetadata,
  OntologyTerm,
  QTLMetadata,
} from '../classes/interfaces';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SyntenyBlock } from '../classes/synteny-block';
import { Feature } from '../classes/feature';
import { Species } from '../classes/species';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private root: string = environment.newRoot;

  constructor(private http: HttpClient) { }

  /**
   * Returns a list of all genes belonging to the specified species (by taxon ID)
   * @param {string} taxonID - stringified taxon ID for the reference species
   */
  getAllGenes(taxonID: string): Observable<Feature[]> {
    return this.http.get<Feature[]>(`${this.root}/genes/metadata/${taxonID}`)
                    .pipe(map(resp => resp.map(g => new Feature(g))));
  }

  /**
   * Returns a list of all QTLs belonging to the specified species (by taxon ID)
   * @param {string} taxonID - stringified taxon ID for the reference species
   */
  getAllQTLs(taxonID: string): Observable<Feature[]> {
    return this.http.get<Feature[]>(`${this.root}/qtls/${taxonID}`)
                    .pipe(map(resp => resp.map(q => new Feature(q))));
  }

  /**
   * Returns a list of ontology terms that exist for the specified ontology
   * @param {string} ontology - ontology ID prefix
   */
  getOntologyTerms(ontology: string): Observable<OntologyTerm[]> {
    return this.http.get<ArrayResponse>(`${this.root}/ontologies/terms/${ontology}`);
  }

  /**
   * Returns a list of associations for the specified species (by taxon ID) and
   * ontology term
   * @param {string} taxonID - stringified taxon ID for the desired species
   * @param {string} termID - string to search for genes by matching ontologies
   */
  getAssociationsForTerm(taxonID: string, termID: string): Observable<Feature[]> {
    let url = `${this.root}/ontologies/associations/${taxonID}/${termID}`;

    return this.http.get<ArrayResponse>(url)
                    .pipe(map(resp => resp.map(g => new Feature(g, true))));
  }

  /**
   * Returns a list of ontology term names and IDs for the specified ontology
   * @param {string} ontology - ontology ID prefix
   */
  getTermsForAutocomplete(ontology: string): Observable<OntologyTerm[]> {
    let url = `${this.root}/ontologies/terms/simple/${ontology}`;

    return this.http.get<ArrayResponse>(url);
  }

  /**
   * Returns a list of species that are present in the database
   */
  getSpecies(): Observable<Species[]> {
    return this.http.get<ArrayResponse>(`${this.root}/species`)
                    .pipe(map(resp => resp.map(s => new Species(s.organism))));
  }

  /**
   * Returns a list of syntenic block data that spans all chromosomes (for
   * purposes of the genome view)
   * @param {string} refID - stringified taxon ID for reference species
   * @param {string} compID - stringified taxon ID for comparison species
   */
  getGenomeSynteny(refID: string, compID: string): Observable<SyntenyBlock[]> {
    let url = `${this.root}/blocks/${refID}/${compID}`;

    return this.http.get<ArrayResponse>(url)
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
    let url = `${this.root}/blocks/${refID}/${compID}/${chr}`;

    return this.http.get<ArrayResponse>(url)
                    .pipe(map(resp => resp.map(b => new SyntenyBlock(b, true))));
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
    let url = `${this.root}/homologs/${refID}/${compID}/${refChr}`;

    return this.http.get<ArrayResponse>(url);
  }

  /**
   * Returns color hex value dictionary for chromosomes
   */
  getGenomeColorMap(): Observable<any> {
    return this.http.get<JSONResponse>(`${this.root}/color-map`);
  }

  /**
   * Returns a list of QTLs for the specified species and chromosome
   * @param {string} taxonID - stringified taxon ID for species
   * @param {string} chr - the chromosome to get QTLs for
   */
  getQTLsByChr(taxonID: string, chr: string): Observable<any[]> {
    return this.http.get<ArrayResponse>(`${this.root}/qtls/${taxonID}/${chr}`);
  }
}
