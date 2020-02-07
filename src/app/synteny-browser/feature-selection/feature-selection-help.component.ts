import { Component } from '@angular/core';

@Component({
  selector: 'feature-selection-help',
  template: `
    <clr-modal clrModalSize="lg" [(clrModalOpen)]="open">
      <h3 class="modal-title">Selecting Features</h3>

      <div class="modal-body">
        <ul>
          <li>
            Use the table(s) to mark genes or QTLs of interest (QTLs are only
            available for species that have them loaded into the database, which
            currently is only Mouse).
          </li>
          <li>
            Clicking on rows in a table containing features will mark that
            feature as selected.
          </li>
          <li>
            Once selected, the feature will appear highlighted in the table,
            have removable tag in the 'Current selections' field below the table
            and will be displayed in the genome view.
          </li>
          <li>
            A feature can be deselected by either clicking on that row in the
            table again or clicking the 'x' in the respective tag. Deselecting a
            feature will make it disappear from the genome view.
          </li>
          <li>
            You can switch between ontology search and feature search using the
            select menu above the visible table without having your selections
            cleared.
          </li>
        </ul>

        <h3>Searching for Features by Attribute</h3>

        <ul>
          <li>
            Selecting the search by feature attribute option (the default) from
            the select menu above the table will start loading a table containing
            genes and QTLs (QTLs are only available for species that have them
            loaded into the database, by default this is mouse only) in the
            reference genome.
          </li>
          <li>
            The table can't be filtered or interacted with until all of the
            features have been loaded in.
          </li>
          <li>
            Once the table has finished loading, it can be filtered/searched by
            entering a value in the 'Search features' field. Valid fields to
            search by would be feature ID, symbol or type.
          </li>
          <li>
            The table can be sorted ascendingly or descendingly by feature ID,
            symbol, type, and chromosome by clicking the table header column
            that you want to sort by and clicking again to change the order.
          </li>
        </ul>

        <h3>Searching for Genes by Ontology Term Association</h3>

        <ul>
          <li>
            Selecting the search by ontology option from the select menu above
            the table will load a table containing terms from the current
            ontology (which can be changed from another select menu above the
            table).
          </li>
          <li>
            The table can be filtered/searched by entering a value in the 'Search
            terms' field. Valid fields to search by would be term ID or name.
          </li>
          <li>
            The table can be sorted ascendingly or descendingly by term ID and
            name by clicking the table header column that you want to sort by
            and clicking again to change the order.
          </li>
          <li>
            Clicking on the arrow on the left-hand side of the a row will expand
            it to see more details such as term definition, namespace and direct
            descendent terms, if there are any.
          </li>
          <li>
            The two icons on the right-hand side of the row will be available
            given that the term has fewer than 200 direct descendant terms
            (otherwise these will be disabled):

            <ul>
              <li>
                View gene associations (list icon) - hides the terms table and
                shows a new table with genes that are associated with the term
                (and descendant terms) you selected. Associations will be listed
                in the table with the term they're associated with. From there
                you can select/deselect, sort, filter, etc.
              </li>
              <li>
                Select gene associations (checkmark icon) - automatically selects
                all gene associations for the selected term (if there are any)
                without needing to see them. You may use this feature and then
                remove undesired genes from the 'Current selections' section.
              </li>
            </ul>
          </li>
          <li>
            At this point in time, it's possible that a term is displayed and:

            <ul>
              <li>
                not have any descendant terms but will have gene associations in
                the reference species, or
              </li>
              <li>
                have descendant terms but not any gene associations in the
                reference species, or
              </li>
              <li>
                not have any descendant terms nor any associations.
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </clr-modal>
  `,
})
export class FeatureSelectionHelpComponent {
  // indicates if the modal is open or not
  open: boolean;
}
