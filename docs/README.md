# Building Applications with AppRun

AppRun is a lightweight library for developing applications using the [elm](http://elm-lang.org/) style
[model-view-update](https://guide.elm-lang.org/architecture/) architecture.

## Architecture

According to the model-view-update  architecture, there are three separated parts in an application.

* Model — the state of your application
* Update — a set of functions to update the state
* View — a function to display the state as HTML

The 15 lines of code below is a simple counter application demonstrates the architecture using AppRun.

```
const model = 0;

const view = (model) => {
  return `<div>
    <h1>${model}</h1>
    <button onclick='app.run("-1")'>-1</button>
    <button onclick='app.run("+1")'>+1</button>
  </div>`;
};

const update = {
  '+1': (model) => model + 1,
  '-1': (model) => model - 1
};

const element = document.getElementById('my-app');
app.start(element, model, view, update);
```

## The Model

The model can be any data structure, a number, an array, or an object that reflects the state of the application.
In the counter example, it is a number.
```
const model = 0;
```

## The Update

The update contains functions that take existing state and create new state.
```
const update = {
  '+1': (model) => model + 1,
  '-1': (model) => model - 1
}
```

## The View

The view generates HTML based on the state. AppRun parses the HTML string into virtual dom. It then calculates the differences against the web page element and renders the changes.

```
const view = (model) => {
  return `<div>
    <h1>${model}</h1>
    <button onclick='app.run("-1")'>-1</button>
    <button onclick='app.run("+1")'>+1</button>
  </div>`;
};
```

## Trigger the Update

_app.run_ is the function to trigger the update.
```
app.run('+1');
```
It can be used in HTML markup directly:
```
<button id="inc" onclick="app.run('+1')">+1</button>
```
Or in JavaScript:
```
document.getElementById('inc').addEventListener('click',
  () => app.run('+1'));
```
Or with JSX:
```
<button onclick={()=>app.run("+1")}>+1</button>
```
Or even with jQuery:
```
$('#inc').on('click', ()=>app.run('+1'));
```

AppRun exposes a global object named _app_ that is accessible by JavaScript and TypScript directly to trigger
the Update.

## Start the Application

_app.start_ function from AppRun ties Model, View and Update together to an element and starts the application.
```
const element = document.getElementById('my-app');
app.start(element, model, view, update);
```

Try it online: [Simple Counter](https://jsfiddle.net/ap1kgyeb/4).

To summarize above, the two functions from AppRun (_app.run_ and _app.start_) are all you need to make
an application of model-view-update architecture.

## State Management

Behind scene AppRun manages application states. It triggers Update; passes the new state created by Update
to View; renders the HTML/Virtual DOM created by View to the element. It also maintains a state history.
It also maintains a state history. The application can have the time travel / undo-redo feature by

* Make Update create immutable state
* Enable AppRun state history

Try it online: [Multiple counters](https://jsfiddle.net/ap1kgyeb/6)

## Virtual DOM

When applications get complex, we start to think performance and build system.

In the simple counter example above, the View creates HTML string out of the state.
Although HTML string is easy to understand and useful for trying out ideas, it takes
time to parse it into virtual dom at run time, which may cause performance issue.
It also has some problems that have been documented by the Facebook React team:
[Why not template literals](http://facebook.github.io/jsx/#why-not-template-literals).

Using JSX, the JSX compiler compiles the JSX into functions at compile time. The functions creates virtual dom in run time directly without parsing HTML, which gives
better performance. Therefore, we recommend using JSX in production. To compile and
build production code, we recommend using TypeScript and webpack

Let's install AppRun and use its CLI to initialize a project.

```
npm install apprun -g
apprun -i
```

The apprun -i command installs apprun, webpack, webpack-dev-server and typescript. It also
generates files: tsconfig.json, webpack.config.js, index.html and main.tsx.

After the command finishes execution, you can start the application.
```
npm start
```


## Component

Another thing to consider when applications get complex is to divide and organize
code into components.

A component in AppRun is a mini model-view-update architecture, which means inside a
component, there are model, view and update. Let's use AppRun CLI to generate a component.

```
apprun -c Counter
```

It generates a Counter component:
```
import app, {Component} from 'apprun';

export default class CounterComponent extends Component {
  state = 'Counter';
  view = (state) => {
    return <div>
      <h1>{state}</h1>
    </div>
  }
  update = {
    '#Counter': state => state,
  }
}
```

To use the Counter component, create an instance of it and then mount the instance to
an element.

```
import Counter from './Counter';
const element = document.getElementById('my-app');
new Counter().mount(element);
```

Notice the update has a '#Counter' function. It is a route.

## Routing

The third thing to consider in complex applications is routing. AppRun has an unique
way of handling routing. It detects the hash changes in URL and calls functions
in update by matching the hash. E.g. when URL in the browser address bar becomes
http://..../#Counter, The #Couter update function of the components will be executed.

Each component defines its route in an update function. Once the URL is changed to
the route the component defined, the update function is triggered and executed.
It can avoid a lot of code for registering and matching routes like in the
other frameworks and libraries.

The AppRun [demo application](https://yysun.github.io/apprun-examples/) was built to have 8
components that are routed into one element.

## Event PubSubs

At core, AppRun is an event publication and subscription system, which is also known as event emitter. It is a commonly used pattern in JavaScript programming.

AppRun has two important functions: _app.run_ and _app.on_. _app.run_ fires events.
_app.on_ handles events. E.g. :

Module A subscribes to an event _print_:
```
import app from 'apprun';
export () => app.on('print', e => console.log(e));
```
Module B publishes the event _print_:
```
import app from 'apprun';
export () => app.run('print', {});
```
Main Module:
```
import a from './A';
import b from './B';
a();
b();
```
Module A and Module B only have to know the event system, not other modules, so they are only dependent on the event system, not other modules. Therefore modules are
decoupled. Thus makes it easier to modify, extend and swap modules.

Use AppRun connect web page events to components. Then it's up to your application to continue executing.

```
document.body.addEventListener('click', e => app.run('click', e) );
element.addEventListener('click', e => app.run('click', e));
<input onclick="e => app.run('click', e)">
```

The biggest benefit of such event system is decoupling. In traditional MVC architecture, the model, view and controller are coupled, which makes it difficult to
test and maintain. In result, there are many architecture patterns have been
developed in order to solve the coupling problem, such as Model-View-Presenter,
Presentation Model and Model-View-ViewModel.

AppRun solved the coupling problem by using event publication and subscription. Model,View and Controller/Update don't know each. They only need to know how to publish and subscribe events by calling _app.run_ and _app.on_ of AppRun.

Even handling routing is just to subscribe to an event.

## Conclusion

AppRun itself is lightweight. It is about 8.7K gzipped. More important is that it makes your application lightweight. In the [Demo App](https://yysun.github.io/apprun-examples/)
built with AppRun,

* The [Todo](https://yysun.github.io/apprun-examples/#todo) written in 90 lines.
* The [Hacker News](https://yysun.github.io/apprun-examples/#hacker-news) was written in 250 lines.

They are clean, precious, declarative and without ceremony.

Please give it a try and send pull request.
