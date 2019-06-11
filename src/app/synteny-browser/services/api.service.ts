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
  private root: string = environment.root;

  constructor(private http: HttpClient) { }

  /**
   * Returns a list of all genes belonging to the specified species (by taxon ID)
   * @param {string} taxonID - stringified taxon ID for the reference species
   */
  getAllGenes(taxonID: string): Observable<Array<Feature>> {
    let url = `${this.root}/genes/${taxonID}`;
    return this.http.get<Response>(url)
                    .pipe(
                      map(resp => resp.genes.map(g => new Feature(g)))
                    );
  }

  /**
   * Returns a list of all QTLs belonging to the specified species (by taxon ID)
   * @param {string} taxonID - stringified taxon ID for the reference species
   */
  getAllQTLs(taxonID: string): Observable<Array<Feature>> {
    let url = `${this.root}/qtls/${taxonID}`;
    return this.http.get<Response>(url)
                    .pipe(
                      map(resp => resp.qtls.map(q => new Feature(q)))
                    );
  }

  /**
   * Returns a list of ontology terms that exist for the specified species (by
   * taxon ID) and ontology
   * @param {string} taxonID - stringified taxon ID for the reference species
   * @param {string} ontology - ontology ID prefix
   */
  getOntologyTerms(taxonID: string, ontology: string)
                  : Observable<Array<OntologyTerm>> {
    let url = `${this.root}/ontologies/terms/${ontology}/${taxonID}`;
    return this.http.get<Response>(url)
                    .pipe(map(resp => resp.terms));
  }

  /**
   * Returns a list of associations for the specified species (by taxon ID) and ontology
   * which also matches the search term
   * @param {string} taxonID - stringified taxon ID for the reference species
   * @param {string} ontology - ontology ID prefix
   * @param {string} search - string to search for genes by matching ontologies
   */
  getGeneAssociationsForTerm(ontology: string, search: string, taxonID: string = null)
                   : Observable<Array<Feature>> {
    let url = taxonID ?
      `${this.root}/ontologies/associations/${ontology}/${taxonID}/${search}` :
      `${this.root}/ontologies/associations/${ontology}/${search}`;
    return this.http.get<Response>(url)
                    .pipe(
                      map(resp => resp.genes.map(g => new Feature(g, true)))
                    );
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
    return this.http.get<Response>(`${this.root}/species`)
                    .pipe(
                      map(resp => resp.species.map(s => s.ref_taxonid).sort())
                    );
  }

  /**
   * Returns a list of syntenic block data that spans all chromosomes (for
   * purposes of the genome view)
   * @param {string} refTaxonID - stringified taxon ID for reference species
   * @param {string} compTaxonID - stringified taxon ID for comparison species
   */
  getGenomeSynteny(refTaxonID: string, compTaxonID: string)
                  : Observable<Array<SyntenyBlock>> {
    let url = `${this.root}/syntenic-blocks/${refTaxonID}/${compTaxonID}`;
    return this.http.get<Response>(url)
                    .pipe(
                      map(resp => resp.blocks.map(b => new SyntenyBlock(b)))
                    );
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
    let url = `${this.root}/syntenic-blocks/${refTaxonID}/${compTaxonID}/${chr}`;
    return this.http.get<Response>(url)
                    .pipe(
                      map(resp => {
                        return resp.blocks.map(b => new SyntenyBlock(b, true));
                      })
                    );
  }

  /**
   * Returns a list of genes for a specified chromosome and reference species
   * with homolog data for the specified comparison species
   * @param {string} refTaxonID - stringified taxon ID for reference species
   * @param {string} compTaxonID - stringified taxon ID for comparison species
   * @param {string} chr - the chromosome to get genes for
   */
  getGenes(refTaxonID: string, compTaxonID: string, chr: string)
          : Observable<Array<any>> {
    let url = `${this.root}/chr-genes/${refTaxonID}/${compTaxonID}/${chr}`;
    return this.http.get<Response>(url).pipe(map(resp => resp.genes));
  }

  /**
   * Returns color hex value dictionary for chromosomes
   */
  getGenomeColorMap(): Observable<any> {
    return this.http.get<Response>(`${this.root}/genome-colors`);
  }

  /**
   * Returns a list of QTLs for the specified species and chromosome
   * @param {string} taxonID - stringified taxon ID for species
   * @param {string} chr - the chromosome to get QTLs for
   */
  getQTLsByChr(taxonID: string, chr: string): Observable<Array<any>> {
    let url = `${this.root}/chr-qtls/${taxonID}/${chr}`;
    return this.http.get<Response>(url).pipe(map(resp => resp.qtls));
  }
}
