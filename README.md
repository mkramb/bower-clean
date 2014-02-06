## Removes files (e.g. docs, tests, etc.)

Main parsing logic was taken from grunt-bower-clean.

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
    "jquery": ["**/!(jquery.js)"],
    "underscore": ["**/!(underscore.js)"]
  }
}
```

## Usage

```
bin/bower-clean --help
bin/bower-clean --dryRun
bin/bower-clean
```
