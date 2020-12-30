import { Component } from '@angular/core';

@Component({
  selector: 'filtering-guide',
  template: `
    <div class="clr-row">
      <clr-stack-view class="clr-col-12">
        <clr-stack-header> Block View Filtering Guide </clr-stack-header>
        <clr-stack-block [clrSbExpanded]="true">
          <clr-stack-label> Summary </clr-stack-label>
          <clr-stack-block class="block-body">
            <p>
              The block view browser contains a lot of information and much of it may not be
              pertinent to what you’re looking for. You have the ability to select features from the
              feature table towards the top of the application, which will appear in red in the
              block view, but filtering can add another level of focus to features or regions of
              interest.
            </p>
          </clr-stack-block>
        </clr-stack-block>
        <clr-stack-block>
          <clr-stack-label> Adding/Editing Filters </clr-stack-label>
          <clr-stack-block>
            <clr-stack-label> Anatomy of a Filter </clr-stack-label>
            <clr-stack-block class="block-body">
              <p>
                Createa a new filter by clicking the 'Add Filter' button to the right of the filter
                list. Once a new filter is created, using the options and dropdown menu, you are
                provided options to construct the filter instructions. If the condition you select
                requires an input value, a field to enter that input will become available.
              </p>
              <ul class="list">
                <li>
                  <b>Species:</b> identifies the species that the filter will look for matches in.
                  If the selected species is the reference, the current reference chromosome will be
                  searched for matches. If the selected species is the comparison, the regions in
                  the comparison genome that are syntenic to the reference on the current reference
                  chromosome will be searched for matches. If the selected species is ‘In either
                  species’, both of the aforementioned regions will be included in the search.
                </li>
                <li>
                  <b>Mode:</b> filters can operate in one of two modes: hide or highlight. If the
                  selected mode is hide, all features matching the filter will be hidden from view
                  and if the mode is highlight, all features matching the filter will be colored in
                  blue. In the case where a feature matches a hide filter AND a highlight filter,
                  the highlight filter will be prioritized.
                </li>
                <li>
                  <b>Filtering by Type:</b> provides you with a select dropdown with the available
                  types based on the selected species.
                </li>
                <li>
                  <b>Filtering by ID:</b> provides you with an input where you can enter a gene ID
                  select and a dropdown allowing you to choose whether you're looking for exact
                  matches ('that equals'), or "like" matches.
                </li>
                <li>
                  <b>Filtering by Symbol:</b> provides you with an input where you can enter a gene
                  symbol or a prefix and a select dropdown allowing you to choose whether you're
                  looking for exact matches ('that equals'), or "like" matches.
                </li>
                <li>
                  <b>Ontology Term:</b> provies you with a menu of available ontologies based on the
                  selected species. After selecting a specific ontology, an input/select menu will
                  appear for you to search for and select the ontology term you're looking for.
                </li>
                <li>
                  <b>Qualifiers:</b> if filtering by symbol/ID attribute you will get the option to
                  filter by exact match ('that equals') or more fuzzy matching ('that is like').
                  <i
                    >For example, if you were viewing Mouse as the reference species, chromosome 14,
                    and wanted to highlight a series of genes whose symbol starts with ‘traj’ (for
                    which there are several), you’d be able to highlight all of them no matter what
                    numeric suffix they have.</i
                  >
                </li>
                <li>
                  As you fill out the fields in the condition, a filter name will automatically be
                  generated. You can use this default name or you can rename it.
                </li>
              </ul>
            </clr-stack-block>
          </clr-stack-block>
          <clr-stack-block>
            <clr-stack-label> Filter Labels </clr-stack-label>
            <clr-stack-block class="block-body split">
              <ul class="list clr-col-6">
                <li>
                  A filter label contains and summarizes information about how the associated filter
                  is configured.
                </li>
                <li>
                  A blue filter label indicates the associated filter highlights matching features
                  and a red filter label indicates the associated filter hides matching features. If
                  a feature matches a hiding filter and a highlighting filter, the feature will be
                  highlighted as highlighting filters always take precedence over hiding filters.
                </li>
                <li>
                  If a filter is only being applied to one of the species, the species it applies to
                  will be included (by default) in the label. If the filter is to search for matches
                  in either species, the species will not appear in the default label.
                </li>
                <li>
                  Clicking on the ‘X’ in a filter label will delete the associated filter.
                </li>
                <li>
                  Clicking on the text in a filter label will open the associated filter in editing
                  mode below the filter labels.
                </li>
              </ul>
            </clr-stack-block>
          </clr-stack-block>
          <clr-stack-block>
            <clr-stack-label> Adding a New Filter </clr-stack-label>
            <clr-stack-block class="block-body">
              <ul class="list">
                <li>
                  When opening the block view filters modal, you will need to click the 'Add filter'
                  button in the top left of the filter modal.
                </li>
                <li>
                  Once finished with a filter, click the green checkmark button and you will see a
                  colored label appear in the field towards the top of the modal. A blue label
                  indicates a ‘highlight’ filter and a red label indicates a ‘hide’ filter.
                </li>
                <li>
                  If you’re editing a filter and navigate to the guide (as long as you don’t
                  close the modal), your current filter will still be there, in its current state
                  for you to continue editing.
                </li>
                <li>
                  If you’re editing a filter and click on a label of a different filter, the changes
                  to the current filter WILL BE LOST as clicking on the label of a filter will open
                  that filter in editing mode and will overwrite your current filter.
                </li>
              </ul>
            </clr-stack-block>
          </clr-stack-block>
          <clr-stack-block>
            <clr-stack-label> Editing a Filter </clr-stack-label>
            <clr-stack-block class="block-body">
              <ul class="list">
                <li>
                  Clicking on the text of a filter label will open the associated filter in editing
                  mode.
                </li>
                <li>
                  You can edit any parts of the filter in this mode, and when finished, click the
                  green checkmark button.
                </li>
                <li>
                  Clicking on the ‘X’ in a filter label will delete the associated filter.
                </li>
              </ul>
            </clr-stack-block>
          </clr-stack-block>
        </clr-stack-block>
        <clr-stack-block>
          <clr-stack-label> Filter Results </clr-stack-label>
          <clr-stack-block class="block-body">
            <ul class="list">
              <li>
                The filter results table will show the features that will be affected by the current
                combination of filters selected in the checklist. If you haven't created any
                filters, this table will, naturally, be empty.
              </li>
              <li>
                Features that will be hidden by the set of filters will be represented by a red row
                containing the feature’s metadata and those that will be highlighted will be
                represented by a blue row. A feature is only listed once in the table and since
                highlighting filters take precedence over hiding filters, if a feature matches a
                highlighting filter AND a hiding filter, it will appear blue in the table as it will
                be highlighted rather than hidden.
              </li>
              <li>
                The filters that each feature matched to will be listed in the 'filters' column,
                represented by their filter label.
              </li>
              <li>
                If you would like to download the contents of the table, click the ‘download table’
                button at the bottom of the modal to trigger a .txt file containing the metadata for
                all of the features listed in the table including whether they will be highlighted
                or hidden and data on the filters that produce the list of filters.
              </li>
            </ul>
          </clr-stack-block>
        </clr-stack-block>
      </clr-stack-view>
    </div>
  `,
  styleUrls: ['./block-view-filter.component.scss'],
})
export class FilteringGuideComponent {}
