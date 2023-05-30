# [acyoustic-web](https://kairuz.github.io/acyoustic-web)

A web app which presents configured music projects based on Compilations, which are made up of Progressions, which are made up of Samples.
The projects are located in the [acyoustic](https://github.com/kairuz/acyoustic) repo.

acyoustic-web is an MVC implemention, which is made up of a a router that, based on configured handler mapping, will map requests to a controller. 
The router resolves the controller result to a view for rendering.

acyoustic-web makes use of utilities implemented in the [acyoustic](https://github.com/kairuz/acyoustic) project for downloading and scheduling audio.


todo:
- Add project/sample/progression/composition add/edit/delete pages saving state in localstorage.
- Allow progressions to inherit sampling from other progressions.
- Add button allowing user to export localstorage state to json, which user can submit into source control.
- Cancel composition animation timeouts when stopped before ending.
- Add overlay which persists during navigation allowing user to stop any playing any sample/progression/composition. 
- Fix styling issues when clips are too long
