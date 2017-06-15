#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const package_json = path.resolve('./package.json');
const tsconfig_json = path.resolve('./tsconfig.json');
const webpack_config_js = path.resolve('./webpack.config.js');
const git_ignore_file = path.resolve('./.gitignore');
const index_html = path.resolve('./index.html');
const main_tsx = path.resolve('./main.tsx');
const execSync = require('child_process').execSync;
const program = require('commander');

// webpack 2.x
const webpack_config = `const path = require('path');
module.exports = {
  entry: {
    'app': './main.tsx',
  },
  output: {
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  },
  devServer: {
  }
}`;

const tsconfig = `{
  "compilerOptions": {
    "target": "es5",
    "jsx": "react",
    "reactNamespace": "app",
    "lib": ["dom", "es2015", "es5"]
  }
}`

const git_ignore =
`.DS_Store
node_modules
*.log
`;

const index = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>apprun</title>
</head>
<body>
  <div id="my-app"></div>
  <script src="app.js"></script>
</body>
</html>`;

const main = `import app from './node_modules/apprun/index';
const model = 'Hello world - AppRun';
const view = (state) => <h1>{state}</h1>;
const update = {
}
const element = document.getElementById('my-app');
app.start(element, model, view, update);
`;

function write(file_name, text, title = 'Creating') {
  const file = path.resolve(file_name);
  if (!fs.existsSync(file)) {
    process.stdout.write(`${title}: ${file} ... `);
    fs.writeFileSync(
      file,
      text
    );
    process.stdout.write('Done\n');
  } else {
    process.stdout.write(`No change made. File exists: ${file}\n`);
  }
}

function init() {
  RegExp.prototype.toJSON = RegExp.prototype.toString;

  if (!fs.existsSync(package_json)) {
    console.log('Initializing package.json');
    execSync('npm init -y');
  }

  console.log('Installing packages. This might take a couple minutes.');
  execSync('npm install webpack webpack-dev-server ts-loader typescript --save-dev');
  execSync('npm install apprun --save');

  write(tsconfig_json, tsconfig);
  write(webpack_config_js, webpack_config)
  write(index_html, index);
  write(main_tsx, main);
  write(git_ignore_file, git_ignore);

  console.log('Adding npm scripts');
  const package_info = require(package_json);
  if (!package_info.scripts || ! package_info.scripts['start']) {
    package_info["scripts"]["start"] = 'webpack-dev-server';
  }
  if (!package_info.scripts || ! package_info.scripts['build']) {
    package_info["scripts"]["build"] = 'webpack -p';
  }
  fs.writeFileSync(
    package_json,
    JSON.stringify(package_info, null, 2)
  );

  console.log('Initializing git');
  execSync('git init');
}

const component_template = `import app, {Component} from './node_modules/apprun/index';

export default class #nameComponent extends Component {
  state = '#name';

  view = (state) => {
    return <div>
      <h1>{state}</h1>
    </div>
  }

  update = {
    '##name': state => state,
  }
}


// to use this component in main.tsx
// import #name from './#name';
// const element = document.getElementById('my-app');
// new #name().mount(element);
`;

function component(name) {
  const fn = path.resolve(name + '.tsx');
  write(name + '.tsx', component_template.replace(/\#name/g, name),
    `Creating component ${name}`)
}

program
 .version('1.0.1')
 .option('-i, --init', 'Initialize AppRun Project')
 .option('-c, --component <file>', 'Generate AppRun component')
 .parse(process.argv);

program._name = 'apprun';

if (!program.init && !program.component) {
  program.outputHelp();
}

if (program.init) init();
if (program.component) component(program.component);