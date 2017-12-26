# Aggro

Aggro is a very basic utility to filter and sort a collection of items for use in reports or visualizations. It is very lightweight and has no external dependencies.

It is similar to [d3.nest](https://github.com/d3/d3-collection#nests) or [Crossfilter](square.github.com/crossfilter/), but for when you just need something small and simple.

It provides a few conveniences such as normalised date handling and built-in aggregations but does not have strong dimensional bindings.


# Installing

```
$ npm install aggro
```

It works in a browser as well, exposing itself into the global scope as `aggro` if it is included as a standalone library.


## API Reference

### Basic interface

Input data is assumed to be a simple array of objects. Output data will be a single-level nested array compatible with the output from a d3.nest operator.

Given this input data:

```
const population = [
  { "sex": "male", "age": 35, "eyes": "brown" },
  { "sex": "female", "age": 38, "eyes": "brown" },
  { "sex": "male", "age": 29, "eyes": "brown" },
  { "sex": "female", "age": 19, "eyes": "blue" },
  { "sex": "male", "age": 31, "eyes": "blue" },
  { "sex": "female", "age": 22, "eyes": "brown" },
  { "sex": "male", "age": 22, "eyes": "blue" },
  { "sex": "female", "age": 33, "eyes": "blue" }
];
```

And this operator definition:

```
aggro()
    .filter('eyes', 'brown')
    .groupBy('sex')
    .data(population);
```

The output would look like this: 

```
[{ "key": "male",
   "values": [
      { "sex": "male", "age": 35, "eyes": "brown" },
      { "sex": "male", "age": 29, "eyes": "brown" }]},
  { "key": "female",
    "values": [
      { "sex": "female", "age": 38, "eyes": "brown" },
      { "sex": "female", "age": 22, "eyes": "brown" }]}]
```


#### aggro()

The operation constructor. Calling this will return a new blank aggro operator function:

```
const processor = aggro();
```

The operator function has property methods to define its behavior, most of which return the operator function itself to enable chaining. The operator is a callable function.

```
const dataShaper = aggro().filter('age', d => d > 18).groupBy('eyes');
const byEyeColor = dataShaper(population);
```


#### .data()

A function to pass data into the operator function in a slightly more readable way when chaining operations and using directly. This is the reccomended way of passing data.

```
const byEyeColor = aggro()
    .filter('age', d => d > 18)
    .groupBy('eyes')
    .data(population);
```


#### .copy()

The operator object supports cloning itself through this method. This can be useful if you want to set up multiple operator functions that vary only slightly.

```
const basics = aggro().filter(d => d.age >= 30).groupBy('eyes');

const males = basics.copy().filter('sex', 'male');
const females = basics.copy().filter('sex', 'female');
```


### Filtering data


#### .filter( [ propName ], test )

Exclude any item who's `propName` value does not pass `test`. Test may be either a function or any value other than undefined.

* If `test` is a function, then value is passed to it and removed if the returned value is falsy.

* If `test` is a value then all values must equal it (`===`). 

* If `test` is undefined then nothing will be done.

`propName` may be omitted for simple filter functions which would be similar to prefiltering the input using Array#filter. This would be useful if you intend to reuse or copy the operator.


#### .in( propName, array )

Preclude any item who's `propName` value is not given in `array` of values.

If a single value is passed in, it is automatically wrapped in an array.

> Tip: The simplest shorthand to find items by undefined is `.in('foo', undefined)`


#### .between( propName, array )

Inclusive range filter.

`array` should contain 2 values, start and end. In case a larger value is provided it's min and max values are determined and used.

The input may be open ended: Providing `.between( "foo", [10, null] )` will remove all items where "foo" is less than 10. Similarily, `.between( "foo", [null, 10] )` will remove all items where "foo" is greater than 10.




### Grouping data

#### .groupBy( propName | propNames )

Aggro emits data as a list of groups objects. This happens even when no grouping is specified, in which case the list will only contain a single entry. Every group object will have at least two members, `key` and `values`.

* `key` will be set to the property value found under the property given as `propName`.
* `values` will be set a list of items which share the same property value for `propName`.

```
aggro().groupBy('sex').data(population);

[{ "key": "male",
   "values": [
      { "sex": "male", ... },
      { "sex": "male", ... }]},
  { "key": "female",
    "values": [
      { "sex": "female", ... },
      { "sex": "female", ... }]}]
```

Propname may be set to `null` to clear it. If an array is passed in, the output will be nested in as many levels as there are keys:

```
aggro().groupBy(['sex', 'eyes']).data(population);

[{ "key": "male",
   "values": [
      { "key": "brown"
        "values": [
          { "sex": "male", "eyes", "brown", ... },
          { "sex": "male", "eyes", "brown", ... }
        ]},
      { "key": "blue"
        "values": [
          { "sex": "male", "eyes", "blue", ... },
          { "sex": "male", "eyes", "blue", ... }
        ]}]},
   ...
   
```

Order of the groups will be the same as the order of which the items are found. See *Sorting data* if this is not what you want.




### Aggregating data

Aggregate values can be had for any returned group.

Aggregates can be computed from the values in any returned group. They will be attached to the grouping object using a general naming scheme of aggregate name + underscore + propName.

Generally the aggregate functions take 3 parameters:

1. The `propName` to read the value from.

1. A `postProcessor` function to allows formatting or altering (such as rounding) the value before assigning it to the group object. It defaults to using the value as-is.

1. A `keyName` to allow changing the assignment property name of the aggregate value. It generally defaults to the aggregate method name + underscore + `propName`.


Reusing the general example from *Basic interface*:

```
aggro()
    .filter('eyes', 'brown')
    .mean('age')
    .groupBy('sex')
    .data(population);
```

Results in added aggregates for the groups:

```
[{ "key": "male",
   "values": [
     { "sex": "male", "age": 35, "eyes": "brown" },
     { "sex": "male", "age": 29, "eyes": "brown" }]
   "mean_age": 32 },
 { "key": "female",
   "values": [
     { "sex": "female", "age": 38, "eyes": "brown" },
     { "sex": "female", "age": 22, "eyes": "brown" }]
   "mean_age": 32 }}]
```


#### .sum( propName, [ postProcessor, [ keyName ] ] )

Finds the sum of all values in the group corresponding to `propName`.

The `keyName` defaults to the value of `propName` prefixed by `sum_`.

```
aggro()
    .groupBy('sex')
    .sum('age')
    .data(population);

[{ "key": "male",
   "sum_age": 117,
   "values": [ ... ]},
 { "key": "female",
   "sum_age": 112,
   "values": [ ... ]}}]
```


#### .mean( propName, [ postProcessor, [ keyName ] ] )

Finds the arithmetic mean, or average, for all values in the group corresponding to `propName`.

The `keyName` defaults to the value of `propName` prefixed by `mean_`.

```
aggro()
    .groupBy('sex')
    .mean('age')
    .data(population);

[{ "key": "male",
   "mean_age": 29.25,
   "values": [ ... ]},
 { "key": "female",
   "mean_age": 28,
   "values": [ ... ]}}]
```


#### .uniq( propName, [ postProcessor, [ keyName ] ] )

Finds an array of all unique values in the group corresponding to `propName`.

The `keyName` defaults to the value of `propName` prefixed by `uniq_`.

```
aggro()
    .groupBy('sex')
    .uniq('age')
    .data(population);

[{ "key": "male",
   "uniq_age": [ 35, 29, 31, 22 ],
   "values": [ ... ]},
 { "key": "female",
   "uniq_age": [ 38, 19, 22, 33 ],
   "values": [ ... ]}}]
```


#### .count( propName, [ postProcessor, [ keyName ] ] )

Finds the number of unique values in the group corresponding to `propName`.

The `keyName` defaults to the value of `propName` prefixed by `count_`.

```
aggro()
    .groupBy('sex')
    .count('age')
    .data(population);

[{ "key": "male",
   "count_age": 4,
   "values": [ ... ]},
 { "key": "female",
   "count_age": 4,
   "values": [ ... ]}}]
```


#### .min( propName, [ postProcessor, [ keyName ] ] )

Finds the lowest of the values in the group corresponding to `propName`.

The `keyName` defaults to the value of `propName` prefixed by `min_`.

```
aggro()
    .groupBy('sex')
    .min('age')
    .data(population);

[{ "key": "male",
   "min_age": 22,
   "values": [ ... ]},
 { "key": "female",
   "min_age": 19,
   "values": [ ... ]}}]
```


#### .max( propName, [ postProcessor, [ keyName ] ] )

Finds the highest of the values in the group corresponding to `propName`.

The `keyName` defaults to the value of `propName` prefixed by `max_`.

```
aggro()
    .groupBy('sex')
    .max('age')
    .data(population);

[{ "key": "male",
   "max_age": 35,
   "values": [ ... ]},
 { "key": "female",
   "max_age": 38,
   "values": [ ... ]}}]
```


#### .range( propName, [ postProcessor, [ keyName ] ] )

Finds the lowest and highest of the values in the group corresponding to `propName`. Result is returned as a two item array,

The `keyName` defaults to the value of `propName` prefixed by `range_`.

```
aggro()
    .groupBy('sex')
    .range('age')
    .data(population);

[{ "key": "male",
   "range_age": [22, 35],
   "values": [ ... ]},
 { "key": "female",
   "range_age": [19, 38],
   "values": [ ... ]}}]
```


#### .one( propName, [ postProcessor, [ keyName ] ] )

Promotes the first value corresponding to `propName` from the values to the group object.

The `keyName` defaults to the value of `propName`.

```
aggro()
    .groupBy('sex')
    .one('sex')
    .data(population);

[{ "key": "male",
   "sex": "male",
   "values": [ ... ]},
 { "key": "female",
   "sex": "female",
   "values": [ ... ]}}]
```



#### .aggregate( propName, aggregator, [ postProcessor, [ keyName ] ] )

Allows defining custom aggregations. This works pretty much the same as the built in aggregation functions except that it takes a function, `aggregator`, to compute the aggregate value. In fact, the built in functions use aggregate to preform their actions.

The `keyName` defaults to the value of `propName` prefixed by `aggr_`.


##### Median aggregate example:

```
const median = values => {
  const sorted = values.filter(isFinite).sort((a, b) => a - b);
  if (sorted.length % 2) {
    return sorted[ Math.floor(sorted.length / 2) ];
  }
  else {
    return sorted[ sorted.length / 2 - 1 ] / 2 + sorted[ sorted.length / 2 ] / 2;
  }
};

aggro()
    .groupBy('sex')
    .aggregate('age', median, null, 'median_age')
    .data(population)

[{ "key": "male",
   "mean_age": 32,
   "values": [ ... ]},
 { "key": "female",
   "mean_age": 30,
   "values": [ ... ]}}]
```


##### Frequencies aggregate example:

```
const freq = values => {
  return values.reduce((a, b) => {
    a[b] = (b in a) ? a[b] + 1 : 1;
    return a;
  }, {});
};

aggro()
    .groupBy('sex')
    .aggregate('eyes', freq, null, 'freq_eyes')
    .data(population)

[{ "key": "male",
   "freq_eyes": { "brown": 2, "blue": 2 },
   "values": [ ... ]},
 { "key": "female",
   "freq_eyes": { "brown": 2, "blue": 2 },
   "values": [ ... ]}}]
```


### Sorting data

Aggro assumes that you don't want your output automatically sorted so all values are returned in the order they are found. If you want the output sorted by value you should perform this on the data before passing it to the operator.


#### .sortKeys( [ compareFunction ] )

Despite having the data in order by value, you may still desire to re-order the groups. You could do this with the native `.sort()` on the output, but it may be easier to have Aggro to this for you.

Calling `.sortKeys()` with no parameter or `true` activates default ascending sorting on grouping keys of the output. Calling it with a function uses that function to sort, just like `.sort()` on any regular array would, and calling it with `false` disables sorting.

Note that key values themselves will be passed to the compare function, not the group objects.


