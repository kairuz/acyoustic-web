import BaseView from "./base-view.js";


const NotFoundView = (model) => {
  return {
    render: () =>
      BaseView(model)
        .render()
        .then((baseView) => {
          baseView.updateTitle('Not Found');
          const notFoundHeading = document.createElement('h1');
          notFoundHeading.appendChild(document.createTextNode('Not Found'));
          baseView.getAppDiv().appendChild(notFoundHeading);
          return Promise.resolve();
        })
  }
};


export default NotFoundView;

