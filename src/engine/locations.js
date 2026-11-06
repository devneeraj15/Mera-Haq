/**
 * Canonical registry of Indian States and Union Territories.
 * 28 States + 8 Union Territories (position after the 2020 merger of
 * Dadra & Nagar Haveli and Daman & Diu, and the 2019 J&K reorganisation).
 * Codes follow the ISO 3166-2:IN subdivision suffixes.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MeraHaqLocations = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const STATES = [
    ["AP", "Andhra Pradesh"], ["AR", "Arunachal Pradesh"], ["AS", "Assam"], ["BR", "Bihar"],
    ["CT", "Chhattisgarh"], ["GA", "Goa"], ["GJ", "Gujarat"], ["HR", "Haryana"],
    ["HP", "Himachal Pradesh"], ["JH", "Jharkhand"], ["KA", "Karnataka"], ["KL", "Kerala"],
    ["MP", "Madhya Pradesh"], ["MH", "Maharashtra"], ["MN", "Manipur"], ["ML", "Meghalaya"],
    ["MZ", "Mizoram"], ["NL", "Nagaland"], ["OR", "Odisha"], ["PB", "Punjab"],
    ["RJ", "Rajasthan"], ["SK", "Sikkim"], ["TN", "Tamil Nadu"], ["TG", "Telangana"],
    ["TR", "Tripura"], ["UP", "Uttar Pradesh"], ["UK", "Uttarakhand"], ["WB", "West Bengal"],
  ].map(([code, name]) => Object.freeze({ code, name, type: "STATE" }));

  const UNION_TERRITORIES = [
    ["AN", "Andaman and Nicobar Islands"], ["CH", "Chandigarh"],
    ["DH", "Dadra and Nagar Haveli and Daman and Diu"], ["DL", "Delhi"],
    ["JK", "Jammu and Kashmir"], ["LA", "Ladakh"], ["LD", "Lakshadweep"], ["PY", "Puducherry"],
  ].map(([code, name]) => Object.freeze({ code, name, type: "UNION_TERRITORY" }));

  const ALL = Object.freeze([...STATES, ...UNION_TERRITORIES]);
  const BY_CODE = Object.freeze(Object.fromEntries(ALL.map((l) => [l.code, l])));

  function isValidLocationCode(code) {
    return typeof code === "string" && Object.prototype.hasOwnProperty.call(BY_CODE, code);
  }
  function locationName(code) {
    return isValidLocationCode(code) ? BY_CODE[code].name : null;
  }

  return Object.freeze({ STATES, UNION_TERRITORIES, ALL, BY_CODE, isValidLocationCode, locationName });
});
