import { ApiService } from './services/api.service';
import { BlockViewBrowserComponent } from './block-view-browser/block-view-browser.component';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FeatureSelectionComponent } from './feature-selection/feature-selection.component';
import { BlockViewFilterComponent } from './block-view-filter/block-view-filter.component';
import { GenomeViewComponent } from './genome-view/genome-view.component';
import { FilterCondition, Metadata } from './classes/interfaces';
import { Species } from './classes/species';
import { SpeciesSelectionComponent } from './species-selection/species-selection.component';
import { Filter } from './classes/filter';

@Component({
  selector: 'app-synteny-browser',
  templateUrl: './synteny-browser.component.html'
})

export class SyntenyBrowserComponent implements OnInit {
  @ViewChild(SpeciesSelectionComponent) species: SpeciesSelectionComponent;
  @ViewChild(FeatureSelectionComponent) features: FeatureSelectionComponent;
  @ViewChild(GenomeViewComponent) genomeView: GenomeViewComponent;
  @ViewChild(BlockViewBrowserComponent) blockViewBrowser: BlockViewBrowserComponent;
  @ViewChild(BlockViewFilterComponent) blockViewFilters: BlockViewFilterComponent;

  refSpecies: Species;
  compSpecies: Species;
  genomeColors: any;

  viewInBrowser: boolean = false;

  filterOpen: boolean = false;
  filters: Array<Filter> = [];

  constructor(private http: ApiService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    // get the color map for genomes
    this.http.getGenomeColorMap().subscribe(colors => {
      this.genomeColors = colors;

      // get available species from the API
      this.http.getSpecies().subscribe(species => {
        // create species for species and pass them to the selection component
        this.species.setSpecies(species.map(id => new Species(id)));

        this.updateSpecies();
      });
    });
  }


  // Operational Methods

  /**
   * Updates reference and comparison species with the most recent selections,
   * loads the feature search with features for the reference species and
   * renders the genome view with the updated reference and comparison species
   */
  updateSpecies(): void {
    this.viewInBrowser = false;
    // update the species
    this.refSpecies = this.species.getReferenceSelection();
    this.compSpecies = this.species.getComparisonSelection();

    // allow the species selects to stabilize
    this.cdr.detectChanges();

    // render the genome view for the new selections
    this.genomeView.render(this.refSpecies, this.compSpecies, this.genomeColors);

    // load the feature selection using the most recent reference species
    // do this second as it might take a second or two
    this.features.load(this.refSpecies);
  }

  /**
   * Updates the genome view with the current selections from the feature search
   */
  updateFeatures(): void {
    this.genomeView.updateFeatures(this.features.selections);
  }


  // Getter Methods

  /**
   * Show the block view browser and pass the reference and comparison species,
   * color dictionary, selected chromosome, and the features in the selected
   * chromosome (if any) to the block view browser
   */
  getChromosomeFeatures() {
    // show block view synteny-browser
    this.viewInBrowser = true;

    // get the list of features (if any) for the selected chromosome
    let features = this.genomeView.getChromosomeFeaturesToView();

    // allow the block view synteny-browser to initialize
    this.cdr.detectChanges();

    this.blockViewBrowser.render(this.refSpecies,
                                 this.compSpecies,
                                 this.genomeColors,
                                 features.chr,
                                 features.features);

    setTimeout(() => {
      // TODO: this currently only will work in Firefox and Chrome
      document.getElementById('block-view')
              .scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  }

  /**
   * Updates the block view with the most recent filter conditions
   */
  getFilters(): void {
    this.filterOpen = false;
    this.filters = this.blockViewFilters.getCreatedFilters();

    this.blockViewBrowser.applyFilters(this.filters);
  }
}
