import Config from "../config.js";

const updateTitle = (title) => document.title = title;

const toPrependedPath = (path) => `${Config.APP_PREFIX}${path}`;

const toAppPath = (page) => toPrependedPath(`/?page=${page}`);

const CLASS_NAV_SELECTED = 'nav__link__selected';

const BaseView = (model) => {
  return {
    render: () => {
      const navProjects = document.getElementById('nav-link-projects');
      navProjects.classList.remove(CLASS_NAV_SELECTED);
      navProjects.setAttribute('href', toAppPath(`/projects/${model.getActiveProjectName()}`));

      const navActiveProject = document.getElementById('nav-active-project');
      navActiveProject.innerHTML = `&lt;${model.getActiveProjectName()}&gt;`;

      const navSamples = document.getElementById('nav-link-samples');
      navSamples.classList.remove(CLASS_NAV_SELECTED);
      navSamples.setAttribute('href', toAppPath(`/projects/${model.getActiveProjectName()}/samples`));

      const navProgressions = document.getElementById('nav-link-progressions');
      navProgressions.classList.remove(CLASS_NAV_SELECTED);
      navProgressions.setAttribute('href', toAppPath(`/projects/${model.getActiveProjectName()}/progressions`));

      const navCompositions = document.getElementById('nav-link-compositions');
      navCompositions.classList.remove(CLASS_NAV_SELECTED);
      navCompositions.setAttribute('href', toAppPath(`/projects/${model.getActiveProjectName()}/compositions`));

      console.log('model.getPageFrags ' + JSON.stringify(model.getPageFrags()));
      console.log('model.getLogicalPageFrags ' + JSON.stringify(model.getLogicalPageFrags()));

      if (model.getLogicalPageFrags()[0] === 'projects' && model.getPageFrags()[1] === model.getActiveProjectName()) {
        switch (model.getLogicalPageFrags()[2]) {
          case 'compositions': {
            navCompositions.classList.add(CLASS_NAV_SELECTED);
          }
          break;
          case 'progressions': {
            navProgressions.classList.add(CLASS_NAV_SELECTED);
          }
          break;
          case 'samples': {
            navSamples.classList.add(CLASS_NAV_SELECTED);
          }
          break;
          default: {
            navProjects.classList.add(CLASS_NAV_SELECTED);
          }
          break;
        }
      }

      const appDiv = document.getElementById('app');
      appDiv.innerHTML = '';
      return Promise.resolve({
        updateTitle,
        getAppDiv: () => appDiv
      });
    }
  };
};
BaseView.updateTitle = updateTitle;
BaseView.toAppPath = toAppPath;

export default BaseView;
