import Config from "../config.js";
import DataController from "./data-controller.js";
import Router from "../router.js";


const initProjectProgressions = (sourceProgressions) => Object.entries(sourceProgressions).reduce((accProgs, curProg) => {
  accProgs[curProg[0]] = Object.entries(curProg[1]).reduce((accTimings, curTiming) => {
    accTimings[curTiming[0]] = curTiming[1];
    return accTimings;
  }, {});
  return accProgs;
}, {});

const ensureStateProgressions = (state) => {
  if (!('progressions' in state.project)) {
    state.project.progressions = initProjectProgressions(Config.PROJECTS_DATA[state.project.name].progressions);
  }
};

const ProgressionsController = (state, params) => {
  return {
    handle: () => {
      return DataController(state, params)
        .handle()
        .then((modelAndView) => {
          ensureStateProgressions(state);

          const model = {
            ...modelAndView.getModel(),
            getProgressions: () => state.project.progressions
          };

          return Promise.resolve({
            getModel: () => model,
            getView: () => Router.VIEWS.PROGRESSIONS
          });
        })
        // .catch((baseControllerRejected) => {
        //   console.log('in ProjectsController  return BaseController().handle().catch ' + JSON.stringify(baseControllerRejected));
        // })
    }
  }
};
ProgressionsController.initProjectProgressions = initProjectProgressions;
ProgressionsController.ensureStateProgressions = ensureStateProgressions;

export default ProgressionsController;
