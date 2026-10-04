const escapeRegex = (string = '') =>
  String(string ?? '').replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');

export default escapeRegex;
