!function(e,n){"object"==typeof exports&&"object"==typeof module?module.exports=n():"function"==typeof define&&define.amd?define([],n):"object"==typeof exports?exports.aggro=n():e.aggro=n()}(this,function(){return function(e){var n={};function r(t){if(n[t])return n[t].exports;var u=n[t]={i:t,l:!1,exports:{}};return e[t].call(u.exports,u,u.exports,r),u.l=!0,u.exports}return r.m=e,r.c=n,r.d=function(e,n,t){r.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:t})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,n){if(1&n&&(e=r(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(r.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var u in e)r.d(t,u,function(n){return e[n]}.bind(null,u));return t},r.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(n,"a",n),n},r.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},r.p="",r(r.s=0)}([function(e,n,r){"use strict";var t=function(){return function(e,n){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return function(e,n){var r=[],t=!0,u=!1,o=void 0;try{for(var i,f=e[Symbol.iterator]();!(t=(i=f.next()).done)&&(r.push(i.value),!n||r.length!==n);t=!0);}catch(e){u=!0,o=e}finally{try{!t&&f.return&&f.return()}finally{if(u)throw o}}return r}(e,n);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),u=function(e){return e?e.valueOf():e},o=function(e){return void 0!==e},i=function(e){for(var n=void 0,r=0;r<e.length;r++)(void 0===n||e[r]<n)&&(n=e[r]);return n},f=function(e){for(var n=void 0,r=0;r<e.length;r++)(void 0===n||e[r]>n)&&(n=e[r]);return n},a=function(e){for(var n=void 0,r=void 0,t=0;t<e.length;t++)(void 0===n||e[t]>n)&&(n=e[t]),(void 0===r||e[t]<r)&&(r=e[t]);return[r,n]},l=function(e){var n=[],r=[];return e.forEach(function(e){var t=u(e);-1===n.indexOf(t)&&(n.push(t),r.push(e))}),r},c=function e(n,r,u){if(r.length){var o=new Map,i=r[0],f="function"==typeof i?i:function(e){return e[i]};n.forEach(function(e){var n=f(e),r=f(e).valueOf(),t=o.get(r);t?t.values.push(e):o.set(r,{key:n,values:[e]})}),n=Array.from(o.values())}else n=[{key:null,values:n}];var a=r.slice(1);return n=n.map(function(n){return function(e,n){for(var r=function(r){var u=t(n[r],4),o=u[0],i=u[1],f=u[2],a=u[3],l=f(e.values.map(function(e){return e[o]}).filter(function(e){return void 0!==e}));e[i]=a?a(l):l},u=0;u<n.length;u++)r(u)}(n,u),a.length&&(n.values=e(n.values,a,u)),n})},v=function(e,n){return e<n?-1:e>n?1:e>=n?0:NaN};e.exports=function e(){var n=[],r=[],g=[],y=null;function s(e){var t=e.filter(function(e){for(var r=0;r<n.length;r++){var t=n[r],o=t.key?u(e[t.key]):e;if(t.test){if(!t.test(o,e[t.key]))return!1}else if("<="===t.type){if(o>t.value)return!1}else if(">="===t.type){if(o<t.value)return!1}else if(">"===t.type){if(o<=t.value)return!1}else if("<"===t.type){if(o>=t.value)return!1}else if("in"===t.type){var i=t.value;if(1===i.length){if(i[0]!==o)return!1}else if(-1===i.indexOf(o))return!1}}return!0});return t=c(t,g,r),y&&t.sort(function(e,n){return y(u(e.key),u(n.key))}),t}return s.filter=function(e,r){if("object"==typeof e)n.push(e);else if("function"!=typeof e||r){if("function"!=typeof r&&void 0!==r){var t=u(r);r=function(e){return e===t}}r?n.push({key:e,type:"eq",test:r}):console.warn("Aggro.filter was called without any filter created!")}else n.push({key:null,type:"eq",test:e});return s},s.in=function(e,n){var r=(Array.isArray(n)?n:[n]).filter(o);return r.length&&s.filter({key:e,type:"in",value:l(r).map(u)}),s},s.between=function(e,n){var r=null,u=null;if(!Array.isArray(n))return s.filter(e,n);if(1===n.length)return s.filter(e,n[0]);if(2===n.length){var o=t(n,2);r=o[0],u=o[1]}else if(n.length>2){var i=a(n.filter(function(e){return null!=e})),f=t(i,2);r=f[0],u=f[1]}return null!=r&&s.filter({key:e,type:">=",value:r}),null!=u&&s.filter({key:e,type:"<=",value:u}),s},s.aggregate=function(e,n,t){var u=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"aggr_"+e;return r.push([e,u,n,"function"==typeof t?t:null]),s},s.sortKeys=function(e){return y="function"==typeof e?e:e||void 0===e?v:null,s},s.sum=function(e,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"sum_"+e;return s.aggregate(e,function(e){return e.reduce(function(e,n){return e+n},0)},n,r)},s.mean=function(e,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"mean_"+e;return s.aggregate(e,function(e){return e.reduce(function(e,n){return e+n},0)/e.length},n,r)},s.uniq=function(e,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"uniq_"+e;return s.aggregate(e,l,n,r)},s.count=function(e,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"count_"+e;return s.aggregate(e,function(e){return l(e).length},n,r)},s.min=function(e,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"min_"+e;return s.aggregate(e,i,n,r)},s.max=function(e,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"max_"+e;return s.aggregate(e,f,n,r)},s.range=function(e,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"range_"+e;return s.aggregate(e,a,n,r)},s.one=function(e,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:e;return s.aggregate(e,function(e){return e[0]},n,r)},s.groupBy=function(e){return g=null==e?[]:Array.isArray(e)?e.filter(function(e){return null!=e}):[e],s},s.copy=function(){var t=e().groupBy(g);return n.forEach(function(e){return t.filter(e)}),r.forEach(function(e){return t.aggregate(e[0],e[2],e[3],e[1])}),t.sortKeys(y),t},s.data=s,s}}])});