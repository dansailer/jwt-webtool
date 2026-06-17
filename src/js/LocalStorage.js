// LocalStorage.js
// ------------------------------------------------------------------

function AppScopedStoreManager(appid) {
  this.appid = appid;
}

AppScopedStoreManager.prototype.get = function (key) {
  return window.localStorage.getItem(this.appid + ".datamodel." + key);
};

AppScopedStoreManager.prototype.remove = function (key) {
  return window.localStorage.removeItem(this.appid + ".datamodel." + key);
};

AppScopedStoreManager.prototype.store = function (key, value) {
  return window.localStorage.setItem(this.appid + ".datamodel." + key, value);
};

export function init(id) {
  return new AppScopedStoreManager(id);
}

export default { init };