import DataController from "./data-controller.js";
import Router from "../router.js";


const SamplesController = (state, params) => {
  return {
    handle: () => {
      return DataController(state, params)
        .handle()
        .then((modelAndView) => {
          const model = {
            ...modelAndView.getModel()
            // ,
            // getSamples: () => state.project.samples
          };

          return Promise.resolve({
            getModel: () => model,
            getView: () => Router.VIEWS.SAMPLES
          });
        })
    }
  }
};

export default SamplesController;
