/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

/*require('../support/lambdajs/utils').expose(global);
require('../support/lambdajs/lambda').expose();
require('lenses').expose('global');
var curry = require('lodash.curry');
var Maybe = require('pointfree-fantasy/instances/maybe');
var Promise = require('../support/promise');*/

/*require('./pointfree-fantasy').expose(global); // or if browser pointfree.expose(window)
var Maybe = require('./pointfree-fantasy/instances/maybe');*/

import topsort = require('topsort');
import {Before, After} from './constraints';
import {IMenuItem} from './menu';
class MenuItem {
  constructor(public msg:any) {}
}


var test_array = [
  {
    location: ["File", "New", "Window"],
    command: "file.new.window",
    constraints: {
      "Window": [new Before('Tab')]
    }
  },
  {
    location: ["File", "New", "Tab"],
    command: "file.new.tab",
    constraints: {
      "Tab": [new After('Window')]
    }
  },
  {
    location: ["File", "New", "Document"],
    command: "file.new.document"
  },
  {
    location: ['Edit', 'Copy'],
    command: "edit.copy"
  },
  {
    location: ['Edit', 'Cut'],
    command: "edit.cut"
  }
]


/**
 * Components
 */

/**
 * Takes an item and returns the location with the item attached as 'menuItem'
 */
var itemTranspose = (item: any) => {
  var ret = item.location;
  ret.menuItem = item;
  return ret;
}

var buildItem = function(item: any) {
  return new MenuItem({
    text: item[-1],
    shortcut: item.menuItem.shortcut
  });
}

var sortItems = (obj: any[]) => { obj.sort(); return obj; };

var getItemsAtLevel = function( items: IMenuItem[], level: string[] ): any[] {
  var num = level.length;
  return items.map( function(val) {
    if( (val.location.length > num) && (val.location.slice(0,num+1) === level) ) {
      return itemTranpose(val);
    }
  });
}

var matchesPrefix = function(prefix: string[], item: string[]): boolean {
  if( item.length >= prefix.length && item.slice(0,prefix.length) == prefix ) {
    return true;
  }
  return false;
}

var itemForConstraint = function(prefix: string[], item: string[]): string {
  return item.slice(prefix.length-1,prefix.length)[0];
}

/**
 * given a level such as
 *
 */
var getConstraints = function(items: string[][], prefix: string[]): string[][] {
  var constraints: string[][] = [];

  for(var i=0; i<items.length; ++i) {
    if(matchesPrefix(prefix, items[i])) {
      // work out which item in this part of the tree is required
      var consItem = itemForConstraint(prefix, items[i]);

      // pull out the constraints for that item
      var cons = items[i].menuItem.constraints[consItem];

      // now we have an array of constraints, actually constrain them and
      // push them onto the constraints var above.
      cons.map( (c: any) => {
          constraints.push( c.constrain( items[i] ) );
      });
    }
  }
  return constraints;
}

/*var sortBasedOn*/


var partialSolve = function( items, prefix ): MenuItem[] {
  var menu_items = [];
  var levelItems = getItemsAtLevel( items, prefix );
  sortItems( levelItems );

  var startIdx = 0;
  var endIdx = 0;
  var preLen = prefix.length;

  while( endIdx < levelItems.length ) {
    var currentVal = levelItems[startIdx];
    if( levelItems[endIdx].length === preLen+1 ) {
      menu_items.push( buildItem( levelItems[endIdx] ) )
    } else {
      while( levelItems[endIdx].length !== preLen+1 ) {
        endIdx++;
      }
      var submenu = partialSolve( levelItems.slice(startIdx,endIdx+1), currentVal.slice(0,preLen+2) );
      var item = new MenuItem({text: currentVal.slice(preLen,preLen+2), submenu:submenu});
      menu_items.push( item );
    }
  }

  var order = topsort.topsort<string>( getConstraints( levelItems ) );
  return menu_items; //.sortBasedOn( order );

}


var my_array = partialSolve( test_array, [] );

console.log(my_array);





/**
 * Actually run it!
 */

/*var getItems( test_array );*/
