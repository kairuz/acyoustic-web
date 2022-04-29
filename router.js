import BaseController from "./controllers/base-controller.js";
import ProjectsController from "./controllers/projects-controller.js";
import SamplesController from "./controllers/samples-controller.js";
import ProgressionsController from "./controllers/progressions-controller.js";
import CompositionsController from "./controllers/compositions-controller.js";

import ProjectsView from "./views/projects-view.js";
import SamplesView from "./views/samples-view.js";
import ProgressionsView from "./views/progressions-view.js";
import CompositionsView from "./views/compositions-view.js";
import NotFoundView from "./views/notfound-view.js";
import ErrorView from "./views/error-view.js";


const state = {};
let activeView = null;

const CONTROLLER_MAPPINGS = {
  'projects'                    : ProjectsController,
  'projects/{}'                 : ProjectsController,
  'projects/{}/samples'         : SamplesController,
  'projects/{}/progressions'    : ProgressionsController,
  'projects/{}/compositions'    : CompositionsController
};

const VIEWS = {
  PROJECTS      : 'projects',
  SAMPLES       : 'samples',
  PROGRESSIONS  : 'progressions',
  COMPOSITIONS  : 'compositions',
  NOT_FOUND     : 'notFound',
  ERROR         : 'error'
};

const VIEW_MAPPINGS = {
  [VIEWS.PROJECTS]      : ProjectsView,
  [VIEWS.SAMPLES]       : SamplesView,
  [VIEWS.PROGRESSIONS]  : ProgressionsView,
  [VIEWS.COMPOSITIONS]  : CompositionsView,
  [VIEWS.NOT_FOUND]     : NotFoundView,
  [VIEWS.ERROR]         : ErrorView
};

const toSanitizedPage = (page) => {
  const pageNoLeadingSlash = page.startsWith('/') ? page.substring(1) : page;
  const pageNoLeadingOrTrailingSlash = pageNoLeadingSlash.endsWith('/') ? pageNoLeadingSlash.substring(0, pageNoLeadingSlash.length - 1) : pageNoLeadingSlash;
  return pageNoLeadingOrTrailingSlash.toLowerCase();
};

const toParams = (searchParams) => {
  const page = searchParams.has('page') ? searchParams.get('page') : 'projects';
  const sanitizedPage = toSanitizedPage(page);
  const sanitizedPageFrags = sanitizedPage.split('/');
  const logicalPageFrags = [...sanitizedPageFrags];

  const projectName = 1 in sanitizedPageFrags ? sanitizedPageFrags[1] : null;

  if (1 in sanitizedPageFrags) {
    logicalPageFrags[1] = '{}';
  }

  const logicalPage = logicalPageFrags.join('/');

  console.log(`route page=${page}, sanitizedPage=${sanitizedPage}, logicalPage=${logicalPage}, projectName=${projectName}, searchParams=${searchParams}`);
  return {
    page: sanitizedPage,
    pageFrags: sanitizedPageFrags,
    logicalPage,
    logicalPageFrags,
    projectName
  };
};

const route = () => {
  if (activeView !== null && 'dispose' in activeView && typeof activeView.dispose === 'function') {
    console.log('route() disposing activeView');
    activeView.dispose();
  }
  else {
    console.log(`route() no activeView dispose activeView !== null ${activeView !== null} && 'dispose' in activeView ${activeView ? 'dispose' in activeView : undefined} && typeof activeView.dispose === 'function' ${typeof activeView?.dispose === 'function'}`);
  }
  const params = toParams(new URLSearchParams(window.location.search));

  const controller = params.logicalPage in CONTROLLER_MAPPINGS ? CONTROLLER_MAPPINGS[params.logicalPage] : BaseController;
  console.log('ROUTER !!! controller ' + controller?.name);

  controller(state, params).handle()
    .then((modelAndView) => {
      const view = VIEW_MAPPINGS[modelAndView.getView()];
      console.log('controller view resolved ' + view?.name + ' ' + JSON.stringify(modelAndView.getModel()), modelAndView.getModel());
      activeView = view(modelAndView.getModel());
      return activeView.render();
    })
    .catch((err) => {
      console.log('controller handle catch', err);
      return Promise.reject(err);
    })
    .then(() => console.log('view rendered'))
    .catch((modelAndView) => {
      console.log('controller view render rejected, modelAndView=', modelAndView,
                  ('getModel' in modelAndView ? JSON.stringify(modelAndView.getModel()) : undefined), 'getModel' in modelAndView ? modelAndView.getModel() : undefined);
      activeView = NotFoundView(modelAndView.getModel());
      return activeView.render()
        .then(() => console.log('error view rendered'));
    })
    .then(() => console.log('router done'));

};


export default {route, VIEWS};
