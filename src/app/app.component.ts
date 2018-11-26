import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {ApiService} from './services/api.service';
import {Species} from './classes/species';
import {SpeciesSelectionComponent} from './species-selection/species-selection.component';
import {GenomeViewComponent} from './genome-view/genome-view.component';
import {FeatureSelectionComponent} from './feature-selection/feature-selection.component';
import {BlockViewBrowserComponent} from './block-view-browser/block-view-browser.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild(SpeciesSelectionComponent) species: SpeciesSelectionComponent;
  @ViewChild(FeatureSelectionComponent) features: FeatureSelectionComponent;
  @ViewChild(GenomeViewComponent) genomeView: GenomeViewComponent;
  @ViewChild(BlockViewBrowserComponent) blockViewBrowser: BlockViewBrowserComponent;

  refSpecies: Species;
  compSpecies: Species;
  genomeColors: any;

  viewInBrowser: boolean = false;

  constructor(private http: ApiService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    console.log('init');
    // get the color map for genomes
    this.http.getGenomeColorMap().subscribe(colors => {
      this.genomeColors = colors;

      console.log('getting species');
      // get available species from the API
      this.http.getSpecies().subscribe(species => {
        // create species objects for every species and send them to the selection component
        this.species.setSpecies(species.map(id => new Species(id)));

        this.updateSpecies();
      });
    });
  }

  /**
   * Updates the reference and comparison variables with the most recent selections
   */
  updateSpecies(): void {
    console.log('species updated');
    // update the species variables with the most recent selections made by the user
    this.refSpecies = this.species.getReferenceSelection();
    this.compSpecies = this.species.getComparisonSelection();

    // allow the species selects to stabilize
    this.cdr.detectChanges();

    // init the feature selection using the most recent reference species
    this.features.load(this.refSpecies);

    // render the genome view for the new selections
    this.genomeView.render(this.refSpecies, this.compSpecies, this.genomeColors);

    // TODO: this is a shortcut call to streamline the process down to the block view browser
    // TODO: REMOVE WHEN FINISHED
    this.viewInBrowser = true;
    this.cdr.detectChanges();
    this.blockViewBrowser.render(this.refSpecies, this.compSpecies, this.genomeColors, "1", []);
  }

  getChromosomeFeatures() {
    // show block view browser
    this.viewInBrowser = true;

    // get the list of features (if any) for the selected chromosome
    let features = this.genomeView.getChromosomeFeaturesToView();

    // allow the block view browser to initialize
    this.cdr.detectChanges();

    this.blockViewBrowser.render(this.refSpecies, this.compSpecies, this.genomeColors, features.chr, features.features);
  }

}
