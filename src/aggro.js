/* eslint-env es6, browser, commonjs, amd */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) { define([], factory); }
  else if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.aggro = factory(); }
}(this, () => {

  // valueOf convert items being worked on this is mostly important because
  // dates need to be processed as numbers rather than strings (the default)
  const normalize = val => (val ? val.valueOf() : val);

  const defined = val => val !== undefined;

  const min = arr => {
    let minVal;
    for (let i = 0; i < arr.length; i++) {
      if (minVal === undefined || arr[i] < minVal) {
        minVal = arr[i];
      }
    }
    return minVal;
  };

  const max = arr => {
    let maxVal;
    for (let i = 0; i < arr.length; i++) {
      if (maxVal === undefined || arr[i] > maxVal) {
        maxVal = arr[i];
      }
    }
    return maxVal;
  };

  const extent = arr => {
    let maxVal, minVal;
    for (let i = 0; i < arr.length; i++) {
      if (maxVal === undefined || arr[i] > maxVal) {
        maxVal = arr[i];
      }
      if (minVal === undefined || arr[i] < minVal) {
        minVal = arr[i];
      }
    }
    return [ minVal, maxVal ];
  };

  const uniq = arr => {
    const seen = [];
    const list = [];
    arr.forEach(val => {
      const s = normalize(val);
      if (seen.indexOf(s) === -1) {
        seen.push(s);
        list.push(val);
      }
    });
    return list;
  };

  const aggregations = (group, aggrs) => {
    // expose aggregate dims
    for (let ai = 0; ai < aggrs.length; ai++) {
      const [ key, id, fn, cb ] = aggrs[ai];
      const n = fn(group.values.map(d => d[key]).filter(d => d !== undefined));
      group[id] = cb ? cb(n) : n;
    }
    return group;
  };

  const splitBy = (data, keys, aggrs) => {
    if (keys.length) {
      const byKey = new Map();
      const joinKey = keys[0];
      const joinFn = typeof joinKey === 'function' ? joinKey : d => d[joinKey];
      data.forEach(d => {
        const key = joinFn(d);
        const keyRef = joinFn(d).valueOf();
        const group = byKey.get(keyRef);
        if (group) {
          group.values.push(d);
        }
        else {
          byKey.set(keyRef, { key: key, values: [ d ] });
        }
      });
      data = Array.from(byKey.values());
    }
    else {
      data = [ { key: null, values: data } ];
    }
    // convert data into join object and run aggregates
    const remainkeys = keys.slice(1);
    data = data.map(group => {
      aggregations(group, aggrs);
      if (remainkeys.length) {
        // recurse split the values if more keys are found
        group.values = splitBy(group.values, remainkeys, aggrs);
      }
      return group;
    });
    return data;
  };

  // eslint-disable-next-line
  const collate = (a, b) => (a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN);

  function Aggro () {
    const filters = [];
    const aggrs = [];
    let joinKeys = [];
    let sortFn = null;

    function aggro (data) {
      // run filters
      let retdata = data
        .filter(d => {
          for (let fi = 0; fi < filters.length; fi++) {
            const filter = filters[fi];
            const value = filter.key ? normalize(d[filter.key]) : d;
            if (filter.test) {
              if (!filter.test(value, d[filter.key])) {
                return false;
              }
            }
            // NB: Because this is rejection based, the assertions must be the inverse (not) of the filter
            else if (filter.type === '<=') {
              if (value > filter.value) {
                return false;
              }
            }
            else if (filter.type === '>=') {
              if (value < filter.value) {
                return false;
              }
            }
            else if (filter.type === '>') {
              if (value <= filter.value) {
                return false;
              }
            }
            else if (filter.type === '<') {
              if (value >= filter.value) {
                return false;
              }
            }
            else if (filter.type === 'in') {
              const allowed = filter.value;
              if (allowed.length === 1) {
                if (allowed[0] !== value) {
                  return false;
                }
              }
              else if (allowed.indexOf(value) === -1) {
                return false;
              }
            }
          }
          return true;
        });

      // run splits & aggregates
      retdata = splitBy(retdata, joinKeys, aggrs);

      if (sortFn) {
        retdata.sort((a, b) => {
          return sortFn(normalize(a.key), normalize(b.key));
        });
      }

      return retdata;
    }

    aggro.filter = (key, test) => {
      if (typeof key === 'object') {
        filters.push(key);
      }
      else if (typeof key === 'function' && !test) {
        filters.push({
          key: null,
          type: 'eq',
          test: key
        });
      }
      else {
        if (typeof test !== 'function' && test !== undefined) {
          const nTest = normalize(test);
          test = d => d === nTest;
        }
        if (test) {
          filters.push({
            key: key,
            type: 'eq',
            test: test
          });
        }
        else {
          console.warn('Aggro.filter was called without any filter created!');
        }
      }
      return aggro;
    };

    aggro.in = (key, val) => {
      const list = (Array.isArray(val) ? val : [ val ]).filter(defined);
      if (list.length) {
        aggro.filter({
          key: key,
          type: 'in',
          value: uniq(list).map(normalize)
        });
      }
      return aggro;
    };

    aggro.between = (key, val) => {
      let start = null;
      let end = null;
      if (!Array.isArray(val)) {
        return aggro.filter(key, val);
      }
      else if (val.length === 1) {
        return aggro.filter(key, val[0]);
      }
      else if (val.length === 2) {
        [ start, end ] = val;
      }
      else if (val.length > 2) {
        [ start, end ] = extent(val.filter(d => d != null));
      }
      if (start != null) {
        aggro.filter({
          key: key,
          type: '>=',
          value: start
        });
      }
      if (end != null) {
        aggro.filter({
          key: key,
          type: '<=',
          value: end
        });
      }
      return aggro;
    };

    aggro.aggregate = (key, values, cb, keyName = `aggr_${key}`) => {
      aggrs.push([
        key,
        keyName,
        values,
        typeof cb === 'function' ? cb : null
      ]);
      return aggro;
    };

    aggro.sortKeys = fn => {
      if (typeof fn === 'function') {
        sortFn = fn;
      }
      else if (!!fn || fn === undefined) {
        // can trigger sorting by aggro().sortKeys()
        sortFn = collate;
      }
      else {
        sortFn = null;
      }
      return aggro;
    };

    aggro.sum = (key, cb, keyName = `sum_${key}`) => {
      return aggro.aggregate(key, values => values.reduce((a, b) => a + b, 0), cb, keyName);
    };

    aggro.mean = (key, cb, keyName = `mean_${key}`) => {
      return aggro.aggregate(key, values => values.reduce((a, b) => a + b, 0) / values.length, cb, keyName);
    };

    aggro.uniq = (key, cb, keyName = `uniq_${key}`) => {
      return aggro.aggregate(key, uniq, cb, keyName);
    };

    aggro.count = (key, cb, keyName = `count_${key}`) => {
      return aggro.aggregate(key, values => uniq(values).length, cb, keyName);
    };

    aggro.min = (key, cb, keyName = `min_${key}`) => {
      return aggro.aggregate(key, min, cb, keyName);
    };

    aggro.max = (key, cb, keyName = `max_${key}`) => {
      return aggro.aggregate(key, max, cb, keyName);
    };

    aggro.range = (key, cb, keyName = `range_${key}`) => {
      return aggro.aggregate(key, extent, cb, keyName);
    };

    aggro.one = (key, cb, keyName = key) => {
      return aggro.aggregate(key, values => values[0], cb, keyName);
    };

    aggro.groupBy = (key) => {
      if (key == null) {
        joinKeys = [];
      }
      else if (Array.isArray(key)) {
        joinKeys = key.filter(d => d != null);
      }
      else {
        joinKeys = [ key ];
      }
      return aggro;
    };

    aggro.copy = () => {
      const clone = Aggro().groupBy(joinKeys);
      filters.forEach(d => clone.filter(d));
      aggrs.forEach(d => clone.aggregate(d[0], d[2], d[3], d[1]));
      clone.sortKeys(sortFn);
      return clone;
    };

    aggro.data = aggro;

    return aggro;
  };

  // expose
  return Aggro;

}));
