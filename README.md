## bower-clean

Remove files (e.g. docs, tests, etc.) from installed bower component. For matching it uses minimatch.

## Configuration

```
{
  "name": "app",
  "ignore": [
    "**/.*",
    "node_modules",
    "test",
    "tests"
  ],
  "dependencies": {
    "jquery": "1.11.0",
    "underscore": "1.5.2"
  },
  "dependenciesIgnore": {
    "jquery": [ "!**/jquery.js" ],
    "underscore": [ "!**/underscore.js" ]
  }
}
```

## Install

```
npm install -g bower-clean
```


## Usage

```
bower-clean --help
bower-clean --dryRun
bower-clean
```
