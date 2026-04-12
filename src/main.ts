import { App } from "./app/app";

interface Global {
    App: typeof App;
}
declare const global: Global;
// entryPoints
global.App = App;
