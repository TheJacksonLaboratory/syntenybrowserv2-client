import { environment } from '../../../environments/environment';
import { GeneMetadata, OntologyGeneMetadata, OntologyTerm, QTLMetadata, Response } from '../classes/interfaces';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SyntenyBlock } from '../classes/synteny-block';
import { Feature } from '../classes/feature';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private oldRoot: string = environment.oldRoot;
  private newRoot: string = environment.newRoot;

  constructor(private http: HttpClient) { }

  /**
   * Returns a list of all genes belonging to the specified species (by taxon ID)
   * @param {string} taxonID - stringified taxon ID for the reference species
   */
  getAllGenes(taxonID: string): Observable<Array<Feature>> {
    let url = `${this.newRoot}/genes/metadata/${taxonID}`;
    return this.http.get<Array<Feature>>(url)
                    .pipe(map(resp => resp.map(g => new Feature(g))));
  }

  /**
   * Returns a list of all QTLs belonging to the specified species (by taxon ID)
   * @param {string} taxonID - stringified taxon ID for the reference species
   */
  getAllQTLs(taxonID: string): Observable<Array<Feature>> {
    let url = `${this.newRoot}/qtls/${taxonID}`;
    return this.http.get<Array<Feature>>(url)
                    .pipe(map(resp => resp.map(q => new Feature(q))));
  }

  /**
   * Returns a list of ontology terms that exist for the specified ontology
   * @param {string} ontology - ontology ID prefix
   */
  getOntologyTerms(ontology: string): Observable<Array<OntologyTerm>> {
    let url = `${this.oldRoot}/ontologies/terms/${ontology}`;
    return this.http.get<Response>(url).pipe(map(resp => resp.terms));
  }

  /**
   * Returns a list of associations for the specified species (by taxon ID) and
   * ontology term
   * @param {string} taxonID - stringified taxon ID for the desired species
   * @param {string} termID - string to search for genes by matching ontologies
   */
  getAssociationsForTerm(taxonID: string, termID: string): Observable<Array<Feature>> {
    let url = `${this.oldRoot}/ontologies/associations/${taxonID}/${termID}`;

    return this.http.get<Response>(url)
                    .pipe(
                      map(resp => resp.genes.map(g => new Feature(g, true)))
                    );
  }

  /**
   * Returns a list of ontology term names and IDs for the specified ontology
   * @param {string} ontology - ontology ID prefix
   */
  getTermsForAutocomplete(ontology: string): Observable<Array<any>> {
    let url = `${this.oldRoot}/ontologies/terms/simple/${ontology}`;
    return this.http.get<Response>(url).pipe(map(resp => resp.terms));
  }

  /**
   * Returns a list of species that present in the database
   * TODO: Currently we're getting taxon IDs using a query not really intended
   * TODO: for this, not to mention that the DB doesn't actually have a table
   * TODO: for just species and species-related data. We need a loader script
   * TODO: that takes a config like we have in the original repo and turn each
   * TODO: one into a row in a relational table
   */
  getSpecies(): Observable<Array<number>> {
    return this.http.get<Array<any>>(`${this.newRoot}/species`)
                    .pipe(map(resp => resp.map(s => s.organism.taxon_id).sort()));
  }

  /**
   * Returns a list of syntenic block data that spans all chromosomes (for
   * purposes of the genome view)
   * @param {string} refTaxonID - stringified taxon ID for reference species
   * @param {string} compTaxonID - stringified taxon ID for comparison species
   */
  getGenomeSynteny(refTaxonID: string, compTaxonID: string)
                  : Observable<Array<SyntenyBlock>> {
    let url = `${this.newRoot}/blocks/${refTaxonID}/${compTaxonID}`;
    return this.http.get<Array<SyntenyBlock>>(url)
                    .pipe(map(resp => resp.map(b => new SyntenyBlock(b))));
  }

  /**
   * Returns a list of syntenic block data that spans a specified chromosome for
   * the specified reference and comparison species
   * @param {string} refTaxonID - stringified taxon ID for reference species
   * @param {string} compTaxonID - stringified taxon ID for comparison species
   * @param {string} chr - the chromosome to get blocks for
   */
  getChromosomeSynteny(refTaxonID: string, compTaxonID: string, chr: string)
                      : Observable<Array<SyntenyBlock>> {
    let url = `${this.newRoot}/blocks/${refTaxonID}/${compTaxonID}/${chr}`;
    return this.http.get<Array<SyntenyBlock>>(url)
                    .pipe(map(resp => resp.map(b => new SyntenyBlock(b, true))));
  }

  /**
   * Returns a list of genes for a specified chromosome and reference species
   * with homolog data for the specified comparison species
   * @param {string} refTaxonID - stringified taxon ID for reference species
   * @param {string} chr - the chromosome to get genes for
   */
  getGenes(refTaxonID: string, chr: string)
          : Observable<Array<any>> {
    let url = `${this.newRoot}/genes/${refTaxonID}/${chr}`;
    return this.http.get<Array<any>>(url);
  }

  getHomologs(refTaxonID: string, compTaxonID: string, refChr: string)
             : Observable<Array<any>> {
    let url = `${this.newRoot}/homologs/${refTaxonID}/${compTaxonID}/${refChr}`;
    return this.http.get<Array<Feature>>(url);
  }

  /**
   * Returns color hex value dictionary for chromosomes
   */
  getGenomeColorMap(): Observable<any> {
    return this.http.get<any>(`${this.newRoot}/color-map`);
  }

  /**
   * Returns a list of QTLs for the specified species and chromosome
   * @param {string} taxonID - stringified taxon ID for species
   * @param {string} chr - the chromosome to get QTLs for
   */
  getQTLsByChr(taxonID: string, chr: string): Observable<Array<any>> {
    let url = `${this.newRoot}/chr-qtls/${taxonID}/${chr}`;
    return this.http.get<Array<any>>(url).pipe(map(resp => resp));
  }
}
