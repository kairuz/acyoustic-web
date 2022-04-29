import gymno from "https://kairuz.github.io/acyoustic/projects/gymno.js";
import climb from "https://kairuz.github.io/acyoustic/projects/climb.js";
import predictament from "https://kairuz.github.io/acyoustic/projects/predictament.js";

export default {
  APP_PREFIX            : '/acyoustic-web',
  DEFAULT_PROJECT_NAME  : 'gymno',
  PROJECTS_DATA         : {
    gymno: gymno,
    climb: climb,
    predictament: predictament
  }
};
