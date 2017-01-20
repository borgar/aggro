// valueOf convert items being worked on this is mostly important because
// dates need to be processed as numbers rather than strings (the default)
const normalize = val => val ? val.valueOf() : val;

const defined = val => val !== undefined;

const min = arr => {
  let minVal;
  for ( let i = 0; i < arr.length; i++ ) {
    if ( minVal === undefined || arr[i] < minVal ) {
      minVal = arr[i];
    }
  }
  return minVal;
};

const max = arr => {
  let maxVal;
  for ( let i = 0; i < arr.length; i++ ) {
    if ( maxVal === undefined || arr[i] > maxVal ) {
      maxVal = arr[i];
    }
  }
  return maxVal;
};

const extent = arr => {
  let maxVal, minVal;
  for ( let i = 0; i < arr.length; i++ ) {
    if ( maxVal === undefined || arr[i] > maxVal ) {
      maxVal = arr[i];
    }
    if ( minVal === undefined || arr[i] < minVal ) {
      minVal = arr[i];
    }
  }
  return [minVal, maxVal];
};

const uniq = arr => {
  const seen = [];
  const list = [];
  arr.forEach( val => {
    const s = normalize( val );
    if ( seen.indexOf( s ) === -1 ) {
      seen.push( s );
      list.push( val );
    }
  });
  return list;
};

module.exports = function Aggr () {
  const filters = [];
  const aggrs = [];
  let joinKey = null;

  function aggr ( data ) {
    // run filters
    let retdata = data
      .filter( d => {
        for ( let fi = 0; fi < filters.length; fi++ ) {
          const filter = filters[fi];
          const value = filter.key ? normalize( d[filter.key] ) : d;
          if ( filter.test ) {
            if ( !filter.test( value, d[filter.key] ) ) {
              return false;
            }
          }
          // NB: Because this is rejection based, the assertions must be the inverse (not) of the filter
          else if ( filter.type === '<=' ) {
            if ( value > filter.value ) {
              return false;
            }
          }
          else if ( filter.type === '>=' ) {
            if ( value < filter.value ) {
              return false;
            }
          }
          else if ( filter.type === '>' ) {
            if ( value <= filter.value ) {
              return false;
            }
          }
          else if ( filter.type === '<' ) {
            if ( value >= filter.value ) {
              return false;
            }
          }
          else if ( filter.type === 'in' ) {
            const allowed = filter.value;
            if ( allowed.length === 1 ) {
              if ( allowed[0] !== value ) {
                return false;
              }
            }
            else if ( allowed.indexOf( value ) === -1 ) {
              return false;
            }
          }
        }
        return true;
      });

    // run splits
    if ( joinKey != null ) {
      const byKey = new Map();
      const joinFn = typeof joinKey === 'function' ? joinKey : d => d[joinKey];
      retdata.forEach( d => {
        const key = joinFn( d );
        const keyRef = joinFn( d ).valueOf();
        const item = byKey.get( keyRef );
        if ( item ) {
          item.values.push( d );
        }
        else {
          byKey.set( keyRef, { key: key, values: [ d ] });
        }
      });
      retdata = Array.from( byKey.values() );
    }
    else {
      retdata = [ { key: null, values: retdata } ];
    }

    // convert data into join object and run aggregates
    retdata = retdata.map( item => {
      // expose aggregate dims
      for ( let ai = 0; ai < aggrs.length; ai++ ) {
        const [ key, id, fn, cb ] = aggrs[ai];

        // TODO: work can be saved here by nesting the keys and re-using the item values
        const n = fn( item.values.map( d => d[key] ).filter( d => d !== undefined ) );
        item[id] = cb ? cb( n ) : n;
      }
      return item;
    });

    return retdata;
  }

  aggr.filter = ( key, test ) => {
    if ( typeof key === 'object' ) {
      filters.push( key );
    }
    else {
      if ( typeof test !== 'function' && test !== undefined ) {
        const nTest = normalize( test );
        test = d => d === nTest;
      }
      if ( test ) {
        filters.push({
          key: key,
          type: 'eq',
          test: test
        });
      }
    }
    return aggr;
  };

  aggr.in = ( key, val ) => {
    const list = ( Array.isArray( val ) ? val : [ val ] ).filter( defined );
    if ( list.length ) {
      aggr.filter({
        key: key,
        type: 'in',
        value: uniq( list ).map( normalize )
      });
    }
    return aggr;
  };

  aggr.between = ( key, val ) => {
    let start = null;
    let end = null;
    if ( !Array.isArray( val ) ) {
      return aggr.filter( key, val );
    }
    else if ( val.length === 1 ) {
      return aggr.filter( key, val[0] );
    }
    else if ( val.length === 2 ) {
      [start, end] = val;
    }
    else if ( val.length > 2 ) {
      [start, end] = extent( val.filter( d => d != null ) );
    }
    if ( start != null ) {
      aggr.filter({
        key: key,
        type: '>=',
        value: start
      });
    }
    if ( end != null ) {
      aggr.filter({
        key: key,
        type: '<=',
        value: end
      });
    }
    return aggr;
  };

  aggr.aggregate = ( key, values, cb, keyName = `aggr_${ key }` ) => {
    aggrs.push( [
      key,
      keyName,
      values,
      typeof cb === 'function' ? cb : null
    ] );
    return aggr;
  };

  aggr.sum = ( key, cb, keyName = `sum_${ key }` ) => {
    return aggr.aggregate( key, values => values.reduce( ( a, b ) => a + b, 0 ), cb, keyName );
  };

  aggr.mean = ( key, cb, keyName = `mean_${ key }` ) => {
    return aggr.aggregate( key, values => values.reduce( ( a, b ) => a + b, 0 ) / values.length, cb, keyName );
  };

  aggr.uniq = ( key, cb, keyName = `uniq_${ key }` ) => {
    return aggr.aggregate( key, uniq, cb, keyName );
  };

  aggr.count = ( key, cb, keyName = `count_${ key }` ) => {
    return aggr.aggregate( key, values => uniq( values ).length, cb, keyName );
  };

  aggr.min = ( key, cb, keyName = `min_${ key }` ) => {
    return aggr.aggregate( key, min, cb, keyName );
  };

  aggr.max = ( key, cb, keyName = `max_${ key }` ) => {
    return aggr.aggregate( key, max, cb, keyName );
  };

  aggr.range = ( key, cb, keyName = `range_${ key }` ) => {
    return aggr.aggregate( key, extent, cb, keyName );
  };

  aggr.one = ( key, cb, keyName = key ) => {
    return aggr.aggregate( key, values => values[0], cb, keyName );
  };

  aggr.groupBy = ( key ) => {
    joinKey = key;
    return aggr;
  };

  aggr.copy = () => {
    const clone = Aggr().groupBy( joinKey );
    filters.forEach( d => clone.filter( d ) );
    aggrs.forEach( d => clone.aggregate( d[0], d[2], d[3], d[1] ) );
    return clone;
  };

  aggr.data = aggr;

  return aggr;
};
