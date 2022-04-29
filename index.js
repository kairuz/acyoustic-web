import router from "./router.js";

const navigateTo = (url) => {
  console.log(`navigate to ${url}`);
  history.pushState(null, null, url);
  router.route();
};

window.addEventListener('popstate', router.route);

document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', e => {
    if (e.target.matches('[data-link]')) {
      e.preventDefault();
      navigateTo(e.target.href);
    }
  });

  router.route();
});


