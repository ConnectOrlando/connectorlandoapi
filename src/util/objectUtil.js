/**
 * Deeply seals and freezes object. Prevents any extensions and makes existing properties non-configurable and prevents object from being changed. New properties cannot be added, existing properties cannot be removed, their enumerability, configurability, writability, or value cannot be changed, and the object's prototype cannot be re-assigned. Also overwrites all toString methods for functions, to ensure privacy.
 * @template T
 * @param {T} object - object to finalize
 * @returns {T} sealed and frozen input
 */
export function finalize(object) {
  if (object && typeof object === 'object') {
    return recursivelyFinalizeAllPropertiesIn(object);
  }
  return object;
}

function recursivelyFinalizeAllPropertiesIn(object) {
  const keys = Object.keys(object);
  for (const key of keys) {
    const property = object[key];
    if (typeof property === 'object') {
      recursivelyFinalizeAllPropertiesIn(property);
    } else if (typeof property === 'function') {
      property.toString = () => {
        return `${key} --- AttendSimple`;
      };
    }
  }
  Object.seal(object);
  Object.freeze(object);
  return object;
}

export default {
  finalize,
};
