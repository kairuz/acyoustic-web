import Config from "../config.js";
import ProgressionsController from "./progressions-controller.js";
import Router from "../router.js";


const initProjectCompositions = (sourceCompositions) => Object.entries(sourceCompositions).reduce((accComps, curComp) => {
  accComps[curComp[0]] = [...curComp[1].map((progAndDur) => [progAndDur[0], progAndDur[1]])];
  return accComps;
}, {});

const ensureStateCompositions = (state) => {
  if (!('compositions' in state.project)) {
    state.project.compositions = initProjectCompositions(Config.PROJECTS_DATA[state.project.name].compositions);
  }
};

const CompositionsController = (state, params) => {
  return {
    handle: () => {
      return ProgressionsController(state, params)
        .handle()
        .then((modelAndView) => {
          ensureStateCompositions(state);

          const model = {
            ...modelAndView.getModel(),
            getCompositions: () => state.project.compositions
          };

          return Promise.resolve({
            getModel: () => model,
            getView: () => Router.VIEWS.COMPOSITIONS
          });
        })
        // .catch((baseControllerRejected) => {
        //   console.log('in ProjectsController  return BaseController().handle().catch ' + JSON.stringify(baseControllerRejected));
        // })
    }
  }
};
CompositionsController.initProjectCompositions = initProjectCompositions;
CompositionsController.ensureStateCompositions = ensureStateCompositions;

export default CompositionsController;
