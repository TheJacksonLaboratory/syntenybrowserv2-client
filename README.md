# Synteny Browser

This application utilizes Angular 8

## Installation and Setup

**Prerequisites:** Node and NPM

(If you already have Angular installed, you can skip the following step!)

Install Angular (aka the Angular CLI) globally with `npm install -g @angular/cli`

Using a commandline tool or terminal, navigate to the `synteny-interface` root directory, aka
the level at which this README sits, then run `npm install`. This command installs all of the
packages and libraries required to run the client application locally.

Next locate the `environment.ts` file which should be found in `src/environments`. This file
specifies a few things:
1. production: (default true) for debugging purposes this can be set to false, but you may see a noticeable performance difference as non-production versions of the app don't go through as much optimization at runtime
2. api: this is the URL to the API service you intend to hit. The default is set to the live version of the Synteny Browser API but if you have a custom set of data running in your own API/Database or a custom set of features, you will want to change this URL to the localhost address of that service

Lastly, serve the Angular app with the `ng serve` command and once the build has been served, navigate to localhost:4200 (or if you wish to change the port, navigate to that port instead)

## Testing

Synteny Browser has a passing unit testing suite using [Karma](https://karma-runner.github.io). All major components are tested. To run these suites yourself, use the command `npm run tests` to use the Chrome GUI or `npm run headless-tests` to run all unit tests in the commandline window (will not open test runner in a browser window).

To run specific suites, replace the starting `describe(` with `fdescribe(` of all suites you want to run in isolation. If you want to run the whole set of suites with the exception of a few, you can replace any `describe(` of a suite that you wish to exclude from the run with `xdescribe(`. These two alterations also work with specific tests: `it(` -> `fit(` or `xit(`.

## Linting

Synteny Browser uses a custom set of linting rules that utilize ESLint as well as Prettier. TSLint is still usable on the codebase but has since been deprecated.  

To run the linter, which makes no code changes, only generates a report of errors and warnings, run the command `npm run lint`. The output of this command will be a table of all linting warnings and errors in the codebase.

There is also a function to auto-fix errors and warnings which will typically take care of most, if not all super common issues. Some will, regardless, need manual intervention. To run the linting fixer, run the command `npm run fix`. The fixing process is actually done in two parts. Prettier has a stronger fixer and can apply to several different file types whereas eslint has better customization. The `npm run fix` command runs the Prettier fixer first, then the ESLint fixer second which might revert some of the more heavy-handed changes that the Prettier fixer made. Additionally, Prettier has fewer options to turn rules off or on, so Prettier and ESLint sometimes have conflicting rules, in those cases, we typically default to ESLint rules.  

If the linting fixer seems to have made undesired changes throughout the codebase, it is likely due to the fixers making their changes out of order. Try running `npm run fix-eslint` to isolate the ESLint fixes which will hopefully overwrite those made my Prettier.  
 
 On the rare occassion that an ESLint error cannot be resolved properly. You can disable **a particular rule** by adding `/* eslint-disable <name of the lint rule to disable> */` on the line above the line in question (see `app/synteny-browser/classes/table-data.ts`). If the rule to disable occurs several times in a file putting the disable comment at the top of the file will disable the rule for the entire file (see `app/synteny-browser/block-view-browser/block-view-browser.component.ts`). Any instance of a rule disable must be preceded by an explanation as to why the rule is being disabled.

## Contributing

If you have made changes to Synteny Browser and would like to merge those code changes into the master branch, we ask for three things with regards to this codebase:
1. All existing unit tests pass. If you have not altered intended functionality, all the existing tests should pass across the board. If you have significantly changed functionality, you may update the tests to match your intended functionality. Upon review of a pull request, tests will be run on the code and if any testing code has been changed, all changes will be reviewed thoroughly.
2. New unit tests are written for new functionality. We're not looking for 100% test coverage on the new code (unless you'd like to do so) but a few tests are requested
3. Prior to making a pull request and the linting check is run on the codebase. There should be no errors in the linting report, though we will allow minor warnings. If the linter makes problematic changes that can't be resolved using the tips in the Linting section above, make a note of the linter issue in your PR. If linting rules are disabled in an inappropriate way or are not explained, it will be requested to be updated or removed.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

If you run into problems with Synteny Browser, specifically, feel free to email us at [synbrowser-support@jax.org](mailto:synbrowser-support@jax.org) or create an issue in the synteny-interface repo on Github.
